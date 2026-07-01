export async function api(url: string, options: RequestInit = {}): Promise<Response> {
  const headers: Record<string, string> = {};
  if (options.headers) {
    Object.assign(headers, options.headers);
  }
  if (!headers["Content-Type"] && !(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(url, { ...options, headers });

  if (res.status === 401) {
    try {
      const refreshRes = await fetch("/api/v1/auth/token/refresh", { method: "POST" });
      if (refreshRes.ok) {
        const json = await refreshRes.json();
        if (json.code === 0) {
          return fetch(url, { ...options, headers });
        }
      }
    } catch {
      // refresh failed, return original 401 response
    }
  }

  return res;
}

export { redirectToLogin } from "./auth";
