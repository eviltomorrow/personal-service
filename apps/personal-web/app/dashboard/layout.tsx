"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "@/app/_components/theme-provider";
import { useLocale } from "@/app/_components/locale-provider";

const notifications = [
  { id: 1, title: "New login detected", desc: "Chrome on macOS · San Francisco, US", time: "2 min ago", type: "login", unread: true },
  { id: 2, title: "Password changed", desc: "Your account password was updated", time: "2 hours ago", type: "security", unread: true },
  { id: 3, title: "API key generated", desc: "A new API key was created", time: "1 day ago", type: "api", unread: false },
  { id: 4, title: "Profile updated", desc: "Email address was changed", time: "3 days ago", type: "profile", unread: false },
];

const notificationIcon = (type: string) => {
  switch (type) {
    case "login": return "🔑";
    case "security": return "🛡️";
    case "api": return "🔌";
    case "profile": return "👤";
    default: return "📬";
  }
};

const navItems = [
  { labelKey: "nav_dashboard", href: "/dashboard", icon: (
    <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
    </svg>
  )},
  { labelKey: "nav_profile", href: "/dashboard/profile", icon: (
    <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
    </svg>
  )},
  { labelKey: "nav_security", href: "/dashboard/security", icon: (
    <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
    </svg>
  )},
  { labelKey: "nav_activity", href: "/dashboard/activity", icon: (
    <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  )},
  { labelKey: "nav_api_keys", href: "/dashboard/api-keys", icon: (
    <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z" />
    </svg>
  )},
  { labelKey: "nav_settings", href: "/dashboard/settings", icon: (
    <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    </svg>
  )},
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { theme, toggle } = useTheme();
  const { t, locale, setLocale } = useLocale();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
      if (userRef.current && !userRef.current.contains(e.target as Node)) setUserMenuOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => n.unread).length;

  return (
    <div className="flex min-h-screen bg-zinc-50 dark:bg-[#07070b]">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(99,102,241,0.04),transparent_50%),radial-gradient(ellipse_at_bottom_right,rgba(168,85,247,0.03),transparent_50%)] dark:bg-[radial-gradient(ellipse_at_top_left,rgba(99,102,241,0.06),transparent_50%),radial-gradient(ellipse_at_bottom_right,rgba(168,85,247,0.04),transparent_50%)]" />

      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm dark:bg-black/60 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-zinc-200 bg-white/90 backdrop-blur-2xl transition-transform dark:border-white/[0.06] dark:bg-[#0a0a0f]/90 lg:static lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center gap-3 border-b border-zinc-200 px-6 py-5 dark:border-white/[0.06]">
          <div className="relative flex size-9 items-center justify-center rounded-xl bg-zinc-900 text-white ring-1 ring-zinc-800 dark:bg-white/[0.08] dark:ring-white/[0.06]">
            <svg className="size-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <div className="text-sm font-semibold text-zinc-900 dark:text-white/90">{t.brand}</div>
            <div className="text-[10px] text-zinc-400 dark:text-white/20">{t.account_platform}</div>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.labelKey}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all ${
                  isActive
                    ? "bg-zinc-100 font-medium text-zinc-900 dark:bg-white/[0.08] dark:text-white"
                    : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 dark:text-white/40 dark:hover:bg-white/[0.04] dark:hover:text-white/70"
                }`}
              >
                {item.icon}
                {t[item.labelKey as keyof typeof t]}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-zinc-200 p-4 dark:border-white/[0.06]">
          <Link href="/dashboard/profile" className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-zinc-100 dark:hover:bg-white/[0.04]">
            <div className="flex size-8 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-[11px] font-bold text-white">JD</div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-zinc-900 truncate dark:text-white/80">John Doe</div>
              <div className="text-[11px] text-zinc-400 truncate dark:text-white/30">john@example.com</div>
            </div>
          </Link>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="sticky top-0 z-30 flex items-center gap-4 border-b border-zinc-200 bg-zinc-50/80 px-4 py-3 backdrop-blur-2xl dark:border-white/[0.06] dark:bg-[#07070b]/80 sm:px-6">
          <button
            onClick={() => setSidebarOpen(true)}
            className="flex size-9 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:text-white/40 dark:hover:bg-white/[0.06] dark:hover:text-white/70 lg:hidden"
          >
            <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>

          <div className="hidden items-center gap-2 text-sm sm:flex">
            <Link href="/dashboard" className="text-zinc-400 hover:text-zinc-600 transition-colors dark:text-white/30 dark:hover:text-white/50">{t.brand}</Link>
            <svg className="size-3 text-zinc-300 dark:text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
            <span className="text-zinc-800 dark:text-white/80">{t[navItems.find((i) => i.href === pathname)?.labelKey as keyof typeof t] || t.nav_dashboard}</span>
          </div>

          <div className="flex-1" />

          {/* Search */}
          <div className="relative hidden md:block">
            <svg className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-300 dark:text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
            <input type="text" placeholder={t.search_placeholder} className="w-56 rounded-lg border border-zinc-200 bg-white py-1.5 pr-3 pl-9 text-xs text-zinc-600 placeholder-zinc-400 outline-none transition-colors focus:border-zinc-300 dark:border-white/[0.06] dark:bg-white/[0.04] dark:text-white/70 dark:placeholder-white/20 dark:focus:border-white/[0.1] dark:focus:bg-white/[0.06]" />
          </div>

          {/* Locale toggle */}
          <button
            onClick={() => setLocale(locale === "en" ? "zh" : "en")}
            className="flex size-9 items-center justify-center rounded-lg text-xs font-medium text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:text-white/40 dark:hover:bg-white/[0.06] dark:hover:text-white/70 transition-colors"
          >
            {locale === "en" ? "中" : "EN"}
          </button>

          {/* Theme toggle */}
          <button
            onClick={toggle}
            className="flex size-9 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:text-white/40 dark:hover:bg-white/[0.06] dark:hover:text-white/70 transition-colors"
          >
            {theme === "dark" ? (
              <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
              </svg>
            ) : (
              <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
              </svg>
            )}
          </button>

          {/* Notifications */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => { setNotifOpen(!notifOpen); setUserMenuOpen(false); }}
              className="relative flex size-9 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:text-white/40 dark:hover:bg-white/[0.06] dark:hover:text-white/70 transition-colors"
            >
              <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
              </svg>
              {unreadCount > 0 && (
                <span className="absolute top-2 right-2.5 flex size-4 items-center justify-center rounded-full bg-indigo-500 text-[9px] font-bold text-white ring-1 ring-zinc-50 dark:ring-[#07070b]">
                  {unreadCount}
                </span>
              )}
            </button>

            {notifOpen && (
              <div className="absolute right-0 mt-2 w-80 rounded-xl border border-zinc-200 bg-white/95 p-2 shadow-lg shadow-black/5 backdrop-blur-2xl dark:border-white/[0.08] dark:bg-[#0c0c14]/95 dark:shadow-black/50">
                <div className="flex items-center justify-between px-3 py-2">
                  <span className="text-xs font-medium text-zinc-600 dark:text-white/60">{t.notifications}</span>
                  <button className="text-[10px] text-indigo-500 hover:text-indigo-600 transition-colors dark:text-indigo-400 dark:hover:text-indigo-300">{t.mark_all_read}</button>
                </div>
                <div className="space-y-1">
                  {notifications.map((n) => (
                    <div key={n.id} className={`flex items-start gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-zinc-50 dark:hover:bg-white/[0.04] ${n.unread ? "bg-zinc-50 dark:bg-white/[0.02]" : ""}`}>
                      <span className="text-base mt-0.5">{notificationIcon(n.type)}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-zinc-800 dark:text-white/80">{n.title}</span>
                          {n.unread && <span className="size-1.5 rounded-full bg-indigo-500 shrink-0 dark:bg-indigo-400" />}
                        </div>
                        <div className="text-xs text-zinc-400 dark:text-white/30">{n.desc}</div>
                        <div className="text-[10px] text-zinc-300 dark:text-white/20 mt-0.5">{n.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <button className="mt-1 w-full rounded-lg py-2 text-xs text-zinc-400 hover:text-zinc-600 transition-colors dark:text-white/40 dark:hover:text-white/60">{t.view_all}</button>
              </div>
            )}
          </div>

          {/* Avatar */}
          <div className="relative" ref={userRef}>
            <button
              onClick={() => { setUserMenuOpen(!userMenuOpen); setNotifOpen(false); }}
              className="flex size-9 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-xs font-bold text-white cursor-pointer ring-2 ring-transparent transition-all hover:ring-indigo-500/30"
            >
              JD
            </button>
            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 rounded-xl border border-zinc-200 bg-white/95 p-1.5 shadow-lg backdrop-blur-2xl dark:border-white/[0.08] dark:bg-[#0c0c14]/95 dark:shadow-black/50">
                <Link href="/dashboard/profile" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-white/70 dark:hover:bg-white/[0.06] dark:hover:text-white">
                  <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                  </svg>
                  {t.nav_profile}
                </Link>
                <Link href="/dashboard/settings" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-white/70 dark:hover:bg-white/[0.06] dark:hover:text-white">
                  <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  </svg>
                  {t.nav_settings}
                </Link>
                <hr className="my-1 border-zinc-200 dark:border-white/[0.06]" />
                  <Link href="/login" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-red-500 transition-colors hover:bg-red-50 dark:text-red-400/70 dark:hover:bg-red-500/[0.08] dark:hover:text-red-400">
                  <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
                  </svg>
                  {t.sign_out}
                </Link>
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
