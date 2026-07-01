let refreshing: Promise<boolean> | null = null;

async function doRefresh(): Promise<boolean> {
  if (refreshing) return refreshing;
  refreshing = (async () => {
    try {
      const res = await fetch("/api/v1/auth/token/refresh", { method: "POST" });
      if (!res.ok) return false;
      const json = await res.json();
      return json.code === 0;
    } catch {
      return false;
    }
  })();
  const result = await refreshing;
  refreshing = null;
  return result;
}

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
    if (await doRefresh()) {
      return fetch(url, { ...options, headers });
    }
  }

  return res;
}

export { redirectToLogin } from "./auth";
