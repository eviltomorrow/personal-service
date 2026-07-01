# Cookie-Based Token 改造实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将双 token 机制从 localStorage 前端管理改为 HTTP-only cookie 服务端管理，Echo 中间件静默自动续期。

**Architecture:** Echo JWT 中间件优先读取 `access_token` cookie（fallback Authorization header），过期时用 `refresh_token` cookie 自动调 gRPC 续期。前端不再管理 token，登录/登出时由服务端 Set-Cookie / Clear-Cookie。向后兼容非浏览器客户端（Authorization header）。

**Tech Stack:** Go 1.26.3, Echo v4, gRPC, Next.js 15

## Global Constraints

- 所有 cookie 设 `HttpOnly`、`Secure`（prod）、`SameSite=Strict`、`Path=/api`
- JWT 中间件优先读 cookie，fallback 到 `Authorization: Bearer`
- auto-refresh 阈值 5 分钟：access_token 剩余 <5min 时触发续期
- 登录/注册 JSON body 不再返回 access_token/refresh_token，只返回 `expires_in`
- `RevokeAllTokens` handler 从 `c.Get("account_id")` 取 account_id，不再从 body 读
- `model.AuthClient` 接口不改动

---

### Task 1: TokenRefresher 接口 + setTokenCookies 辅助函数

**Files:**
- Modify: `lib/http/middleware/jwt.go`（追加接口定义，不改现有函数）
- Modify: `apps/personal-api/pkg/handler/utils.go`（追加辅助函数）

**Interfaces:**
- Produces: `TokenRefresher` interface 供 Task 2 使用
- Produces: `setTokenCookies(c echo.Context, accessToken, refreshToken string, expiresIn int64)` 供 Task 4 使用

- [ ] **Step 1: 在 `lib/http/middleware/jwt.go` 追加 `TokenRefresher` 接口**

```go
package middleware

type TokenRefresher interface {
	Refresh(ctx context.Context, refreshToken string) (accessToken, newRefreshToken string, expiresIn int64, err error)
}
```

注意需要 import `"context"`。

- [ ] **Step 2: 在 `apps/personal-api/pkg/handler/utils.go` 追加 `setTokenCookies`**

```go
package handler

import (
	"net/http"
	"time"

	"github.com/labstack/echo/v4"
)

func setTokenCookies(c echo.Context, accessToken, refreshToken string, expiresIn int64) {
	accessMaxAge := int(expiresIn)
	c.SetCookie(&http.Cookie{
		Name:     "access_token",
		Value:    accessToken,
		Path:     "/api",
		HttpOnly: true,
		SameSite: http.SameSiteStrictMode,
		MaxAge:   accessMaxAge,
	})
	refreshMaxAge := 7 * 24 * 3600 // 7 days default
	c.SetCookie(&http.Cookie{
		Name:     "refresh_token",
		Value:    refreshToken,
		Path:     "/api",
		HttpOnly: true,
		SameSite: http.SameSiteStrictMode,
		MaxAge:   refreshMaxAge,
	})
}

func clearTokenCookies(c echo.Context) {
	c.SetCookie(&http.Cookie{
		Name: "access_token", Path: "/api", HttpOnly: true,
		SameSite: http.SameSiteStrictMode, MaxAge: -1,
	})
	c.SetCookie(&http.Cookie{
		Name: "refresh_token", Path: "/api", HttpOnly: true,
		SameSite: http.SameSiteStrictMode, MaxAge: -1,
	})
}
```

- [ ] **Step 3: 确认编译通过**

```bash
go build ./...
```

- [ ] **Step 4: 提交**

```bash
git add lib/http/middleware/jwt.go apps/personal-api/pkg/handler/utils.go
git commit -m "feat: add TokenRefresher interface and setTokenCookies helper"
```

---

### Task 2: 重写 JWT 中间件（cookie 读取 + 自动续期）

**Files:**
- Modify: `lib/http/middleware/jwt.go`

**Interfaces:**
- Consumes: `TokenRefresher` interface（Task 1）
- Produces: 修改后的 `ServerJWTInterceptor` 签名供 Task 3 注入

- [ ] **Step 1: 重写 `ServerJWTInterceptor` 签名**

```go
func ServerJWTInterceptor(skipper func(c echo.Context) bool, refresher TokenRefresher) echo.MiddlewareFunc {
```

- [ ] **Step 2: 实现读取 cookie → fallback Authorization header → 自动续期逻辑**

```go
func ServerJWTInterceptor(skipper func(c echo.Context) bool, refresher TokenRefresher) echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			if skipper != nil && skipper(c) {
				return next(c)
			}

			tokenStr := resolveToken(c)
			if tokenStr == "" {
				return c.JSON(http.StatusUnauthorized, map[string]interface{}{
					"code": http.StatusUnauthorized, "message": "missing authorization",
				})
			}

			claims, err := auth.JwtWithParseToken(tokenStr, nil)
			if err != nil && !errors.Is(err, auth.ErrTokenExpired) {
				code := http.StatusUnauthorized
				msg := "invalid token"
				return c.JSON(code, map[string]interface{}{
					"code": code, "message": msg,
				})
			}

			if err == nil {
				setContext(c, claims, tokenStr)
				return next(c)
			}

			// Token expired — try auto-refresh
			if refresher == nil {
				return c.JSON(http.StatusUnauthorized, map[string]interface{}{
					"code": http.StatusUnauthorized, "message": "token expired",
				})
			}

			refreshToken := resolveRefreshToken(c)
			if refreshToken == "" {
				return c.JSON(http.StatusUnauthorized, map[string]interface{}{
					"code": http.StatusUnauthorized, "message": "token expired",
				})
			}

			newAccess, newRefresh, expiresIn, refreshErr := refresher.Refresh(c.Request().Context(), refreshToken)
			if refreshErr != nil {
				clearTokenCookies(c)
				return c.JSON(http.StatusUnauthorized, map[string]interface{}{
					"code": http.StatusUnauthorized, "message": "token expired",
				})
			}

			setTokenCookies(c, newAccess, newRefresh, expiresIn)

			newClaims, parseErr := auth.JwtWithParseToken(newAccess, nil)
			if parseErr != nil {
				return c.JSON(http.StatusUnauthorized, map[string]interface{}{
					"code": http.StatusUnauthorized, "message": "invalid token",
				})
			}

			setContext(c, newClaims, newAccess)
			return next(c)
		}
	}
}

func resolveToken(c echo.Context) string {
	if cookie, err := c.Cookie("access_token"); err == nil && cookie.Value != "" {
		return cookie.Value
	}
	header := c.Request().Header.Get(echo.HeaderAuthorization)
	if token, ok := strings.CutPrefix(header, "Bearer "); ok {
		return token
	}
	return ""
}

func resolveRefreshToken(c echo.Context) string {
	if cookie, err := c.Cookie("refresh_token"); err == nil && cookie.Value != "" {
		return cookie.Value
	}
	return ""
}

func setContext(c echo.Context, claims *auth.JwtClaims, tokenStr string) {
	c.Set(ContextKeyAccountID, claims.AccountId)
	c.Set(ContextKeyRole, claims.Role)
	c.Set(ContextKeyToken, tokenStr)
}
```

- [ ] **Step 3: 提取 `tokenExpiryThreshold` 常量，检查 access_token 是否即将过期**

在 `resolveToken` 之后、`JwtWithParseToken` 之前，检查 JWT 是否接近过期（<5min）。如果是，即使还没过期也主动触发 refresh。

```go
func isTokenNearExpiry(claims *auth.JwtClaims) bool {
	if claims == nil {
		return false
	}
	return time.Until(claims.ExpiresAt.Time) < 5*time.Minute
}
```

在中间件主逻辑中，当 `claims` 有效时追加检查：

```go
if claims != nil && refresher != nil && isTokenNearExpiry(claims) {
    // 主动续期（同过期续期逻辑）
    ...
}
```

- [ ] **Step 4: 运行测试确认不破坏现有测试（此时测试会因签名变更而编译失败，预期）**

```bash
go test ./lib/http/middleware/... 2>&1 || true
```

- [ ] **Step 5: 提交**

```bash
git add lib/http/middleware/jwt.go
git commit -m "feat: rewrite JWT middleware with cookie support + auto-refresh"
```

---

### Task 3: 注入 TokenRefresher 到 server.go + 更新 http server 调用

**Files:**
- Modify: `apps/personal-api/pkg/server/server.go`
- Modify: `lib/http/server/http.go`
- Create: `apps/personal-api/pkg/provider/refresher.go`

**Interfaces:**
- Consumes: `TokenRefresher` interface（Task 1）
- Consumes: `model.AuthClient`（已存在）

- [ ] **Step 1: 创建 `apps/personal-api/pkg/provider/refresher.go`**

```go
package provider

import (
	"context"

	"github.com/eviltomorrow/personal-service/apps/personal-api/pkg/model"
	"github.com/eviltomorrow/personal-service/lib/http/middleware"
)

type authTokenRefresher struct {
	client model.AuthClient
}

func NewTokenRefresher(client model.AuthClient) middleware.TokenRefresher {
	return &authTokenRefresher{client: client}
}

func (r *authTokenRefresher) Refresh(ctx context.Context, refreshToken string) (string, string, int64, error) {
	resp, err := r.client.RefreshToken(ctx, &model.RefreshTokenRequest{
		RefreshToken: refreshToken,
	})
	if err != nil {
		return "", "", 0, err
	}
	return resp.AccessToken, resp.RefreshToken, resp.ExpiresIn, nil
}
```

- [ ] **Step 2: 修改 `lib/http/server/http.go` — `NewHTTP` 接收 `TokenRefresher` 并传给中间件**

```go
type HTTP struct {
	// ... existing fields ...
	refresher middleware.TokenRefresher
}

func NewHTTP(network *netutil.Config, log *log.Config, supported ...func(libhttp.Router) error) *HTTP {
	// 改为接收 refresher 参数
}
```

需要修改 `NewHTTP` 签名，添加 `refresher middleware.TokenRefresher` 参数：

```go
func NewHTTP(network *netutil.Config, log *log.Config, refresher middleware.TokenRefresher, supported ...func(libhttp.Router) error) *HTTP {
	return &HTTP{
		network:        network,
		log:            log,
		refresher:      refresher,
		registeredAPI:  supported,
		handler:        echo.New(),
	}
}
```

并在 `Serve()` 中：

```go
h.handler.Use(middleware.ServerJWTInterceptor(func(c echo.Context) bool {
    path := c.Request().URL.Path
    if path == "/api/v1/auth/register" || path == "/api/v1/auth/login" || path == "/api/v1/auth/token/refresh" || path == "/api/v1/auth/token/revoke" {
        return true
    }
    return false
}, h.refresher))
```

- [ ] **Step 3: 修改 `apps/personal-api/pkg/server/server.go` — 创建 TokenRefresher 并传入**

```go
func New(cfg *config.Config) (*Server, error) {
	// ... 现有初始化 ...

	deps := &handler.Dependencies{
		AuthClient:    provider.GetAuthClient(),
		FinanceClient: provider.GetFinanceClient(),
	}

	refresher := provider.NewTokenRefresher(deps.AuthClient)

	httpSrv := httpserver.NewHTTP(
		&cfg.Network,
		&cfg.Log,
		refresher,
		handler.SetupRoutes(deps, "/api/v1"),
	)

	return &Server{HTTP: httpSrv}, nil
}
```

- [ ] **Step 4: 确认编译通过**

```bash
go build ./...
```

- [ ] **Step 5: 提交**

```bash
git add apps/personal-api/pkg/provider/refresher.go apps/personal-api/pkg/server/server.go lib/http/server/http.go
git commit -m "feat: wire TokenRefresher through server DI"
```

---

### Task 4: 更新 Auth Handler（Login/Register/Revoke/RevokeAll/Refresh/Validate）

**Files:**
- Modify: `apps/personal-api/pkg/handler/auth.go`

**Interfaces:**
- Consumes: `setTokenCookies` / `clearTokenCookies`（Task 1）

- [ ] **Step 1: 修改 `Login` handler — Set-Cookie + 精简 JSON**

```go
func (h *AuthHandler) Login(c echo.Context) error {
	// ... 结构相同直到获取 resp ...

	return Respond(c, http.StatusOK, 0, "success", map[string]interface{}{
		"expires_in": resp.ExpiresIn,
	})
}
```

在 return 之前加入：

```go
setTokenCookies(c, resp.AccessToken, resp.RefreshToken, resp.ExpiresIn)
```

- [ ] **Step 2: 修改 `Register` handler**

同样的改动：return 之前调用 `setTokenCookies`，JSON 只返回 `expires_in`。

- [ ] **Step 3: 修改 `RevokeToken` handler — 从 cookie 读 refresh_token**

```go
func (h *AuthHandler) RevokeToken(c echo.Context) error {
	var req model.RevokeTokenRequest

	// 优先从 cookie 读 refresh_token
	if cookie, err := c.Cookie("refresh_token"); err == nil && cookie.Value != "" {
		req.RefreshToken = cookie.Value
	} else {
		if err := c.Bind(&req); err != nil {
			return Respond(c, http.StatusBadRequest, 400, "invalid request body", nil)
		}
	}

	if err := h.client.RevokeToken(c.Request().Context(), &req); err != nil {
		// ... 错误处理 ...
	}

	clearTokenCookies(c)
	return Respond(c, http.StatusOK, 0, "success", nil)
}
```

- [ ] **Step 4: 修改 `RevokeAllTokens` handler — 从 context 取 account_id，不再读 body**

```go
func (h *AuthHandler) RevokeAllTokens(c echo.Context) error {
	// 从 cookie 或 context 读 access_token 原文（gRPC 端需要解析 JWT 提取 account_id）
	accessToken := ""
	if cookie, err := c.Cookie("access_token"); err == nil {
		accessToken = cookie.Value
	} else if t, ok := c.Get("token").(string); ok {
		accessToken = t
	}
	if accessToken == "" {
		return Respond(c, http.StatusUnauthorized, 401, "unauthorized", nil)
	}

	req := model.RevokeAllTokensRequest{AccessToken: accessToken}

	if err := h.client.RevokeAllTokens(c.Request().Context(), &req); err != nil {
		// ... 错误处理 ...
	}

	clearTokenCookies(c)
	return Respond(c, http.StatusOK, 0, "success", nil)
}
```

- [ ] **Step 5: 修改 `RefreshToken` handler — 从 cookie 读 refresh_token**

```go
func (h *AuthHandler) RefreshToken(c echo.Context) error {
	var req model.RefreshTokenRequest

	if cookie, err := c.Cookie("refresh_token"); err == nil && cookie.Value != "" {
		req.RefreshToken = cookie.Value
	} else {
		if err := c.Bind(&req); err != nil {
			return Respond(c, http.StatusBadRequest, 400, "invalid request body", nil)
		}
	}

	resp, err := h.client.RefreshToken(c.Request().Context(), &req)
	if err != nil {
		// ... 错误处理 ...
	}

	setTokenCookies(c, resp.AccessToken, resp.RefreshToken, resp.ExpiresIn)
	return Respond(c, http.StatusOK, 0, "success", map[string]interface{}{
		"expires_in": resp.ExpiresIn,
	})
}
```

- [ ] **Step 6: 修改 `ValidateToken` handler — 从 cookie 读 access_token**

```go
func (h *AuthHandler) ValidateToken(c echo.Context) error {
	var req model.ValidateTokenRequest

	if cookie, err := c.Cookie("access_token"); err == nil && cookie.Value != "" {
		req.AccessToken = cookie.Value
	} else {
		if err := c.Bind(&req); err != nil {
			return Respond(c, http.StatusBadRequest, 400, "invalid request body", nil)
		}
	}

	resp, err := h.client.ValidateToken(c.Request().Context(), &req)
	if err != nil {
		// ... 错误处理 ...
	}

	return Respond(c, http.StatusOK, 0, "success", map[string]interface{}{
		"role": resp.Role, "expires_at": resp.ExpiresAt,
	})
}
```

- [ ] **Step 7: 更新 handler test**

修改现有测试以匹配新行为：

- `TestRegister_Success` — 不改 mock，断言改：body 不含 `access_token`/`refresh_token`，含 `expires_in`；检查 `Set-Cookie` response header
- `TestRevokeToken_Success` — 增加 cookie 测试 case
- `TestRevokeAllTokens_Success` — 改为从 cookie 读 access_token

实际上，现有测试都通过 body 传 token。我们**保留 body fallback**，所以现有测试应该继续通过。唯一需要改的是：

- `TestRegister_Success` — JSON body 不再返回 access_token/refresh_token
- `TestRevokeAllTokens_Success` — mock 断言修改（access_token 传入变了）
- `TestRevokeAllTokens_InvalidBody` — revoke-all 不再从 body 取 access_token，该测试改为验证无 cookie 时返回 401

更新断言：

```go
// TestRegister_Success — 不再返回 token 在 body
assert.NotContains(t, rec.Body.String(), "access_token")
assert.Contains(t, rec.Body.String(), "expires_in")

// TestRevokeAllTokens_Success — mock 验证 access_token 值
revokeAllTokensFunc: func(ctx context.Context, req *model.RevokeAllTokensRequest) error {
    assert.Equal(t, "access_token_abc", req.AccessToken)
    return nil
},
```

同时设置 cookie 让 handler 能读到 access_token：

```go
req, rec := newJSONRequest(http.MethodPost, "/api/v1/auth/token/revoke-all", `{}`)
c := e.NewContext(req, rec)
c.Request().Header.Set("Cookie", "access_token=access_token_abc")
```

- [ ] **Step 8: 运行测试**

```bash
go test ./apps/personal-api/pkg/handler/... -v
```

- [ ] **Step 9: 提交**

```bash
git add apps/personal-api/pkg/handler/auth.go apps/personal-api/pkg/handler/auth_test.go
git commit -m "feat: update auth handlers for cookie-based tokens"
```

---

### Task 5: 简化前端

**Files:**
- Modify: `apps/personal-web-admin/src/app/login/page.tsx`
- Modify: `apps/personal-web-admin/src/app/register/page.tsx`
- Modify: `apps/personal-web-admin/src/lib/api.ts`
- Modify: `apps/personal-web-admin/src/lib/auth.ts`
- Modify: `apps/personal-web-admin/src/app/dashboard/layout.tsx`

- [ ] **Step 1: 简化 `login/page.tsx`**

删除 `setTokens()` 调用，成功时直接跳转。

```tsx
// 改后
if (json.code !== 0) { setToast(json.message || "登录失败"); return; }
router.push("/dashboard");
```

去掉 `import { setTokens }`（如果之前 import 了）。

- [ ] **Step 2: 简化 `register/page.tsx`**

同样删除 `setTokens()` 调用。

- [ ] **Step 3: 简化 `lib/auth.ts`**

删除 `setTokens`、`getAccessToken`、`getRefreshToken`、`refreshAccessToken`、`isTokenExpired`。只保留 `redirectToLogin()`。

```typescript
// apps/personal-web-admin/src/lib/auth.ts
export function redirectToLogin() {
  window.location.href = "/login";
}
```

如果无其他引用，直接删除整个文件，在需要使用的地方内联 `window.location.href = "/login"`。

- [ ] **Step 4: 简化 `lib/api.ts`**

删除所有 token 管理逻辑：

```typescript
// apps/personal-web-admin/src/lib/api.ts
export async function api(url: string, options: RequestInit = {}): Promise<Response> {
  const headers: Record<string, string> = {};
  if (options.headers) {
    Object.assign(headers, options.headers);
  }
  if (!headers["Content-Type"] && !(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }
  return fetch(url, { ...options, headers });
}

export async function ensureToken(): Promise<void> {
  // no-op: token is managed by server via cookies
}

// 导出 redirectToLogin 以兼容现有引用
export { redirectToLogin } from "./auth";
```

- [ ] **Step 5: 简化 `dashboard/layout.tsx`**

删除 `checkAuth()` useEffect 中的 localStorage 逻辑。改为请求 `/api/v1/auth/token/validate` 验证身份。

```tsx
useEffect(() => {
  async function checkAuth() {
    try {
      const res = await fetch("/api/v1/auth/token/validate", { method: "POST" });
      if (!res.ok) { redirectToLogin(); return; }
      const json = await res.json();
      if (json.code !== 0) { redirectToLogin(); return; }
      setAuthed(true);
    } catch {
      redirectToLogin();
    }
  }
  checkAuth();
}, []);
```

删除 `handleLogout` 中的 refresh token 读取，直接调用 revoke：

```tsx
async function handleLogout() {
  await fetch("/api/v1/auth/token/revoke", { method: "POST" });
  router.push("/login");
}
```

- [ ] **Step 6: 确认前端编译通过**

```bash
cd apps/personal-web-admin && npm run build --no-lint 2>&1 | tail -20
```

- [ ] **Step 7: 提交**

```bash
git add apps/personal-web-admin/src/
git commit -m "feat: simplify frontend auth — remove localStorage token management"
```

---

### Task 6: 运行全部测试 + fmt

- [ ] **Step 1: gofmt**

```bash
make fmt
```

- [ ] **Step 2: 运行全部测试**

```bash
go test ./... 2>&1
```

- [ ] **Step 3: 最终提交**

```bash
git add -A
git commit -m "chore: fmt and finalize cookie-based token refactor"
```
