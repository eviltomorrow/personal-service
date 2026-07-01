# Auth 流程改造设计文档

**日期:** 2026-07-01
**项目:** personal-service (Go + Next.js)
**版本:** 1.0

## 1. 概述

将前端登录/注册页面从 mock 状态改为对接真实后端 API，完善 token 生命周期管理（获取、存储、自动续约、退出清理）。忘记密码功能保持 mock，不做。

## 2. 改动清单

### 2.1 前端新增文件

#### `apps/personal-web-admin/src/lib/auth.ts`

Token 存储工具函数：

- `setTokens(accessToken, refreshToken, expiresIn)` — 写入 localStorage
- `getAccessToken()` — 读取 access_token
- `getRefreshToken()` — 读取 refresh_token
- `isTokenExpired()` — 根据记录的时间戳判断是否过期（提前 30s 触发续约）
- `clearTokens()` — 清除所有 token 相关 key
- `redirectToLogin()` — 清除 token 后跳转 `/login`

#### `apps/personal-web-admin/src/lib/api.ts`

带认证的 fetch 封装：

- 每个请求自动附加 `Authorization: Bearer <token>`
- 请求前检查 token 是否过期 → 是则用 refresh_token 调 `/api/v1/auth/token/refresh` 获取新令牌对
- 并发请求只发一次 refresh 请求（请求队列去重）
- 续约失败（refresh_token 也过期）→ 清除 token 跳转 `/login`
- 服务端返回 401 → 重试一次 refresh，失败则清除 token 跳转 `/login`

### 2.2 前端修改文件

#### `apps/personal-web-admin/src/app/login/page.tsx`

- 去掉 `setTimeout` mock 逻辑
- 提交时调 `POST /api/v1/auth/login`：
  ```json
  { "auth_type": "email", "identifier": "...", "password": "..." }
  ```
- 成功后：`setTokens(access_token, refresh_token, expires_in)` → 跳转 `/dashboard`
- 失败后：显示服务端返回的错误消息

#### `apps/personal-web-admin/src/app/register/page.tsx`

- 去掉 `setTimeout` mock 逻辑
- 提交时调 `POST /api/v1/auth/register`：
  ```json
  { "auth_type": "email", "identifier": "...", "password": "..." }
  ```
- 成功后：`setTokens(access_token, refresh_token, expires_in)` → 跳转 `/dashboard`
- 失败后：显示服务端返回的错误消息

#### `apps/personal-web-admin/src/app/dashboard/layout.tsx`

- 导航栏右侧增加退出按钮
- 退出时调 `POST /api/v1/auth/token/revoke`（传 `refresh_token`）
- `clearTokens()` → 跳转 `/login`

### 2.3 后端修改

#### `lib/http/server/http.go` — JWT skipper 补充

第 66 行的 skipper 函数添加 `/api/v1/auth/token/refresh`：

```go
func(c echo.Context) bool {
    path := c.Request().URL.Path
    if path == "/api/v1/auth/register" || path == "/api/v1/auth/login" || path == "/api/v1/auth/token/refresh" {
        return true
    }
    return false
}
```

#### `apps/personal-api/pkg/handler/auth.go` — account_id 从 JWT 提取

`DeleteAccount`、`UpdatePassword`、`UpdateIdentifier` 三个 handler 当前从请求体中读 `account_id`，存在安全隐患（攻击者可传入他人 account_id）。改为从 JWT middleware 设置的 echo context 中提取：

```go
// DeleteAccount
req.AccountID = c.Get("account_id").(string)

// UpdatePassword
req.AccountID = c.Get("account_id").(string)

// UpdateIdentifier
req.AccountID = c.Get("account_id").(string)
```

#### `apps/personal-auth/pkg/config/config.go` — 默认 token 过期时间

将 `AccessTokenExpire` 从 5m 改为 1h，`RefreshTokenExpire` 从 30m 改为 7d：

```go
Auth: AuthConfig{
    AccessTokenExpire:   1 * time.Hour,
    RefreshTokenExpire:  7 * 24 * time.Hour,
    ...
}
```

## 3. 不改动的部分

| 模块 | 原因 |
|------|------|
| Forgot-password 页面 | 保持 mock，无后端支持 |
| gRPC proto 定义 | 现有 9 个 RPC 已覆盖所有需求 |
| personal-auth service 逻辑 | Login/Register/RefreshToken/RevokeToken 逻辑正确 |
| personal-api service/auth.go | 转换层无需改动 |
| personal-api handler/auth.go | 需修复 account_id 来源（见下方第 5 项） |
