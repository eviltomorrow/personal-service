"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Settings,
  Shield,
  Bell,
  Search,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Activity,
  BarChart3,
  FileText,
  HelpCircle,
  Sparkles,
  User,
  CreditCard,
  LogIn,
  Clock,
  ShoppingCart,
  MessageCircle,
} from "lucide-react";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
  { label: "Users", href: "/dashboard/users", icon: Users },
  { label: "Activity", href: "/dashboard/activity", icon: Activity },
  { label: "Reports", href: "/dashboard/reports", icon: FileText },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

const bottomNavItems = [
  { label: "Help Center", href: "/dashboard/help", icon: HelpCircle },
  { label: "Security", href: "/dashboard/security", icon: Shield },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setUserMenuOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const notifications = [
    { icon: ShoppingCart, text: "Order #3821 completed", time: "2 min ago", color: "text-emerald-400" },
    { icon: User, text: "New user Emma registered", time: "15 min ago", color: "text-indigo-400" },
    { icon: MessageCircle, text: "New support ticket opened", time: "1 hour ago", color: "text-amber-400" },
    { icon: Clock, text: "Session timeout warning", time: "2 hours ago", color: "text-red-400" },
  ];

  const userMenuItems = [
    { label: "Profile", icon: User, href: "/dashboard/settings" },
    { label: "Billing", icon: CreditCard, href: "/dashboard/settings" },
    { label: "Sign out", icon: LogIn, href: "/login", danger: true },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-gray-950 via-slate-900 to-gray-950">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-gradient-to-b from-slate-800 to-gray-900 transition-transform duration-300 lg:static lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Decorative glow */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/8 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />

        {/* Sidebar header */}
        <div className="relative flex h-16 items-center justify-between px-6 border-b border-white/5">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 backdrop-blur-sm ring-1 ring-white/20">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <span className="text-base font-semibold text-white">
              Personal
            </span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden rounded-lg p-1.5 text-white/50 hover:bg-white/10 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="relative flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const isActive =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                  isActive
                    ? "bg-white/10 text-white shadow-xs ring-1 ring-white/10"
                    : "text-white/50 hover:bg-white/5 hover:text-white/80"
                }`}
              >
                <item.icon
                  className={`h-5 w-5 shrink-0 ${
                    isActive ? "text-white" : "text-white/40"
                  }`}
                />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Bottom nav */}
        <div className="relative px-3 pb-3 border-t border-white/5 pt-3 space-y-1">
          {bottomNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/50 hover:bg-white/5 hover:text-white/80 transition-colors"
            >
              <item.icon className="h-5 w-5 shrink-0 text-white/40" />
              {item.label}
            </Link>
          ))}
        </div>
      </aside>

      {/* Main area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top header */}
        <header className="flex h-16 shrink-0 items-center gap-4 border-b border-white/5 bg-white/5 backdrop-blur-xl px-4 lg:px-6">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden rounded-lg p-1.5 text-white/50 hover:bg-white/10 hover:text-white transition-colors"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
            <input
              type="text"
              placeholder="Search..."
              className="block w-full rounded-lg border border-white/10 bg-white/5 py-2 pl-10 pr-3.5 text-sm text-white/80 placeholder-white/30 focus:border-indigo-400/50 focus:ring-2 focus:ring-indigo-400/15 focus:outline-none focus:bg-white/10 transition-colors"
            />
          </div>

          <div className="flex items-center gap-2 ml-auto">
            {/* Notification dropdown */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => { setNotifOpen(!notifOpen); setUserMenuOpen(false); }}
                className="relative rounded-lg p-2 text-white/50 hover:bg-white/10 hover:text-white transition-colors"
              >
                <Bell className="h-5 w-5" />
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-400 ring-2 ring-slate-800" />
              </button>

              {notifOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 rounded-xl border border-white/10 bg-slate-800/95 backdrop-blur-xl shadow-2xl shadow-black/30 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="px-4 py-3 border-b border-white/5">
                    <p className="text-sm font-semibold text-white">Notifications</p>
                  </div>
                  <div className="max-h-72 overflow-y-auto">
                    {notifications.map((n, i) => (
                      <button
                        key={i}
                        className="flex items-start gap-3 w-full px-4 py-3 hover:bg-white/5 transition-colors text-left border-b border-white/5 last:border-b-0"
                      >
                        <div className="rounded-lg bg-white/10 p-1.5 shrink-0 mt-0.5">
                          <n.icon className={`h-4 w-4 ${n.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white/80">{n.text}</p>
                          <p className="text-xs text-white/40 mt-0.5">{n.time}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* User menu dropdown */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => { setUserMenuOpen(!userMenuOpen); setNotifOpen(false); }}
                className="flex items-center gap-2 pl-2 border-l border-white/10 cursor-pointer group"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 text-xs font-semibold text-white shadow-xs group-hover:shadow-indigo-500/30 transition-shadow">
                  JD
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium text-white/80 leading-tight group-hover:text-white transition-colors">
                    John Doe
                  </p>
                  <p className="text-xs text-white/40">Admin</p>
                </div>
                <ChevronDown className={`h-4 w-4 text-white/40 transition-transform ${userMenuOpen ? "rotate-180" : ""}`} />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 rounded-xl border border-white/10 bg-slate-800/95 backdrop-blur-xl shadow-2xl shadow-black/30 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                  {userMenuItems.map((item) => (
                    <Link
                      key={item.label}
                      href={item.href}
                      onClick={() => setUserMenuOpen(false)}
                      className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                        item.danger
                          ? "text-red-400 hover:bg-red-500/10"
                          : "text-white/70 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {item.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
