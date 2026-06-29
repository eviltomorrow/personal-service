"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, LogIn, Mail, Lock, Sparkles, Shield, Zap, Feather } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [missingFields, setMissingFields] = useState<string[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const empty: string[] = [];
    if (!email) empty.push("email");
    if (!password) empty.push("password");
    setMissingFields(empty);
    if (empty.length > 0) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1200));
    setLoading(false);
    router.push("/dashboard");
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-indigo-50/50 p-3 sm:p-4">
      {/* Decorative blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-48 -right-48 w-[36rem] h-[36rem] rounded-full bg-indigo-100/50 blur-3xl" />
        <div className="absolute -bottom-48 -left-48 w-[36rem] h-[36rem] rounded-full bg-indigo-100/30 blur-3xl" />
      </div>

      <div className="relative w-full max-w-5xl anim-in anim-fade anim-up-lg" style={{ animationDuration: "700ms" }}>
        <div className="grid grid-cols-1 lg:grid-cols-5 rounded-xl sm:rounded-2xl shadow-xl shadow-indigo-500/5 overflow-hidden border border-gray-200">
          {/* Brand panel */}
          <div className="lg:col-span-2 relative bg-gradient-to-br from-indigo-600 via-indigo-700 to-indigo-800 p-6 sm:p-8 lg:p-10 flex flex-col gap-6 sm:gap-8 lg:gap-0 lg:justify-between">
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
                <p className="mt-2 sm:mt-3 text-sm text-indigo-200/80 leading-relaxed max-w-xs">
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
                <div key={label} className="flex items-center gap-3 text-sm text-indigo-200/60">
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
              <div className="mx-auto lg:mx-0 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 shadow-lg shadow-indigo-500/20">
                <LogIn className="h-5 w-5 text-white" />
              </div>
              <h2 className="mt-5 text-xl font-semibold tracking-tight text-gray-900">
                登录
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                请输入您的凭据以访问账户。
              </p>
            </div>

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
                        : "border-gray-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200/60"
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
                    onChange={(e) => { setPassword(e.target.value); setMissingFields((p) => p.filter((f) => f !== "password")); }}
                    placeholder="请输入密码"
                    className={`block w-full rounded-lg border bg-white py-2.5 pl-10 pr-10 text-sm text-gray-900 placeholder-gray-400 shadow-xs focus:outline-none transition-all ${
                      missingFields.includes("password")
                        ? "border-red-300 ring-2 ring-red-200/50"
                        : "border-gray-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200/60"
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

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer transition-all"
                  />
                  <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">记住我</span>
                </label>
                <button
                  type="button"
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-500 transition-colors active:scale-95"
                >
                  忘记密码？
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="relative flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-indigo-700 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 hover:shadow-xl hover:shadow-indigo-500/30 hover:from-indigo-700 hover:to-indigo-800 focus:ring-2 focus:ring-indigo-400/30 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60 transition-all active:scale-[0.98] overflow-hidden group"
              >
                <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors" />
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    登录中...
                  </>
                ) : (
                  <>
                    <LogIn className="h-4 w-4" />
                    登录
                  </>
                )}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-gray-500">
              还没有账户？{" "}
              <button type="button" className="font-medium text-indigo-600 hover:text-indigo-500 transition-colors active:scale-95 inline-block">
                注册
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
