import { getAccessToken, getRefreshToken, isTokenExpired, redirectToLogin, refreshAccessToken } from "./auth"

let refreshing: Promise<boolean> | null = null

function headersToRecord(headers: RequestInit["headers"]): Record<string, string> {
  if (!headers) return {}
  if (Array.isArray(headers)) {
    return Object.fromEntries(headers)
  }
  if (headers instanceof Headers) {
    const record: Record<string, string> = {}
    headers.forEach((value, key) => { record[key] = value })
    return record
  }
  return headers
}

async function ensureToken(): Promise<void> {
  if (getAccessToken() && !isTokenExpired()) return
  if (!getRefreshToken()) { redirectToLogin(); return }
  if (!refreshing) refreshing = refreshAccessToken().finally(() => { refreshing = null })
  const ok = await refreshing
  if (!ok) redirectToLogin()
}

export async function api(url: string, options: RequestInit = {}): Promise<Response> {
  await ensureToken()
  const token = getAccessToken()
  const headers: Record<string, string> = headersToRecord(options.headers)
  if (token) headers["Authorization"] = `Bearer ${token}`
  if (!headers["Content-Type"] && !(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json"
  }

  const res = await fetch(url, { ...options, headers })
  if (res.status === 401) {
    const refreshed = await refreshAccessToken()
    if (refreshed) {
      headers["Authorization"] = `Bearer ${getAccessToken()}`
      return fetch(url, { ...options, headers })
    }
    redirectToLogin()
  }
  return res
}
