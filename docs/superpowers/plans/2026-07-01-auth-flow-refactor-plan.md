# Auth 流程改造实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将前端登录/注册从 mock 改为对接 real API，实现 token 自动续约和退出清理。

**Architecture:** Frontend (Next.js) → personal-api (HTTP) → personal-auth (gRPC)。前端新增 `lib/auth.ts`（token 存储）和 `lib/api.ts`（fetch 封装 + 自动续约）。后端修复 JWT skipper 和 account_id 来源。

**Tech Stack:** Next.js 15, React 19, TypeScript, Go 1.26.3, Echo v4, gRPC

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `apps/personal-web-admin/src/lib/auth.ts` | Create | Token 存/取/过期判断 |
| `apps/personal-web-admin/src/lib/api.ts` | Create | Fetch 封装 + 自动续约 |
| `apps/personal-web-admin/src/app/login/page.tsx` | Modify | 对接真实登录 API |
| `apps/personal-web-admin/src/app/register/page.tsx` | Modify | 对接真实注册 API |
| `apps/personal-web-admin/src/app/dashboard/layout.tsx` | Modify | 退出调 revoke API |
| `lib/http/server/http.go` | Modify | JWT skipper 加 /refresh |
| `apps/personal-api/pkg/handler/auth.go` | Modify | account_id 从 JWT context 提取 |
| `apps/personal-auth/pkg/config/config.go` | Modify | token 默认过期时间 1h/7d |

---

## Task 1: 后端修复 — JWT skipper + account_id 来源 + token 过期时间

**Files:**
- Modify: `lib/http/server/http.go` (JWT skipper)
- Modify: `apps/personal-api/pkg/handler/auth.go` (account_id 提取)
- Modify: `apps/personal-auth/pkg/config/config.go` (默认过期时间)

**Interfaces:**
- Consumes: 无
- Produces: JWT 跳过 `/auth/token/refresh`，handler account_id 从 context 取

- [ ] **Step 1: 修改 JWT skipper**

```go
// File: lib/http/server/http.go:64-70
h.handler.Use(middleware.ServerJWTInterceptor(func(c echo.Context) bool {
    path := c.Request().URL.Path
    if path == "/api/v1/auth/register" || path == "/api/v1/auth/login" || path == "/api/v1/auth/token/refresh" {
        return true
    }
    return false
}))
```

- [ ] **Step 2: 修改 handler auth.go — account_id 从 context 提取**

在 `DeleteAccount`、`UpdatePassword`、`UpdateIdentifier` 三个 handler 中，Bind 之后覆写 `AccountID`：

```go
// DeleteAccount handler — 在 c.Bind(&req) 之后，调用 client 之前
req.AccountID = c.Get("account_id").(string)

// UpdatePassword handler — 同上
req.AccountID = c.Get("account_id").(string)

// UpdateIdentifier handler — 同上
req.AccountID = c.Get("account_id").(string)
```

- [ ] **Step 3: 修改 token 默认过期时间**

```go
// File: apps/personal-auth/pkg/config/config.go:76-77
// 改前:
AccessTokenExpire:   5 * time.Minute,
RefreshTokenExpire:  30 * time.Minute,
// 改后:
AccessTokenExpire:   1 * time.Hour,
RefreshTokenExpire:  7 * 24 * time.Hour,
```

- [ ] **Step 4: 编译验证**

```bash
cd /home/shepard/Workspaces/space-go/open/src/github.com/eviltomorrow/personal-service && go build ./...
```

- [ ] **Step 5: Commit**

```bash
git add lib/http/server/http.go apps/personal-api/pkg/handler/auth.go apps/personal-auth/pkg/config/config.go
git commit -m "fix: JWT skipper add /refresh, handler account_id from context, extend token expiry"
```

---

## Task 2: 前端 Token 管理 + API 封装

**Files:**
- Create: `apps/personal-web-admin/src/lib/auth.ts`
- Create: `apps/personal-web-admin/src/lib/api.ts`

**Interfaces:**
- Consumes: 无
- Produces: `setTokens()`, `getAccessToken()`, `getRefreshToken()`, `clearTokens()`, `isTokenExpired()`, `redirectToLogin()`, `api()` fetch wrapper

- [ ] **Step 1: 创建 `lib/auth.ts`**

```typescript
const ACCESS_KEY = "auth_access_token"
const REFRESH_KEY = "auth_refresh_token"
const EXPIRE_KEY = "auth_expires_at"

export function setTokens(accessToken: string, refreshToken: string, expiresIn: number) {
  localStorage.setItem(ACCESS_KEY, accessToken)
  localStorage.setItem(REFRESH_KEY, refreshToken)
  localStorage.setItem(EXPIRE_KEY, String(Date.now() + expiresIn * 1000 - 30000))
}

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_KEY)
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_KEY)
}

export function isTokenExpired(): boolean {
  const exp = localStorage.getItem(EXPIRE_KEY)
  return !exp || Date.now() > parseInt(exp, 10)
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_KEY)
  localStorage.removeItem(REFRESH_KEY)
  localStorage.removeItem(EXPIRE_KEY)
}

export function redirectToLogin() {
  clearTokens()
  window.location.href = "/login"
}
```

- [ ] **Step 2: 创建 `lib/api.ts`**

```typescript
import { getAccessToken, getRefreshToken, setTokens, isTokenExpired, redirectToLogin } from "./auth"

let refreshing: Promise<void> | null = null

async function doRefresh(): Promise<void> {
  const refreshToken = getRefreshToken()
  if (!refreshToken) { redirectToLogin(); return }

  const res = await fetch("/api/v1/auth/token/refresh", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: refreshToken }),
  })
  if (!res.ok) { redirectToLogin(); return }

  const json = await res.json()
  if (json.code !== 0) { redirectToLogin(); return }

  setTokens(json.data.access_token, json.data.refresh_token, json.data.expires_in)
}

async function ensureToken(): Promise<void> {
  if (!isTokenExpired()) return
  if (!refreshing) refreshing = doRefresh().finally(() => { refreshing = null })
  await refreshing
}

export async function api(url: string, options: RequestInit = {}): Promise<Response> {
  await ensureToken()
  const token = getAccessToken()
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  }
  if (token) headers["Authorization"] = `Bearer ${token}`
  if (!headers["Content-Type"] && !(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json"
  }

  const res = await fetch(url, { ...options, headers })
  if (res.status === 401) {
    await doRefresh()
    const newToken = getAccessToken()
    if (newToken) {
      headers["Authorization"] = `Bearer ${newToken}`
      return fetch(url, { ...options, headers })
    }
    redirectToLogin()
  }
  return res
}
```

- [ ] **Step 3: 编译验证**

```bash
cd /home/shepard/Workspaces/space-go/open/src/github.com/eviltomorrow/personal-service/apps/personal-web-admin && npx next build 2>&1 | tail -10
```

- [ ] **Step 4: Commit**

```bash
git add apps/personal-web-admin/src/lib/auth.ts apps/personal-web-admin/src/lib/api.ts
git commit -m "feat: add auth token management and API fetch wrapper"
```

---

## Task 3: 前端登录/注册页对接 API

**Files:**
- Modify: `apps/personal-web-admin/src/app/login/page.tsx`
- Modify: `apps/personal-web-admin/src/app/register/page.tsx`

**Interfaces:**
- Consumes: `api()` from `lib/api.ts`, `setTokens()` from `lib/auth.ts`

- [ ] **Step 1: 修改登录页**

将 `handleSubmit` 中的 mock 逻辑替换为真实 API 调用：

```typescript
import { useRouter } from "next/navigation"
import { setTokens } from "@/lib/auth"
import { api } from "@/lib/api"

// 替换 handleSubmit 函数:
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  const empty: string[] = []
  if (!email) empty.push("email")
  if (!password) empty.push("password")
  setMissingFields(empty)
  if (empty.length > 0) return

  setLoading(true)
  try {
    const res = await api("/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify({ auth_type: "email", identifier: email, password }),
    })
    const json = await res.json()
    if (json.code !== 0) {
      // 显示服务端错误消息
      setToast(json.message || "登录失败")
      return
    }
    setTokens(json.data.access_token, json.data.refresh_token, json.data.expires_in)
    router.push("/dashboard")
  } catch {
    setToast("网络错误，请稍后重试")
  } finally {
    setLoading(false)
  }
}
```

移除 `useEffect` 中的 mock toast 监听逻辑（`registered=true`、`reset=true`）。

- [ ] **Step 2: 修改注册页**

将 `handleSubmit` 替换为真实 API 调用：

```typescript
import { useRouter } from "next/navigation"
import { setTokens } from "@/lib/auth"
import { api } from "@/lib/api"

// 替换 handleSubmit:
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  const empty: string[] = []
  if (!email) empty.push("email")
  if (!password) empty.push("password")
  if (!confirmPassword) empty.push("confirmPassword")
  setMissingFields(empty)
  if (empty.length > 0) return

  if (password !== confirmPassword) {
    setPasswordMismatch(true)
    return
  }
  setPasswordMismatch(false)

  setLoading(true)
  try {
    const res = await api("/api/v1/auth/register", {
      method: "POST",
      body: JSON.stringify({ auth_type: "email", identifier: email, password }),
    })
    const json = await res.json()
    if (json.code !== 0) {
      // 显示错误，用 toast 或 error state
      return
    }
    setTokens(json.data.access_token, json.data.refresh_token, json.data.expires_in)
    router.push("/dashboard")
  } catch {
    // 网络错误
  } finally {
    setLoading(false)
  }
}
```

- [ ] **Step 3: 编译验证**

```bash
cd /home/shepard/Workspaces/space-go/open/src/github.com/eviltomorrow/personal-service/apps/personal-web-admin && npx next build 2>&1 | tail -10
```

- [ ] **Step 4: Commit**

```bash
git add apps/personal-web-admin/src/app/login/page.tsx apps/personal-web-admin/src/app/register/page.tsx
git commit -m "feat: connect login/register pages to real API"
```

---

## Task 4: 退出登录调 revoke API

**Files:**
- Modify: `apps/personal-web-admin/src/app/dashboard/layout.tsx`

- [ ] **Step 1: 修改退出按钮**

当前的退出按钮（`layout.tsx:242-249`）只做页面跳转。改为调 revoke API + 清除 token：

```typescript
// 文件顶部添加 import
import { clearTokens, getRefreshToken } from "@/lib/auth"
import { useRouter } from "next/navigation"

// 添加退出函数
async function handleLogout() {
  const refreshToken = getRefreshToken()
  if (refreshToken) {
    try {
      await fetch("/api/v1/auth/token/revoke", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refreshToken }),
      })
    } catch { /* ignore */ }
  }
  clearTokens()
  router.push("/login")
}
```

在组件内添加 `const router = useRouter()`，修改退出按钮的 `onClick`：

```tsx
<button
  onClick={handleLogout}
  className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
>
  <LogOut className="h-4 w-4 shrink-0" />
  退出登录
</button>
```

- [ ] **Step 2: 编译验证**

```bash
cd /home/shepard/Workspaces/space-go/open/src/github.com/eviltomorrow/personal-service/apps/personal-web-admin && npx next build 2>&1 | tail -10
```

- [ ] **Step 3: 提交**

```bash
git add apps/personal-web-admin/src/app/dashboard/layout.tsx
git commit -m "feat: logout revokes token and clears local storage"
```

---

## Task 5: 全量验证

- [ ] **Step 1: Go 后端编译**

```bash
cd /home/shepard/Workspaces/space-go/open/src/github.com/eviltomorrow/personal-service && go build ./...
```

- [ ] **Step 2: Next.js 前端编译**

```bash
cd /home/shepard/Workspaces/space-go/open/src/github.com/eviltomorrow/personal-service/apps/personal-web-admin && npx next build 2>&1 | tail -10
```

- [ ] **Step 3: 最终提交**

```bash
git add -A && git commit -m "chore: final verification pass"
```
