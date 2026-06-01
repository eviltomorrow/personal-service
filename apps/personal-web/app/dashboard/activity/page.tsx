const activityLog = [
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
];

const typeStyle: Record<string, string> = {
  security: "bg-amber-500/10 text-amber-400 border-amber-500/10",
  login: "bg-indigo-500/10 text-indigo-400 border-indigo-500/10",
  profile: "bg-emerald-500/10 text-emerald-400 border-emerald-500/10",
  api: "bg-purple-500/10 text-purple-400 border-purple-500/10",
};

export default function ActivityPage() {
  return (
    <>
      <div className="mb-8">
        <h1 className="text-xl font-semibold tracking-tight">Activity</h1>
        <p className="mt-1 text-sm text-white/35">Review your account activity and login history.</p>
      </div>

      {/* Filters */}
      <div className="animate-fade-in mb-6 flex flex-wrap items-center gap-2">
        {["All", "Security", "Login", "Profile", "API"].map((f) => (
          <button key={f} className={`rounded-lg border px-3.5 py-1.5 text-xs font-medium transition-colors ${f === "All" ? "border-white/[0.12] bg-white/[0.06] text-white/80" : "border-white/[0.06] text-white/40 hover:border-white/[0.1] hover:text-white/60"}`}>
            {f}
          </button>
        ))}
        <div className="flex-1" />
        <button className="rounded-lg border border-white/[0.06] px-3.5 py-1.5 text-xs text-white/40 transition-colors hover:border-white/[0.1] hover:text-white/60">
          Export
        </button>
      </div>

      {/* Timeline */}
      <div className="animate-fade-in-delayed rounded-xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl">
        <div className="divide-y divide-white/[0.04]">
          {activityLog.map((item, i) => (
            <div key={i} className="flex items-start gap-4 px-5 py-4 transition-colors hover:bg-white/[0.02]">
              <div className={`flex size-9 shrink-0 items-center justify-center rounded-lg border ${typeStyle[item.type] || "bg-zinc-500/10 text-zinc-400 border-zinc-500/10"}`}>
                <span className="text-xs font-bold uppercase">{item.type[0]}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-white/80">{item.action}</div>
                <div className="mt-0.5 text-xs text-white/30">{item.detail}</div>
              </div>
              <div className="shrink-0 text-xs text-white/25 pt-0.5">{item.time}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Pagination */}
      <div className="mt-6 flex items-center justify-center gap-2">
        {[1, 2, 3, "...", 8].map((p, i) => (
          <button
            key={i}
            className={`flex size-8 items-center justify-center rounded-lg text-xs transition-colors ${
              p === 1
                ? "bg-white/[0.08] text-white/80"
                : "text-white/30 hover:bg-white/[0.04] hover:text-white/60"
            }`}
          >
            {p}
          </button>
        ))}
      </div>
    </>
  );
}
