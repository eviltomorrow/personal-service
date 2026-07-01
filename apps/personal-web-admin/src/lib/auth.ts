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
