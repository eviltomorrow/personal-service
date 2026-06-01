const stats = [
  {
    label: "Active sessions", value: "3", change: "+1", positive: true,
    icon: (
      <svg className="size-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
      </svg>
    ),
  },
  {
    label: "Logged in as", value: "user@example.com",
    icon: (
      <svg className="size-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
      </svg>
    ),
  },
  {
    label: "Account age", value: "14 days",
    icon: (
      <svg className="size-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
      </svg>
    ),
  },
  {
    label: "Last login", value: "2 hours ago",
    icon: (
      <svg className="size-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
      </svg>
    ),
  },
];

const recentActivity = [
  { action: "Password changed", time: "2 hours ago", type: "security" },
  { action: "New login from Chrome on macOS", time: "3 hours ago", type: "login" },
  { action: "Profile email updated", time: "1 day ago", type: "profile" },
  { action: "API key generated", time: "3 days ago", type: "api" },
  { action: "Two-factor authentication enabled", time: "5 days ago", type: "security" },
];

const activityIcon = (type: string) => {
  const map: Record<string, [string, string]> = {
    security: ["bg-amber-500/10 text-amber-400", "M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z"],
    login: ["bg-indigo-500/10 text-indigo-400", "M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9"],
    profile: ["bg-emerald-500/10 text-emerald-400", "M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"],
    api: ["bg-purple-500/10 text-purple-400", "M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z"],
  };
  const [cls, path] = map[type] || ["bg-zinc-500/10 text-zinc-400", ""];
  return (
    <div className={`flex size-8 items-center justify-center rounded-lg ${cls}`}>
      <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d={path} />
      </svg>
    </div>
  );
};

const quickActions = [
  { label: "New API Key", icon: "🔑" },
  { label: "Invite user", icon: "👤" },
  { label: "Export data", icon: "📥" },
  { label: "View logs", icon: "📋" },
];

export default function DashboardPage() {
  return (
    <>
      <div className="mb-8">
        <h1 className="text-xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-white/35">Overview of your account activity and status.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s, i) => (
          <div key={s.label} className="animate-fade-in rounded-xl border border-white/[0.06] bg-white/[0.03] p-5 backdrop-blur-xl transition-all hover:border-white/[0.1] hover:bg-white/[0.05]" style={{ animationDelay: `${i * 60}ms` }}>
            <div className="flex items-center justify-between">
              <div className="flex size-9 items-center justify-center rounded-lg bg-white/[0.06] text-white/40">{s.icon}</div>
              {"change" in s && (
                <span className={`rounded-md px-1.5 py-0.5 text-[11px] font-medium ${s.positive ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>{s.change}</span>
              )}
            </div>
            <div className="mt-3 text-2xl font-semibold tracking-tight text-white/90">{s.value}</div>
            <div className="mt-0.5 text-xs text-white/30">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="animate-fade-in-delayed rounded-xl border border-white/[0.06] bg-white/[0.03] p-5 backdrop-blur-xl lg:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-medium text-white/80">Recent activity</h2>
            <a href="/dashboard/activity" className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">View all</a>
          </div>
          <div className="space-y-4">
            {recentActivity.map((item) => (
              <div key={item.action} className="flex items-center gap-4">
                {activityIcon(item.type)}
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-white/80 truncate">{item.action}</div>
                  <div className="text-xs text-white/30">{item.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="animate-fade-in-delayed rounded-xl border border-white/[0.06] bg-white/[0.03] p-5 backdrop-blur-xl">
          <h2 className="text-sm font-medium text-white/80 mb-4">Quick actions</h2>
          <div className="space-y-2">
            {quickActions.map((a) => (
              <button key={a.label} className="flex w-full items-center gap-3 rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-sm text-white/60 transition-all hover:border-white/[0.1] hover:bg-white/[0.04] hover:text-white/80">
                <span className="text-base">{a.icon}</span>
                {a.label}
              </button>
            ))}
          </div>
          <div className="mt-5 rounded-lg bg-gradient-to-br from-indigo-500/[0.08] to-purple-500/[0.04] border border-indigo-500/10 p-4">
            <div className="flex items-center gap-2">
              <span className="inline-block size-2 rounded-full bg-emerald-400 animate-pulse-glow" />
              <span className="text-xs font-medium text-emerald-400/80">All systems operational</span>
            </div>
            <p className="mt-2 text-[11px] text-white/30 leading-relaxed">Static preview — no backend calls are being made.</p>
          </div>
        </div>
      </div>
    </>
  );
}
