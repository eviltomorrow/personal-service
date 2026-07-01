"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, Mail, Lock, Sparkles, Shield, Zap, Feather, UserPlus, X } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [passwordMismatch, setPasswordMismatch] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const empty: string[] = [];
    if (!email) empty.push("email");
    if (!password) empty.push("password");
    if (!confirmPassword) empty.push("confirmPassword");
    setMissingFields(empty);
    if (empty.length > 0) return;

    if (password !== confirmPassword) {
      setPasswordMismatch(true);
      return;
    }
    setPasswordMismatch(false);

    setLoading(true);
    try {
      const res = await fetch("/api/v1/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ auth_type: "email", identifier: email, password }),
      });
      const json = await res.json();
      if (json.code !== 0) {
        setToast(json.message || "注册失败");
        return;
      }
      router.push("/dashboard");
    } catch {
      setToast("网络错误，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-slate-50 via-white to-slate-50/50 p-3 sm:p-4">
      {/* Decorative blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-48 -right-48 w-[36rem] h-[36rem] rounded-full bg-slate-100/50 blur-3xl" />
        <div className="absolute -bottom-48 -left-48 w-[36rem] h-[36rem] rounded-full bg-slate-100/30 blur-3xl" />
      </div>

      <div className="relative w-full max-w-5xl anim-in anim-fade anim-up-lg" style={{ animationDuration: "700ms" }}>
        <div className="grid grid-cols-1 lg:grid-cols-5 rounded-xl sm:rounded-2xl shadow-xl shadow-slate-500/5 overflow-hidden border border-gray-200">
          {/* Brand panel */}
          <div className="lg:col-span-2 relative bg-gradient-to-br from-slate-600 via-slate-700 to-slate-800 p-6 sm:p-8 lg:p-10 flex flex-col gap-6 sm:gap-8 lg:gap-0 lg:justify-between">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNiI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />
            <div className="absolute top-0 right-0 w-32 sm:w-48 h-32 sm:h-48 bg-white/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-24 sm:w-32 h-24 sm:h-32 bg-white/5 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />

            <div className="shrink-0">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm ring-1 ring-white/20">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <span className="text-lg font-semibold text-white">Nicell.me</span>
              </div>

              <div className="mt-6 sm:mt-8 lg:mt-10">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-white leading-tight">
                  欢迎来到你的<br />个人中心
                </h1>
                <p className="mt-2 sm:mt-3 text-sm text-slate-200/80 leading-relaxed max-w-xs">
                  安全、快速、直观 — 轻松管理您的账户和资料。
                </p>
              </div>
            </div>

            <div className="flex flex-row lg:flex-col gap-4 lg:gap-3 flex-wrap">
              {[
                { icon: Shield, label: "企业级安全" },
                { icon: Zap, label: "极速访问" },
                { icon: Feather, label: "简单直观" },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-3 text-sm text-slate-200/60">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 ring-1 ring-white/15">
                    <Icon className="h-3.5 w-3.5 text-white/70" />
                  </div>
                  {label}
                </div>
              ))}
            </div>
          </div>

          {/* Form panel */}
          <div className="lg:col-span-3 bg-white px-6 py-8 sm:px-10 sm:py-10 lg:px-12 lg:py-12 flex flex-col justify-center">
            <div>
              <div className="mx-auto lg:mx-0 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-slate-500 to-slate-700 shadow-lg shadow-slate-500/20">
                <UserPlus className="h-5 w-5 text-white" />
              </div>
              <h2 className="mt-5 text-xl font-semibold tracking-tight text-gray-900">
                注册
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                创建您的账户以开始使用。
              </p>
            </div>

            {toast && (
              <div className="mt-5 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 anim-in anim-fade anim-down">
                <span className="flex-1">{toast}</span>
                <button type="button" onClick={() => setToast(null)}
                  className="text-red-400 hover:text-red-600 transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-7 space-y-4" noValidate>
              <div className="group">
                <div className="flex items-center justify-between">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                    邮箱
                  </label>
                  {missingFields.includes("email") && (
                    <span className="text-xs text-red-500 mb-1.5">必填</span>
                  )}
                </div>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                    <Mail className={`h-4 w-4 transition-colors ${missingFields.includes("email") ? "text-red-400" : "text-gray-400"}`} />
                  </div>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setMissingFields((p) => p.filter((f) => f !== "email")); }}
                    placeholder="you@example.com"
                    className={`block w-full rounded-lg border bg-white py-2.5 pl-10 pr-3.5 text-sm text-gray-900 placeholder-gray-400 shadow-xs focus:outline-none transition-all ${
                      missingFields.includes("email")
                        ? "border-red-300 ring-2 ring-red-200/50"
                        : "border-gray-200 focus:border-slate-400 focus:ring-2 focus:ring-slate-200/60"
                    }`}
                  />
                </div>
              </div>

              <div className="group">
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                    密码
                  </label>
                  {missingFields.includes("password") && (
                    <span className="text-xs text-red-500 mb-1.5">必填</span>
                  )}
                </div>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                    <Lock className={`h-4 w-4 transition-colors ${missingFields.includes("password") ? "text-red-400" : "text-gray-400"}`} />
                  </div>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setMissingFields((p) => p.filter((f) => f !== "password")); setPasswordMismatch(false); }}
                    placeholder="请设置密码"
                    className={`block w-full rounded-lg border bg-white py-2.5 pl-10 pr-10 text-sm text-gray-900 placeholder-gray-400 shadow-xs focus:outline-none transition-all ${
                      missingFields.includes("password")
                        ? "border-red-300 ring-2 ring-red-200/50"
                        : "border-gray-200 focus:border-slate-400 focus:ring-2 focus:ring-slate-200/60"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-gray-400 hover:text-gray-600 transition-all active:scale-95"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="group">
                <div className="flex items-center justify-between">
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1.5">
                    确认密码
                  </label>
                  {missingFields.includes("confirmPassword") && (
                    <span className="text-xs text-red-500 mb-1.5">必填</span>
                  )}
                </div>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                    <Lock className={`h-4 w-4 transition-colors ${missingFields.includes("confirmPassword") || passwordMismatch ? "text-red-400" : "text-gray-400"}`} />
                  </div>
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => { setConfirmPassword(e.target.value); setMissingFields((p) => p.filter((f) => f !== "confirmPassword")); setPasswordMismatch(false); }}
                    placeholder="请再次输入密码"
                    className={`block w-full rounded-lg border bg-white py-2.5 pl-10 pr-10 text-sm text-gray-900 placeholder-gray-400 shadow-xs focus:outline-none transition-all ${
                      missingFields.includes("confirmPassword") || passwordMismatch
                        ? "border-red-300 ring-2 ring-red-200/50"
                        : "border-gray-200 focus:border-slate-400 focus:ring-2 focus:ring-slate-200/60"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-gray-400 hover:text-gray-600 transition-all active:scale-95"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {passwordMismatch && (
                  <p className="mt-1.5 text-xs text-red-500">密码不一致</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="relative flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-slate-600 to-slate-700 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-slate-500/20 hover:shadow-xl hover:shadow-slate-500/30 hover:from-slate-700 hover:to-slate-800 focus:ring-2 focus:ring-slate-400/30 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60 transition-all active:scale-[0.98] overflow-hidden group"
              >
                <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors" />
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    注册中...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4" />
                    注册
                  </>
                )}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-gray-500">
              已有账户？{" "}
              <button
                type="button"
                onClick={() => router.push("/login")}
                className="font-medium text-slate-600 hover:text-slate-500 transition-colors active:scale-95 inline-block cursor-pointer hover:underline hover:underline-offset-2"
              >
                去登录
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
