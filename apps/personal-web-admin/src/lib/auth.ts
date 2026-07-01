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


export function redirectToLogin() {
  clearTokens()
  window.location.href = "/login"
}
