const ACCESS_KEY = "auth_access_token"
const REFRESH_KEY = "auth_refresh_token"
const EXPIRE_KEY = "auth_expires_at"

function storage(): Storage | null {
  return typeof localStorage !== "undefined" ? localStorage : null
}

export function setTokens(accessToken: string, refreshToken: string, expiresIn: number) {
  const s = storage()
  if (!s) return
  s.setItem(ACCESS_KEY, accessToken)
  s.setItem(REFRESH_KEY, refreshToken)
  s.setItem(EXPIRE_KEY, String(Date.now() + expiresIn * 1000 - 30000))
}

export function getAccessToken(): string | null {
  return storage()?.getItem(ACCESS_KEY) ?? null
}

export function getRefreshToken(): string | null {
  return storage()?.getItem(REFRESH_KEY) ?? null
}

export function isTokenExpired(): boolean {
  const exp = storage()?.getItem(EXPIRE_KEY)
  return !exp || Date.now() > parseInt(exp, 10)
}

export function clearTokens() {
  const s = storage()
  if (!s) return
  s.removeItem(ACCESS_KEY)
  s.removeItem(REFRESH_KEY)
  s.removeItem(EXPIRE_KEY)
}

export async function refreshAccessToken(): Promise<boolean> {
  const refreshToken = getRefreshToken()
  if (!refreshToken) return false

  try {
    const res = await fetch("/api/v1/auth/token/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    })
    if (!res.ok) return false

    const json = await res.json()
    if (json.code !== 0) return false

    setTokens(json.data.access_token, json.data.refresh_token, json.data.expires_in)
    return true
  } catch {
    return false
  }
}

export function redirectToLogin() {
  clearTokens()
  window.location.href = "/login"
}
