# Cookie-Based Token 改造设计

**日期:** 2026-07-01
**项目:** personal-service
**版本:** 1.0

## 1. 概述

将当前的双 token 机制（access JWT + refresh JWT）从 localStorage 前端管理改为 HTTP-only cookie 服务端管理，并利用 Echo 中间件实现静默自动续期。

### 改造动机

| 当前问题 | 改造方案 |
|----------|----------|
| Token 存 localStorage，XSS 可窃取 | HTTP-only cookie，JS 不可读 |
| 前端需手动管理 refresh 逻辑 | Echo 中间件自动续期，前端无感 |
| 每次请求前端拼 `Authorization` header | Cookie 由浏览器自动携带 |
| `revoke-all` 需同时传 access_token 在 header 和 body | cookie 统一管理，handler 从 context 取 account_id |

## 2. Cookie 策略

| Cookie | 值 | Path | HttpOnly | Secure | SameSite | Max-Age |
|--------|-----|------|----------|--------|----------|---------|
| `access_token` | JWT HS256 | `/api` | ✅ | ✅ (prod) | Strict | access_expire (1h) |
| `refresh_token` | JWT HS256 | `/api` | ✅ | ✅ (prod) | Strict | refresh_expire (7d) |

- 登录/注册成功时，Go 后端通过 `c.SetCookie()` 设 cookie
- 登出时服务端设 `MaxAge=-1` 清除
- 优先读 cookie，fallback 到 `Authorization: Bearer`（支持非浏览器客户端）

## 3. Echo 中间件自动续期

### 流程

```
请求 → JWT Middleware
  ├─ skipper 匹配？→ 是 → next()
  ├─ 读 cookie "access_token" (fallback Authorization header)
  ├─ 解析 JWT
  │   ├─ 有效且 >5min 过期 → next()
  │   ├─ 过期或 <5min 过期 → 读 cookie "refresh_token"
  │   │   ├─ 有 → gRPC RefreshToken()
  │   │   │   ├─ 成功 → Set-Cookie 新 token → next()
  │   │   │   └─ 失败 → 401
  │   │   └─ 无 → 401
  │   └─ 无效签名 → 401
```

### 中间件改造点

- 定义 `TokenRefresher` 接口避免跨层依赖（`lib/http/middleware/`）

  ```go
  type TokenRefresher interface {
      Refresh(ctx context.Context, refreshToken string) (accessToken, newRefreshToken string, expiresIn int64, err error)
  }
  ```

- `ServerJWTInterceptor` 签名改为接收 `TokenRefresher`（server.go 注入具体实现）
- 新增 `tryAutoRefresh(c, refresher)` 函数
- 新增 `setTokenCookies(c, access, refresh, expire)` 辅助函数
- 5min 预续期阈值：避免请求执行中途 token 过期
- 续期成功后将新 `access_token` 写入 Echo context，替换旧值

## 4. API 端点改动

### 4.1 Login & Register

```go
// 改后：Set-Cookie + 精简 JSON
setTokenCookies(c, resp.AccessToken, resp.RefreshToken, resp.ExpiresIn)
return Respond(c, http.StatusOK, 0, "success", map[string]interface{}{
    "expires_in": resp.ExpiresIn,
})
```

### 4.2 Revoke（单 token 登出）

- 从 cookie 读 `refresh_token`（fallback body `refresh_token`）
- 调 gRPC RevokeToken
- 清除 cookie（`MaxAge=-1`）
- 不再需要 body 传 token

### 4.3 RevokeAll

- JWT 中间件已认证 → 从 `c.Get("account_id")` 获取
- 调 gRPC RevokeAllTokens
- 清除 cookie
- 不再需要 body 传 access_token

### 4.4 Refresh Token

- 从 cookie 读 `refresh_token`（fallback body）
- 调 gRPC RefreshToken
- 设新 cookie，返回 `expires_in`

### 4.5 Validate Token

- 从 cookie 读 `access_token`（fallback body/json）
- 调 gRPC ValidateToken
- 返回 `role` + `expires_at`

## 5. 前端改动

### 5.1 登录页 (`login/page.tsx`)

```tsx
// 改后
const json = await res.json();
if (json.code === 0) router.push("/dashboard");
// 不需要 setTokens()，cookie 由服务端自动设置
```

### 5.2 API 封装 (`lib/api.ts`)

- 删除 `ensureToken()`（不再需要预检查 token 有效性）
- 删除手动 `Authorization: Bearer` header 拼装
- 删除 401 重试 + refresh 逻辑（中间件代为处理）
- 保留基础 fetch 封装（Content-Type、错误处理）

### 5.3 Auth 工具 (`lib/auth.ts`)

- 删除 `setTokens`、`getAccessToken`、`getRefreshToken`、`refreshAccessToken`、`isTokenExpired`
- 保留 `redirectToLogin()`（跳转 /login）
- 如果无其他引用，可删除整个文件

### 5.4 Dashboard Layout

- 删除 localStorage 的 `checkAuth()` 逻辑
- 改为请求 `/api/v1/auth/token/validate` 校验身份
- 401 则跳转 /login

### 5.5 登出

```tsx
await fetch("/api/v1/auth/token/revoke", { method: "POST" });
router.push("/login");
// 服务端清除 cookie
```

## 6. 文件改动清单

| 文件 | 改动类型 | 说明 |
|------|----------|------|
| `apps/personal-api/pkg/handler/auth.go` | 修改 | Login/Register 改为 Set-Cookie；Revoke 读 cookie；RevokeAll 从 context 取 account_id；Refresh 读 cookie |
| `apps/personal-api/pkg/handler/utils.go` | 新增 | `setTokenCookies()` 辅助函数 |
| `lib/http/middleware/jwt.go` 新增接口 | 新增 | `TokenRefresher` 接口定义 |
| `lib/http/middleware/jwt.go` | 重写 | 读 cookie → fallback Authorization → 自动续期逻辑 |
| `apps/personal-api/pkg/server/server.go` | 修改 | 创建 `TokenRefresher` 实现并注入 JWT 中间件 |
| `apps/personal-web-admin/src/app/login/page.tsx` | 修改 | 去掉 setTokens 调用 |
| `apps/personal-web-admin/src/app/register/page.tsx` | 修改 | 同上 |
| `apps/personal-web-admin/src/lib/api.ts` | 重写 | 简化 fetch 封装 |
| `apps/personal-web-admin/src/lib/auth.ts` | 重写/删除 | 去掉 token 管理逻辑 |
| `apps/personal-web-admin/src/app/dashboard/layout.tsx` | 修改 | 改用 API 验证替代 localStorage 检查 |

## 7. 安全问题

- cookie `HttpOnly` + `Secure` + `SameSite=Strict`：防止 XSS 窃取、CSRF 攻击
- 自动续期仅在 access_token 过期或即将过期时触发，降低 refresh_token 暴露面
- refresh_token 限制 Path=/api，减少非 API 请求携带
- 仍然保留 `Authorization: Bearer` fallback，但非浏览器客户端需自行管理 refresh

## 8. 边界情况

| 场景 | 行为 |
|------|------|
| access_token + refresh_token 都过期 | 中间件返回 401，前端跳 /login |
| access_token 有效但 refresh_token 丢失 | 中间件用 access_token 继续，续期时失败返回 401 |
| 续期时 refresh_token 也被撤销 | gRPC 返回错误，中间件返回 401 |
| 非浏览器客户端（curl） | 继续用 Authorization header，不会自动续期 |
| 并发请求续期 | Echo 中间件在同一个请求中只续期一次，后续请求各自独立 |
