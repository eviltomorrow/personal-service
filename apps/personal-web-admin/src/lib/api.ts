let refreshing: Promise<boolean> | null = null;
let refreshTimer: ReturnType<typeof setInterval> | null = null;
let tokenExpiresIn = 0;

async function doRefresh(): Promise<boolean> {
  if (refreshing) return refreshing;
  refreshing = (async () => {
    try {
      const res = await fetch("/api/v1/auth/token/refresh", { method: "POST" });
      if (!res.ok) return false;
      const json = await res.json();
      if (json.code === 0 && json.data?.expires_in) {
        scheduleRefresh(json.data.expires_in);
      }
      return json.code === 0;
    } catch {
      return false;
    }
  })();
  const result = await refreshing;
  refreshing = null;
  return result;
}

function scheduleRefresh(expiresIn: number) {
  tokenExpiresIn = expiresIn;
  if (refreshTimer) { clearInterval(refreshTimer); refreshTimer = null; }
  const intervalMs = Math.max(expiresIn * 800, 60_000);
  refreshTimer = setInterval(async () => {
    const ok = await doRefresh();
    if (!ok) {
      if (refreshTimer) { clearInterval(refreshTimer); refreshTimer = null; }
      window.location.href = "/login";
    }
  }, intervalMs);
}

export function setRefreshInterval(expiresIn: number) {
  if (!refreshTimer) scheduleRefresh(expiresIn);
}

if (typeof window !== "undefined") {
  scheduleRefresh(tokenExpiresIn || 300);
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
    window.location.href = "/login";
  }

  return res;
}
