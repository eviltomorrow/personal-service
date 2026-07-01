import { getAccessToken, getRefreshToken, setTokens, isTokenExpired, redirectToLogin } from "./auth"

let refreshing: Promise<void> | null = null

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
  const headers: Record<string, string> = headersToRecord(options.headers)
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
