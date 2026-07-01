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

export { redirectToLogin } from "./auth";
