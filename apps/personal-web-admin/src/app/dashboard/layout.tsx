"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { redirectToLogin } from "@/lib/auth";
import {
  LayoutDashboard, Settings, Shield, Bell, Search, Menu, X, ChevronDown,
  HelpCircle, Sparkles, User, LogOut,
  Clock, ShoppingCart, MessageCircle, BookOpen,
  Wallet, TrendingUp,
} from "lucide-react";

const navItems = [
  { label: "仪表盘", href: "/dashboard", icon: LayoutDashboard },
  { label: "资产负债表", href: "/dashboard/balance-sheet", icon: BookOpen },
  { label: "投资组合", href: "/dashboard/portfolio", icon: TrendingUp },
  { label: "收入与支出", href: "/dashboard/cash-flow", icon: Wallet },
  { label: "系统设置", href: "/dashboard/settings", icon: Settings },
];

const bottomNavItems = [
  { label: "帮助中心", href: "/dashboard/help", icon: HelpCircle },
  { label: "安全设置", href: "/dashboard/security", icon: Shield },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [profile, setProfile] = useState({ nickname: "管理员", avatarDataUrl: "" });
  const notifRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function checkAuth() {
      const tryValidate = async (): Promise<boolean> => {
        try {
          const res = await fetch("/api/v1/auth/token/validate", { method: "POST" });
          if (!res.ok) return false;
          const json = await res.json();
          return json.code === 0;
        } catch {
          return false;
        }
      };
      let ok = await tryValidate();
      if (!ok) {
        await new Promise((r) => setTimeout(r, 100));
        ok = await tryValidate();
      }
      if (!ok) { redirectToLogin(); return; }
      setAuthed(true);
    }
    checkAuth();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setUserMenuOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (authed !== true) return;
    try {
      const data = localStorage.getItem("settings-profile");
      if (data) {
        const p = JSON.parse(data);
        setProfile({ nickname: p.nickname || "管理员", avatarDataUrl: p.avatarDataUrl || "" });
      }
    } catch     { /* ignore */ }
  }, [authed]);

  if (authed !== true) return null;

  async function handleLogout() {
    await fetch("/api/v1/auth/token/revoke", { method: "POST" });
    router.push("/login");
  }

  const notifications = [
    { icon: ShoppingCart, text: "订单 #3821 已完成", time: "2分钟前", color: "text-emerald-600" },
    { icon: User, text: "新用户 Emma 已注册", time: "15分钟前", color: "text-slate-600" },
    { icon: MessageCircle, text: "新的工单已提交", time: "1小时前", color: "text-amber-600" },
    { icon: Clock, text: "会话超时警告", time: "2小时前", color: "text-red-600" },
  ];

  const userMenuItems = [
    { label: "个人信息", icon: User, href: "/dashboard/settings" },
  ];

  const initials = profile.nickname.slice(0, 1);

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-white to-slate-50/50">
      {/* Decorative blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-24 -right-24 w-[30rem] h-[30rem] rounded-full bg-slate-100/50 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-[30rem] h-[30rem] rounded-full bg-slate-100/30 blur-3xl" />
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-white/90 backdrop-blur-xl border-r border-gray-200 transition-transform duration-300 lg:static lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Sidebar header */}
        <div className="flex h-16 items-center justify-between px-6 border-b border-gray-100">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-slate-500 to-slate-700 shadow-sm shadow-slate-500/10">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <span className="text-base font-semibold text-gray-900">Nicell.me</span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
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
                    ? "bg-slate-100 text-slate-700 shadow-xs"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                <item.icon
                  className={`h-5 w-5 shrink-0 ${
                    isActive ? "text-slate-600" : "text-gray-400"
                  }`}
                />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Bottom nav */}
        <div className="px-3 pb-3 border-t border-gray-100 pt-3 space-y-1">
          {bottomNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
            >
              <item.icon className="h-5 w-5 shrink-0 text-gray-400" />
              {item.label}
            </Link>
          ))}
        </div>
      </aside>

      {/* Main area */}
      <div className="relative flex flex-1 flex-col z-10">
        {/* Top header */}
        <header className="relative z-10 flex h-16 shrink-0 items-center gap-3 border-b border-gray-200 bg-white/80 backdrop-blur-md px-4 lg:px-6">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="搜索..."
              className="block w-full rounded-lg border border-gray-200 bg-gray-50/80 py-2 pl-10 pr-3.5 text-sm text-gray-900 placeholder-gray-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-200/60 focus:outline-none focus:bg-white transition-all"
            />
          </div>

          <div className="flex items-center gap-1 ml-auto">
            {/* Notification dropdown */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => { setNotifOpen(!notifOpen); setUserMenuOpen(false); }}
                className="relative rounded-lg p-2 text-gray-400 hover:bg-slate-100 hover:text-slate-600 transition-all active:scale-95"
              >
                <Bell className="h-5 w-5" />
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
              </button>

              {notifOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 rounded-xl border border-gray-200 bg-white shadow-xl overflow-hidden z-[60] anim-in anim-fade anim-down" style={{ animationDuration: "200ms" }}>
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-sm font-semibold text-gray-900">通知</p>
                  </div>
                  <div className="max-h-72 overflow-y-auto">
                    {notifications.map((n, i) => (
                      <button
                        key={i}
                        className="flex items-start gap-3 w-full px-4 py-3 hover:bg-gray-50 transition-colors text-left border-b border-gray-100 last:border-b-0"
                      >
                        <div className="rounded-lg bg-gray-100 p-1.5 shrink-0 mt-0.5">
                          <n.icon className={`h-4 w-4 ${n.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-900">{n.text}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{n.time}</p>
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
                className="flex items-center gap-2 pl-2 border-l border-gray-200 cursor-pointer group"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full overflow-hidden bg-gradient-to-br from-slate-400 to-slate-600 text-xs font-semibold text-white shadow-xs shadow-slate-400/20 shrink-0">
                  {profile.avatarDataUrl ? (
                    <img src={profile.avatarDataUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    initials
                  )}
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium text-gray-700 leading-tight group-hover:text-gray-900 transition-colors">
                    {profile.nickname}
                  </p>
                  <p className="text-xs text-gray-500">管理员</p>
                </div>
                <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${userMenuOpen ? "rotate-180" : ""}`} />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-44 rounded-xl border border-gray-200 bg-white shadow-xl overflow-hidden z-[60] anim-in anim-fade anim-down" style={{ animationDuration: "200ms" }}>
                  {userMenuItems.map((item) => (
                    <Link
                      key={item.label}
                      href={item.href}
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-slate-50 hover:text-gray-900 transition-colors"
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {item.label}
                    </Link>
                  ))}
                  <div className="border-t border-gray-100">
                    <button
                      onClick={() => { setUserMenuOpen(false); handleLogout(); }}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="h-4 w-4 shrink-0" />
                      退出登录
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="relative flex-1 overflow-y-auto p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
