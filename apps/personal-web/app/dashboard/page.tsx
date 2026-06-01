"use client";

import { useState } from "react";
import Link from "next/link";

const navItems = [
  {
    label: "Dashboard",
    icon: (
      <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
      </svg>
    ),
    active: true,
  },
  {
    label: "Profile",
    icon: (
      <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
      </svg>
    ),
  },
  {
    label: "Security",
    icon: (
      <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
      </svg>
    ),
  },
  {
    label: "Activity",
    icon: (
      <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
      </svg>
    ),
  },
  {
    label: "API Keys",
    icon: (
      <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z" />
      </svg>
    ),
  },
  {
    label: "Settings",
    icon: (
      <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
      </svg>
    ),
  },
];

const stats = [
  {
    label: "Active sessions",
    value: "3",
    change: "+1",
    positive: true,
    icon: (
      <svg className="size-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
      </svg>
    ),
  },
  {
    label: "Logged in as",
    value: "user@example.com",
    icon: (
      <svg className="size-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
      </svg>
    ),
  },
  {
    label: "Account age",
    value: "14 days",
    icon: (
      <svg className="size-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
      </svg>
    ),
  },
  {
    label: "Last login",
    value: "2 hours ago",
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
  switch (type) {
    case "security":
      return (
        <div className="flex size-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400">
          <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
          </svg>
        </div>
      );
    case "login":
      return (
        <div className="flex size-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400">
          <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
          </svg>
        </div>
      );
    case "profile":
      return (
        <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
          <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
          </svg>
        </div>
      );
    case "api":
      return (
        <div className="flex size-8 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400">
          <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z" />
          </svg>
        </div>
      );
    default:
      return null;
  }
};

const quickActions = [
  { label: "New API Key", icon: "🔑" },
  { label: "Invite user", icon: "👤" },
  { label: "Export data", icon: "📥" },
  { label: "View logs", icon: "📋" },
];

export default function DashboardPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-[#07070b]">
      {/* ===== Background ===== */}
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(99,102,241,0.06),transparent_50%),radial-gradient(ellipse_at_bottom_right,rgba(168,85,247,0.04),transparent_50%)]" />

      {/* ===== Mobile sidebar overlay ===== */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ===== Sidebar ===== */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-white/[0.06] bg-[#0a0a0f]/90 backdrop-blur-2xl transition-transform lg:static lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 border-b border-white/[0.06] px-6 py-5">
          <div className="relative flex size-9 items-center justify-center rounded-xl bg-white/[0.08] ring-1 ring-white/[0.06]">
            <div className="pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-b from-white/10 to-transparent" />
            <svg className="relative size-4.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <div className="text-sm font-semibold text-white/90">Personal</div>
            <div className="text-[10px] text-white/20">account platform</div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {navItems.map((item) => (
            <a
              key={item.label}
              href="#"
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all ${
                item.active
                  ? "bg-white/[0.08] font-medium text-white shadow-sm"
                  : "text-white/40 hover:bg-white/[0.04] hover:text-white/70"
              }`}
            >
              {item.icon}
              {item.label}
            </a>
          ))}
        </nav>

        {/* Bottom section */}
        <div className="border-t border-white/[0.06] p-4">
          <div className="flex items-center gap-3 rounded-lg px-3 py-2.5">
            <div className="flex size-8 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-[11px] font-bold text-white">
              JD
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-white/80 truncate">John Doe</div>
              <div className="text-[11px] text-white/30 truncate">john@example.com</div>
            </div>
          </div>
        </div>
      </aside>

      {/* ===== Main area ===== */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* ===== Top header ===== */}
        <header className="sticky top-0 z-30 flex items-center gap-4 border-b border-white/[0.06] bg-[#07070b]/80 px-4 py-3 backdrop-blur-2xl sm:px-6">
          {/* Mobile menu button */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="flex size-9 items-center justify-center rounded-lg text-white/40 hover:bg-white/[0.06] hover:text-white/70 lg:hidden"
          >
            <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>

          {/* Breadcrumb */}
          <div className="hidden items-center gap-2 text-sm sm:flex">
            <span className="text-white/30">Personal</span>
            <svg className="size-3 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
            <span className="text-white/80">Dashboard</span>
          </div>

          <div className="flex-1" />

          {/* Search */}
          <div className="relative hidden md:block">
            <svg
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/20"
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
            <input
              type="text"
              placeholder="Search..."
              className="w-56 rounded-lg border border-white/[0.06] bg-white/[0.04] py-1.5 pr-3 pl-9 text-xs text-white/70 placeholder-white/20 outline-none transition-colors focus:border-white/[0.1] focus:bg-white/[0.06]"
            />
          </div>

          {/* Notifications */}
          <button className="relative flex size-9 items-center justify-center rounded-lg text-white/40 hover:bg-white/[0.06] hover:text-white/70">
            <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
            </svg>
            <span className="absolute top-2 right-2.5 size-1.5 rounded-full bg-indigo-400 ring-1 ring-[#07070b]" />
          </button>

          {/* Avatar */}
          <div className="flex size-9 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-xs font-bold text-white cursor-pointer">
            JD
          </div>
        </header>

        {/* ===== Content ===== */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {/* Page title */}
          <div className="mb-8">
            <h1 className="text-xl font-semibold tracking-tight">Dashboard</h1>
            <p className="mt-1 text-sm text-white/35">Overview of your account activity and status.</p>
          </div>

          {/* ===== Stats grid ===== */}
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map((s, i) => (
              <div
                key={s.label}
                className="animate-fade-in rounded-xl border border-white/[0.06] bg-white/[0.03] p-5 backdrop-blur-xl transition-all hover:border-white/[0.1] hover:bg-white/[0.05]"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex size-9 items-center justify-center rounded-lg bg-white/[0.06] text-white/40">
                    {s.icon}
                  </div>
                  {"change" in s && (
                    <span
                      className={`rounded-md px-1.5 py-0.5 text-[11px] font-medium ${
                        s.positive
                          ? "bg-emerald-500/10 text-emerald-400"
                          : "bg-red-500/10 text-red-400"
                      }`}
                    >
                      {s.change}
                    </span>
                  )}
                </div>
                <div className="mt-3 text-2xl font-semibold tracking-tight text-white/90">{s.value}</div>
                <div className="mt-0.5 text-xs text-white/30">{s.label}</div>
              </div>
            ))}
          </div>

          {/* ===== Main grid ===== */}
          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            {/* Recent activity */}
            <div className="animate-fade-in-delayed rounded-xl border border-white/[0.06] bg-white/[0.03] p-5 backdrop-blur-xl lg:col-span-2">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-sm font-medium text-white/80">Recent activity</h2>
                <a href="#" className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
                  View all
                </a>
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

            {/* Quick actions */}
            <div className="animate-fade-in-delayed rounded-xl border border-white/[0.06] bg-white/[0.03] p-5 backdrop-blur-xl">
              <h2 className="text-sm font-medium text-white/80 mb-4">Quick actions</h2>
              <div className="space-y-2">
                {quickActions.map((action) => (
                  <button
                    key={action.label}
                    className="flex w-full items-center gap-3 rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-sm text-white/60 transition-all hover:border-white/[0.1] hover:bg-white/[0.04] hover:text-white/80"
                  >
                    <span className="text-base">{action.icon}</span>
                    {action.label}
                  </button>
                ))}
              </div>

              {/* Status card */}
              <div className="mt-5 rounded-lg bg-gradient-to-br from-indigo-500/[0.08] to-purple-500/[0.04] border border-indigo-500/10 p-4">
                <div className="flex items-center gap-2">
                  <span className="inline-block size-2 rounded-full bg-emerald-400 animate-pulse-glow" />
                  <span className="text-xs font-medium text-emerald-400/80">All systems operational</span>
                </div>
                <p className="mt-2 text-[11px] text-white/30 leading-relaxed">
                  Static preview — no backend calls are being made.
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
