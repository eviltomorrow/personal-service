import Link from "next/link";

const stats = [
  { label: "Sessions", value: "3" },
  { label: "Last login", value: "2h ago" },
  { label: "Account age", value: "14 days" },
];

const cards = [
  {
    title: "Profile",
    desc: "Manage your personal information and public profile settings.",
    icon: (
      <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
      </svg>
    ),
  },
  {
    title: "Security",
    desc: "Password, authentication methods, and active sessions.",
    icon: (
      <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
      </svg>
    ),
  },
  {
    title: "Activity",
    desc: "Review login history and recent account changes.",
    icon: (
      <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
      </svg>
    ),
  },
  {
    title: "Notifications",
    desc: "Configure email and in-app notification preferences.",
    icon: (
      <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
      </svg>
    ),
  },
  {
    title: "API Keys",
    desc: "Manage access tokens and third-party integrations.",
    icon: (
      <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z" />
      </svg>
    ),
  },
  {
    title: "Billing",
    desc: "Subscription plan, invoices, and payment methods.",
    icon: (
      <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z" />
      </svg>
    ),
  },
];

export default function DashboardPage() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background */}
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(99,102,241,0.08),transparent_50%),radial-gradient(ellipse_at_bottom_right,rgba(168,85,247,0.06),transparent_50%)]" />

      <div className="relative mx-auto max-w-5xl px-4 py-8">
        {/* Header */}
        <header className="flex items-center justify-between rounded-2xl border border-white/[0.06] bg-white/[0.03] px-6 py-4 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl bg-white/10">
              <svg className="size-4.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <span className="text-sm font-medium text-white/90">Dashboard</span>
              <span className="ml-2 rounded-md bg-white/[0.06] px-2 py-0.5 text-[11px] text-white/30">PERSONAL</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.04] px-3 py-1.5 text-xs text-white/40">
              <span className="inline-block size-1.5 rounded-full bg-emerald-400 animate-pulse-glow" />
              Online
            </div>
            <Link
              href="/login"
              className="rounded-lg border border-white/[0.08] px-3.5 py-1.5 text-xs font-medium text-white/50 transition-colors hover:bg-white/[0.06] hover:text-white/80"
            >
              Sign out
            </Link>
          </div>
        </header>

        {/* Stats row */}
        <div className="mt-8 grid grid-cols-3 gap-3">
          {stats.map((s) => (
            <div
              key={s.label}
              className="animate-fade-in rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3 backdrop-blur-xl"
            >
              <div className="text-xs text-white/30">{s.label}</div>
              <div className="mt-0.5 text-lg font-semibold tracking-tight text-white/80">{s.value}</div>
            </div>
          ))}
        </div>

        {/* Greeting */}
        <div className="animate-fade-in-delayed mt-8 rounded-2xl border border-white/[0.06] bg-gradient-to-br from-indigo-500/[0.06] to-transparent p-6 backdrop-blur-xl">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">Welcome back</h2>
              <p className="mt-1 text-sm leading-relaxed text-white/40">
                Static preview — no backend calls are being made.
              </p>
            </div>
            <div className="hidden size-10 items-center justify-center rounded-xl bg-white/[0.06] sm:flex">
              <svg className="size-5 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
              </svg>
            </div>
          </div>
        </div>

        {/* Cards grid */}
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((card, i) => (
            <div
              key={card.title}
              className="animate-fade-in group cursor-pointer rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 backdrop-blur-xl transition-all hover:border-white/[0.12] hover:bg-white/[0.04]"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div className="flex size-9 items-center justify-center rounded-lg bg-white/[0.06] text-white/50 transition-colors group-hover:bg-indigo-500/10 group-hover:text-indigo-400">
                {card.icon}
              </div>
              <h3 className="mt-4 text-sm font-medium text-white/80">{card.title}</h3>
              <p className="mt-1 text-xs leading-relaxed text-white/30">{card.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
