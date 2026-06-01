const typeStyle: Record<string, string> = {
  security: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/10",
  login: "bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/10",
  profile: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/10",
  api: "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/10",
};

export default function ActivityPage() {
  return (
    <>
      <div className="mb-8">
        <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-white">Activity</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-white/35">Review your account activity and login history.</p>
      </div>

      <div className="animate-fade-in mb-6 flex flex-wrap items-center gap-2">
        {["All", "Security", "Login", "Profile", "API"].map((f) => (
          <button key={f} className={`rounded-lg border px-3.5 py-1.5 text-xs font-medium transition-colors ${f === "All" ? "border-zinc-300 bg-zinc-100 text-zinc-800 dark:border-white/[0.12] dark:bg-white/[0.06] dark:text-white/80" : "border-zinc-200 text-zinc-500 hover:border-zinc-300 hover:text-zinc-700 dark:border-white/[0.06] dark:text-white/40 dark:hover:border-white/[0.1] dark:hover:text-white/60"}`}>
            {f}
          </button>
        ))}
        <div className="flex-1" />
        <button className="rounded-lg border border-zinc-200 px-3.5 py-1.5 text-xs text-zinc-500 transition-colors hover:border-zinc-300 hover:text-zinc-700 dark:border-white/[0.06] dark:text-white/40 dark:hover:border-white/[0.1] dark:hover:text-white/60">Export</button>
      </div>

      <div className="animate-fade-in-delayed rounded-xl border border-zinc-200 bg-white dark:border-white/[0.06] dark:bg-white/[0.03] dark:backdrop-blur-xl">
        <div className="divide-y divide-zinc-100 dark:divide-white/[0.04]">
          {[
            { action: "Password changed", time: "2 hours ago", type: "security", detail: "Account password was updated successfully." },
            { action: "New login detected", time: "3 hours ago", type: "login", detail: "Chrome on macOS · San Francisco, US · 203.0.113.42" },
            { action: "Profile email updated", time: "1 day ago", type: "profile", detail: "Email changed from old@example.com to john@example.com" },
            { action: "API key generated", time: "3 days ago", type: "api", detail: "A new API key was created with read-only permissions." },
            { action: "Two-factor authentication enabled", time: "5 days ago", type: "security", detail: "Authenticator app was configured for account." },
            { action: "Login from new device", time: "1 week ago", type: "login", detail: "Firefox on Windows · New York, US · 192.0.2.15" },
            { action: "Profile avatar updated", time: "1 week ago", type: "profile", detail: "Profile picture was changed." },
            { action: "Password changed", time: "2 weeks ago", type: "security", detail: "Account password was updated successfully." },
            { action: "API key revoked", time: "2 weeks ago", type: "api", detail: "API key with ID `key_prod_abc123` was revoked." },
            { action: "Account created", time: "14 days ago", type: "profile", detail: "Account was created with email john@example.com." },
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-4 px-5 py-4 transition-colors hover:bg-zinc-50 dark:hover:bg-white/[0.02]">
              <div className={`flex size-9 shrink-0 items-center justify-center rounded-lg border ${typeStyle[item.type] || "bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-500/10 dark:text-zinc-400 dark:border-zinc-500/10"}`}>
                <span className="text-xs font-bold uppercase">{item.type[0]}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-zinc-800 dark:text-white/80">{item.action}</div>
                <div className="mt-0.5 text-xs text-zinc-500 dark:text-white/30">{item.detail}</div>
              </div>
              <div className="shrink-0 text-xs text-zinc-400 pt-0.5 dark:text-white/25">{item.time}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 flex items-center justify-center gap-2">
        {[1, 2, 3, "...", 8].map((p, i) => (
          <button key={i} className={`flex size-8 items-center justify-center rounded-lg text-xs transition-colors ${p === 1 ? "bg-zinc-100 text-zinc-800 dark:bg-white/[0.08] dark:text-white/80" : "text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:text-white/30 dark:hover:bg-white/[0.04] dark:hover:text-white/60"}`}>{p}</button>
        ))}
      </div>
    </>
  );
}
