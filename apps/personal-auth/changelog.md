# Changelog

> 遵循 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/) 格式。
> 记录 `personal-auth` 服务所有逻辑/功能变更。
>
> 版本号与项目根目录 `version` 文件保持一致。

格式规范：

| 类型 | 说明 |
|------|------|
| Added | 新增功能/RPC/字段 |
| Changed | 变更现有逻辑/配置 |
| Deprecated | 标记为废弃 |
| Removed | 移除功能 |
| Fixed | 修复缺陷 |
| Security | 安全修复 |

### 接口记录规范

每个 RPC 变更按以下结构记录：

| 层级 | 说明 |
|------|------|
| 请求 | proto request 字段清单 |
| 响应 | proto response 字段清单 |
| 步骤 | 按执行顺序：数据流动 → 状态变化 |
| 错误 | gRPC status code → 触发条件 |
| 配置 | 影响该接口的配置项 |

数据流符号：`读←[存储]` / `写→[存储]` / `删除→[存储]`

状态变化符号：`变化前 → 变化后`

---

## [Unreleased]

### Added
- <!-- 新增条目在此 -->

### Changed
- RegisterResponse 去掉 account_id 字段，与 LoginResponse 保持一致。前端从 JWT access_token 中解析 account_id。
- ValidateTokenResponse 去掉 account_id 字段，仅返回 role + expires_at。

### Fixed
- <!-- 修复条目在此 -->

---

## [7.0.5] - 2026-05-29

### 数据模型基线

#### accounts（MySQL: personal_user.accounts）
| 字段 | 类型 | 说明 |
|------|------|------|
| account_id | VARCHAR(32) UK | 雪花 ID，19 位补零 |
| role | VARCHAR(16) | 角色（user） |
| status | TINYINT | 0=inactive 1=active 2=frozen |
| password_hash | VARCHAR(64) | PBKDF2 输出 hex(32B) |
| salt | VARCHAR(64) | 16B 随机盐 hex |
| deleted_at | BIGINT | 软删除时间戳，0=未删除 |

#### account_auths（MySQL: personal_user.account_auths）
UK `(auth_type, identifier)`。auth_type 枚举：email / username / phone。

#### login_history（MySQL: personal_user.login_history）
审计仅追加。索引：account_id, identifier, ip_address, created_at。

#### Redis 令牌
| Key 模式 | 类型 | 值 | TTL |
|----------|------|-----|-----|
| `token_<sha256>` | String | `account_id[:role]` | RefreshTokenExpire |
| `token_account_<id>` | Hash | field=sha256(value=0) | 无 |
| `login_lock:<type>:<id>` | String | `1` | LoginLockDuration |
| `login_lock:ip:<ip>` | String | `1` | IPLoginLockDuration |
| `login_attempt:<id>` | String | 计数值 | LoginLockDuration |
| `login_attempt:ip:<ip>` | String | 计数值 | IPLoginLockDuration |

---

### 接口逻辑基线

每个接口包含完整的请求/响应、分步数据流、状态变化、错误映射。

---

#### 1. Register

**请求** ← `RegisterRequest`
```
AuthType auth_type     // email | username | phone
string   identifier    // 登录标识（邮箱/用户名/手机号）
string   password      // 明文密码
```

**响应** → `RegisterResponse`
```
string access_token    // JWT, 1h 过期 (可从中解析 account_id)
string refresh_token   // JWT, 7d 过期
int64  expires_in      // access_token 有效期秒数
```

**步骤**

| # | 操作 | 数据流 | 状态变化 |
|---|------|--------|----------|
| 1 | 参数校验 | — | 非法参数 → gRPC InvalidArgument |
| 2 | `encrypt.Salt()` | 内存生成 16B 随机盐 | — |
| 3 | `encrypt.Key(salt, password)` | PBKDF2(600K, SHA256) | password(明文) → password_hash(hex) |
| 4 | `snowflake.GenerateID()` | 内存生成 | — |
| 5 | BEGIN TX | — | MySQL 事务开始 |
| 6 | INSERT account_auths | `写→[MySQL: account_auths]` | (空) → {account_id, auth_type, identifier, status=1, verified=0} |
|   | 唯一键冲突(1062) | — | → gRPC AlreadyExists, ROLLBACK |
| 7 | INSERT accounts | `写→[MySQL: accounts]` | (空) → {account_id, role=user, status=1, password_hash, salt} |
| 8 | COMMIT | — | 事务持久化 |
| 9 | `JwtWithCreateToken(id, user, 1h)` | 内存生成 JWT | — |
| 10 | `JwtWithCreateToken(id, user, 7d)` | 内存生成 JWT | — |
| 11 | SHA256(refresh_token) | 内存计算 hash | — |
| 12 | `StateTokenWithRenew("", hash, id, 7d)` | `写→[Redis: token_<hash>]` | (空) → `{account_id:user}` |
|   | | `写→[Redis: token_account_<id>]` | (空) → `{hash: 0}` |
| 13 | 返回响应 | — | — |

**错误映射**
| 条件 | gRPC Code |
|------|-----------|
| auth_type 非法 | InvalidArgument |
| identifier 为空 | InvalidArgument |
| password 为空 | InvalidArgument |
| identifier 已注册 (MySQL 1062) | AlreadyExists |
| 其他 DB/Redis 错误 | Internal |

**配置依赖**
| 配置项 | 值 | 作用 |
|--------|-----|------|
| AccessTokenExpire | 1h | access_token TTL |
| RefreshTokenExpire | 7d | refresh_token TTL + Redis token TTL |
| TokenLimitPerAccount | 10 | 控制每账号最大 token 数 |

---

#### 2. Login

**请求** ← `LoginRequest`
```
AuthType auth_type     // email | username | phone
string   identifier    // 登录标识
string   password      // 明文密码
string   ip_address    // 客户端 IP（可选）
string   user_agent    // UA（可选）
```

**响应** → `LoginResponse`
```
string access_token    // JWT, 1h
string refresh_token   // JWT, 7d
int64  expires_in
```

**步骤**

| # | 操作 | 数据流 | 状态变化 |
|---|------|--------|----------|
| 1 | 参数校验 | — | 非法参数 → gRPC InvalidArgument |
| 2 | 读 IP 锁（ip 非空时） | `读←[Redis: login_lock:ip:<ip>]` | TTL>0 → gRPC ResourceExhausted |
| 3 | 读账号锁 | `读←[Redis: login_lock:<type>:<id>]` | TTL>0 → gRPC ResourceExhausted |
| 4 | JOIN 查 account + auth | `读←[MySQL: accounts + account_auths]` | NotFound → 写 audit log(fail) + gRPC NotFound |
| 5 | 检查 status | — | status≠1 → gRPC PermissionDenied |
| 6 | PBKDF2 验证密码 | 内存计算 + 比对 | 不匹配 → 走失败流程 |
| 7 | [失败] `recordFailedAttempt` | `写→[Redis: login_attempt:<id>]` | INCR 1→N；首次时设 TTL |
|   | | 达上限时 `写→[Redis: login_lock:<type>:<id>]` | (空)→`1`；删除 attempt key |
| 8 | [失败] `recordIPFailedAttempt`（ip 非空） | `写→[Redis: login_attempt:ip:<ip>]` | 同上逻辑 |
| 9 | [失败] INSERT login_history | `写→[MySQL: login_history]` | {status=0, failure_reason} |
|   | | — | → gRPC Unauthenticated |
| 10 | [成功] 清除限流键 | `删除→[Redis: login_attempt/lock 相关 key]` | (key) → (空) |
| 11 | [成功] `JwtWithCreateToken` | 内存生成 JWT | — |
| 12 | [成功] `StateTokenWithRenew` | `写→[Redis: token_<hash> + token_account_<id>]` | 新增 token 记录 |
| 13 | [成功] INSERT login_history | `写→[MySQL: login_history]` | {status=1} |
| 14 | 返回响应 | — | — |

**错误映射**
| 条件 | gRPC Code |
|------|-----------|
| IP 被锁 | ResourceExhausted |
| 账号被锁 | ResourceExhausted |
| account/auth 不存在 | NotFound |
| 账号状态异常 | PermissionDenied |
| 密码错误 | Unauthenticated |
| 其他 Redis/DB 错误 | Internal |

**配置依赖**
| 配置项 | 值 | 作用 |
|--------|-----|------|
| MaxLoginAttempts | 5 | 触发账号锁的失败次数 |
| LoginLockDuration | 2m | 账号锁持续时间 |
| MaxIPLoginAttempts | 20 | 触发 IP 锁的失败次数 |
| IPLoginLockDuration | 1m | IP 锁持续时间 |
| AccessTokenExpire / RefreshTokenExpire | 1h / 7d | token TTL |

---

#### 3. RefreshToken

**请求** ← `RefreshTokenRequest`
```
string refresh_token   // 旧的 refresh_token JWT
```

**响应** → `RefreshTokenResponse`
```
string access_token    // 新 JWT, 1h
string refresh_token   // 新 JWT, 7d
int64  expires_in
```

**步骤**

| # | 操作 | 数据流 | 状态变化 |
|---|------|--------|----------|
| 1 | 参数校验 | — | 空 → gRPC InvalidArgument |
| 2 | SHA256(refresh_token) | 内存计算 hash | — |
| 3 | 查旧 token | `读←[Redis: token_<hash>]` | 不存在/过期 → gRPC NotFound |
| 4 | 解析 value 得到 account_id:role | 内存拆分 | — |
| 5 | 签发新 refresh_token(JWT) + SHA256 新 hash | 内存 | — |
| 6 | `StateTokenWithRenew(old, new, value, 7d)` | `读←[Redis: token_<old>]` | 验证旧 token 存在 |
|   | | `删除→[Redis: token_<old>]` | (key) → (空) |
|   | | `写→[Redis: token_<new>]` | (空) → `{account_id:role}` |
|   | | `删除→[Redis: token_account_<id> old]` | (hash field) → (空) |
|   | | `写→[Redis: token_account_<id> new]` | (空) → `{new: 0}` |
| 7 | 签发新 access_token(JWT) | 内存 | — |
| 8 | 返回响应 | — | — |

**错误映射**
| 条件 | gRPC Code |
|------|-----------|
| refresh_token 为空 | InvalidArgument |
| refresh_token hash 失败 | InvalidArgument |
| 旧 token 在 Redis 中不存在/过期 | NotFound |
| 超 TokenLimitPerAccount 且无 oldToken(不应发生) | Internal |
| 其他 Redis 错误 | Internal |

---

#### 4. RevokeToken

**请求** ← `RevokeTokenRequest`
```
string refresh_token   // 要撤销的 refresh_token
```

**响应** → `RevokeTokenResponse`（空）

**步骤**

| # | 操作 | 数据流 | 状态变化 |
|---|------|--------|----------|
| 1 | 参数校验 | — | 空 → gRPC InvalidArgument |
| 2 | SHA256(refresh_token) | 内存计算 hash | — |
| 3 | `StateTokenWithRevoke(hash)` | `读←[Redis: token_<hash>]` | 获取 account_id |
|   | | `删除→[Redis: token_<hash>]` | (key) → (空) |
|   | | `删除→[Redis: token_account_<id> hash]` | (hash field) → (空) |
| 4 | 返回空响应 | — | — |

**错误映射**
| 条件 | gRPC Code |
|------|-----------|
| refresh_token 为空 | InvalidArgument |
| hash 失败 | InvalidArgument |
| Redis 错误 | Internal |

---

#### 5. RevokeAllTokens

**请求** ← `RevokeAllTokensRequest`
```
string access_token    // 当前有效的 access_token, 用于确认身份
```

**响应** → `RevokeAllTokensResponse`（空）

**步骤**

| # | 操作 | 数据流 | 状态变化 |
|---|------|--------|----------|
| 1 | 参数校验 | — | 空 → gRPC InvalidArgument |
| 2 | `JwtWithParseToken(access_token)` | 内存解析 JWT | 过期 → Unauthenticated；非法 → Unauthenticated |
| 3 | 获取 claims.AccountId | — | — |
| 4 | `StateTokenWithRevokeAll(id)` | `读←[Redis: token_account_<id>]` | 获取所有 token hash field |
|   | | `删除→[Redis: token_<hash1>, token_<hash2>, ...]` | 批量删除所有 token key |
|   | | `删除→[Redis: token_account_<id>]` | 整个 key 删除 |
| 5 | 返回空响应 | — | — |

**错误映射**
| 条件 | gRPC Code |
|------|-----------|
| access_token 为空 | InvalidArgument |
| token 过期 | Unauthenticated |
| token 非法 | Unauthenticated |
| Redis 错误 | Internal |

---

#### 6. ValidateToken

**请求** ← `ValidateTokenRequest`
```
string access_token    // 待验证的 access_token
```

**响应** → `ValidateTokenResponse`
```
string account_id
string role
int64  expires_at     // Unix 时间戳（秒）
```

**步骤**

| # | 操作 | 数据流 | 状态变化 |
|---|------|--------|----------|
| 1 | 参数校验 | — | 空 → gRPC InvalidArgument |
| 2 | `JwtWithParseToken(access_token)` | 内存解析 JWT | 过期 → Unauthenticated；非法 → Unauthenticated |
| 3 | 获取 claims(account_id, role, expires_at) | — | — |
| 4 | `StateTokenWithCount(account_id)` | `读←[Redis: token_account_<id>]` | 获取活跃 session 数 |
|   | | 先清理过期 entry（`HLen` 前 `HDel` 已过期 field） | — |
| 5 | count == 0 | — | 该账号无有效 refresh token → gRPC Unauthenticated (token revoked) |
| 6 | 返回 claims 信息 | — | — |

**错误映射**
| 条件 | gRPC Code |
|------|-----------|
| access_token 为空 | InvalidArgument |
| token 过期 | Unauthenticated |
| token 非法 | Unauthenticated |
| 账号无活跃 session（已撤销） | Unauthenticated |
| Redis 错误 | Internal |

---

#### 7. UpdatePassword

**请求** ← `UpdatePasswordRequest`
```
string account_id     // 账号 ID
string old_password   // 旧密码明文
string new_password   // 新密码明文
```

**响应** → `UpdatePasswordResponse`（空）

**步骤**

| # | 操作 | 数据流 | 状态变化 |
|---|------|--------|----------|
| 1 | 参数校验 | — | 空字段 → gRPC InvalidArgument |
| 2 | SELECT accounts | `读←[MySQL: accounts]` | NotFound → gRPC NotFound |
| 3 | 检查 status | — | status≠1 → gRPC PermissionDenied |
| 4 | PBKDF2 比对旧密码 | 内存计算 + 比对 | 不匹配 → gRPC Unauthenticated |
| 5 | `encrypt.Salt()` + `encrypt.Key(new)` | 内存生成新盐值 + 新哈希 | — |
| 6 | UPDATE accounts | `写→[MySQL: accounts]` | `{password_hash, salt}` 旧值 → 新值 |
| 7 | `StateTokenWithRevokeAll(account_id)` | `删除→[Redis: token_account_<id> 及相关 token_<hash>]` | 所有活跃 session → (空) |
| 8 | 返回空响应 | — | — |

**错误映射**
| 条件 | gRPC Code |
|------|-----------|
| account_id/old_password/new_password 为空 | InvalidArgument |
| 账号不存在 | NotFound |
| 账号冻结/非活跃 | PermissionDenied |
| 旧密码错误 | Unauthenticated |
| DB/Redis 错误 | Internal |

---

#### 8. UpdateIdentifier

**请求** ← `UpdateIdentifierRequest`
```
string   account_id     // 账号 ID
AuthType auth_type      // 登录方式
string   new_identifier // 新标识
```

**响应** → `UpdateIdentifierResponse`（空）

**步骤**

| # | 操作 | 数据流 | 状态变化 |
|---|------|--------|----------|
| 1 | 参数校验 + auth_type 转换 | — | 非法参数 → gRPC InvalidArgument |
| 2 | SELECT accounts | `读←[MySQL: accounts]` | NotFound → gRPC NotFound |
| 3 | 检查 status | — | status≠1 → gRPC PermissionDenied |
| 4 | UPDATE account_auths | `写→[MySQL: account_auths]` | `identifier` 旧值 → 新值 |
|   | 唯一键冲突(1062) | — | → gRPC AlreadyExists |
|   | 影响行数=0 | — | → gRPC NotFound（待更新记录不存在） |
| 5 | `StateTokenWithRevokeAll(account_id)` | `删除→[Redis: 所有 token]` | 所有活跃 session → (空) |
| 6 | 返回空响应 | — | — |

**错误映射**
| 条件 | gRPC Code |
|------|-----------|
| account_id/auth_type/new_identifier 非法 | InvalidArgument |
| 账号不存在 | NotFound |
| 账号冻结/非活跃 | PermissionDenied |
| 新标识已被占用 (1062) | AlreadyExists |
| 待更新的 auth 记录不存在(n=0) | NotFound |
| DB/Redis 错误 | Internal |

---

#### 9. DeleteAccount

**请求** ← `DeleteAccountRequest`
```
string account_id     // 账号 ID
string password       // 密码确认
```

**响应** → `DeleteAccountResponse`（空）

**步骤**

| # | 操作 | 数据流 | 状态变化 |
|---|------|--------|----------|
| 1 | 参数校验 | — | 空字段 → gRPC InvalidArgument |
| 2 | SELECT accounts | `读←[MySQL: accounts]` | NotFound → gRPC NotFound |
| 3 | PBKDF2 比对密码 | 内存计算 + 比对 | 不匹配 → gRPC Unauthenticated |
| 4 | `StateTokenWithRevokeAll(account_id)` | `删除→[Redis: 所有 token]` | 所有活跃 session → (空) |
| 5 | SoftDelete accounts | `写→[MySQL: accounts]` | `{deleted_at=0, status=1}` → `{deleted_at=now, status=0}` |
| 6 | HardDelete account_auths | `删除→[MySQL: account_auths]` | WHERE account_id 的行全部物理删除 |
| 7 | 返回空响应 | — | — |

**错误映射**
| 条件 | gRPC Code |
|------|-----------|
| account_id/password 为空 | InvalidArgument |
| 账号不存在 | NotFound |
| 密码错误 | Unauthenticated |
| DB/Redis 错误 | Internal |

---

---

## User Service 接口逻辑

### 数据模型

#### user_profiles（MySQL: personal_user.user_profiles）
| 字段 | 类型 | 说明 |
|------|------|------|
| user_id | VARCHAR(32) UK | 关联 account_id |
| nickname | VARCHAR(64) | 昵称 |
| avatar_url | VARCHAR(512) | 头像完整 URL |
| avatar_key | VARCHAR(255) | MinIO 对象 key |
| gender | TINYINT | 0=保密 1=男 2=女 |
| birthday | BIGINT | Unix 时间戳 |
| bio / phone / email | VARCHAR | 个人简介/手机/邮箱 |
| status | TINYINT | 0=inactive 1=active 2=frozen |
| deleted_at | BIGINT | 软删除时间戳 |

#### Redis 缓存
| Key 模式 | 类型 | 值格式 | TTL |
|----------|------|--------|-----|
| `profile:<user_id>` | String | `nickname\|avatar_url\|avatar_key\|gender\|birthday\|bio\|phone\|status\|created_at\|updated_at\|email` | 1h |

---

#### 1. GetProfile

**请求** ← `GetProfileRequest`
```
string user_id
```

**响应** → `GetProfileResponse`
```
string user_id
string nickname
string avatar_url     // 若 avatar_key 非空，通过 personal-core PresignedGetURL 生成临时 URL
int32  gender
int64  birthday
string bio
string phone
string email
int64  created_at
int64  updated_at
```

**步骤**

| # | 操作 | 数据流 | 状态变化 |
|---|------|--------|----------|
| 1 | 参数校验 | — | user_id 空 → gRPC InvalidArgument |
| 2 | 读缓存 | `读←[Redis: profile:<user_id>]` | 命中 → 直接返回 |
| 3 | 查 MySQL | `读←[MySQL: user_profiles]` | NotFound → gRPC NotFound |
| 4 | 写缓存 | `写→[Redis: profile:<user_id>]` | (空) → `{管道分隔字段}`, TTL=1h |
| 5 | 解析头像 URL | `读←[personal-core(gRPC): PresignedGetURL]` | avatar_key 非空时生成临时下载 URL |
| 6 | 返回响应 | — | — |

**错误映射**
| 条件 | gRPC Code |
|------|-----------|
| user_id 为空 | InvalidArgument |
| profile 不存在 | NotFound |
| MySQL/Redis 错误 | Internal |

**配置依赖**
| 配置项 | 值 | 作用 |
|--------|-----|------|
| AvatarBucket | personal | MinIO bucket 名 |
| AvatarURLExpiry | 2h | 预签名 URL 有效期 |
| profileCacheTTL | 1h | Redis 缓存 TTL |

---

#### 2. UpdateProfile

**请求** ← `UpdateProfileRequest`
```
string          user_id
optional string nickname
optional int32  gender      // 0=保密 1=男 2=女
optional int64  birthday
optional string bio
optional string phone
optional string email
```

**响应** → `UpdateProfileResponse`（空）

**步骤**

| # | 操作 | 数据流 | 状态变化 |
|---|------|--------|----------|
| 1 | 参数校验 | — | user_id 空 / gender 越界 → gRPC InvalidArgument |
| 2 | 组装 updatable fields | 内存筛选非 nil 字段 | — |
| 3 | 空字段判断 | — | 无待更新字段 → 直接返回空响应 |
| 4 | 查 profile | `读←[MySQL: user_profiles]` | — |
| 5 | [不存在] INSERT profile | `写→[MySQL: user_profiles]` | (空) → 新记录，自动插入完整行 |
| 6 | [存在] UPDATE profile | `写→[MySQL: user_profiles]` | 仅更新非零字段 + updated_at |
| 7 | 删除缓存 | `删除→[Redis: profile:<user_id>]` | (key) → (空) |
| 8 | 返回空响应 | — | — |

**错误映射**
| 条件 | gRPC Code |
|------|-----------|
| user_id 为空 | InvalidArgument |
| gender 越界 (0-2) | InvalidArgument |
| MySQL/Redis 错误 | Internal |

---

#### 3. SetAvatar

**请求** ← `SetAvatarRequest`
```
string user_id
string avatar_url    // 头像完整 URL（可选，为空时由 avatar_key 生成）
string avatar_key    // MinIO 对象 key
```

**响应** → `SetAvatarResponse`（空）

**步骤**

| # | 操作 | 数据流 | 状态变化 |
|---|------|--------|----------|
| 1 | 参数校验 | — | user_id/avatar_key 空 → gRPC InvalidArgument |
| 2 | 解析 avatar_url | `读←[personal-core(gRPC): PresignedGetURL]` | avatar_url 空时由 avatar_key 生成 |
| 3 | UPDATE profile | `写→[MySQL: user_profiles]` | 更新 avatar_url + avatar_key |
| 4 | [n==0] INSERT profile | `写→[MySQL: user_profiles]` | UPDATE 影响 0 行时自动插入 |
| 5 | 删除缓存 | `删除→[Redis: profile:<user_id>]` | (key) → (空) |
| 6 | 返回空响应 | — | — |

**错误映射**
| 条件 | gRPC Code |
|------|-----------|
| user_id/avatar_key 为空 | InvalidArgument |
| MySQL/Redis/gRPC 错误 | Internal |

---

#### 4. GetAvatarPresignedURL

**请求** ← `GetAvatarPresignedURLRequest`
```
string user_id
string filename       // 原始文件名
string content_type   // MIME 类型
int64  file_size      // 文件大小（当前未使用）
```

**响应** → `GetAvatarPresignedURLResponse`
```
string presigned_url  // 上传预签名 URL
string object_key     // MinIO 对象路径: avatars/<user_id>/<timestamp>_<filename>
int64  expires_in     // URL 有效期秒数
```

**步骤**

| # | 操作 | 数据流 | 状态变化 |
|---|------|--------|----------|
| 1 | 参数校验 | — | user_id/filename/content_type 空 → gRPC InvalidArgument |
| 2 | 构造 object_key | 内存拼接 | `avatars/<user_id>/<timestamp_ms>_<filename>` |
| 3 | 调用 storage-core | `读←[personal-core(gRPC): PresignedPutURL]` | 获取上传预签名 URL |
| 4 | 返回响应 | — | — |

**错误映射**
| 条件 | gRPC Code |
|------|-----------|
| user_id/filename/content_type 为空 | InvalidArgument |
| personal-core gRPC 错误 | Internal |

**配置依赖**
| 配置项 | 值 | 作用 |
|--------|-----|------|
| AvatarBucket | personal | MinIO bucket 名 |
| AvatarURLExpiry | 2h | 预签名 URL 有效期 |
| StorageTarget | etcd:///grpclb/personal-core | personal-core 服务发现地址 |

---

### 配置基线

| 配置项 | 默认值 | 影响接口 |
|--------|--------|----------|
| AccessTokenExpire | 1h | Register, Login, RefreshToken |
| RefreshTokenExpire | 7d | Register, Login, RefreshToken |
| MaxLoginAttempts | 5 | Login |
| LoginLockDuration | 2m | Login |
| MaxIPLoginAttempts | 20 | Login |
| IPLoginLockDuration | 1m | Login |
| TokenLimitPerAccount | 10（lib/auth） | Register, Login, RefreshToken |
| SigningKey | sk_c1d8d...(config.toml) | 所有 JWT 操作 |

---

### 全局数据流图

```
```
Client → gRPC Request (Auth / User)
         │
         ├─ 参数校验 → InvalidArgument
         │
         ├─ Redis 读取/写入
         │   ├─ token_<hash>              (String, TTL) — Auth
         │   ├─ token_account_<id>         (Hash, 无 TTL) — Auth
         │   ├─ login_lock:*              (String, TTL) — Auth
         │   ├─ login_attempt:*           (String, TTL) — Auth
         │   └─ profile:<user_id>         (String, TTL=1h) — User
         │
         ├─ gRPC 调用 personal-core
         │   └─ PresignedGetURL / PresignedPutURL — User
         │
         ├─ MySQL 操作
         │   ├─ accounts                  (CRUD + 软删除) — Auth
         │   ├─ account_auths             (CRUD + 硬删除) — Auth
         │   ├─ login_history             (Insert only) — Auth
         │   └─ user_profiles             (CRUD + 软删除) — User
         │
         └─ gRPC Response
```
```

---

## 新增条目模板

```markdown
## [<version>] - <YYYY-MM-DD>

### Added
- 新增 RPC / 字段 / 功能：简要说明

### Changed
- 变更逻辑 / 配置：前后变化及原因

### Fixed
- 修复问题：触发条件和修复方式

### Security
- 安全修复：漏洞类型和影响范围
```
