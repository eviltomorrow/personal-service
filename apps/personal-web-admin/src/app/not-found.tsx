"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, Home, Search, Sparkles } from "lucide-react";

export default function NotFoundPage() {
  const router = useRouter();

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-slate-50 via-white to-slate-50/50 p-3 sm:p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-48 -right-48 w-[36rem] h-[36rem] rounded-full bg-slate-100/50 blur-3xl" />
        <div className="absolute -bottom-48 -left-48 w-[36rem] h-[36rem] rounded-full bg-slate-100/30 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md anim-in anim-fade anim-up-lg" style={{ animationDuration: "700ms" }}>
        <div className="rounded-xl sm:rounded-2xl shadow-xl shadow-slate-500/5 overflow-hidden border border-gray-200 bg-white">
          <div className="relative bg-gradient-to-br from-slate-600 via-slate-700 to-slate-800 p-6 sm:p-8 text-center">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNiI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />
            <div className="absolute top-0 right-0 w-32 sm:w-48 h-32 sm:h-48 bg-white/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-24 sm:w-32 h-24 sm:h-32 bg-white/5 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />

            <div className="relative">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm ring-1 ring-white/20 mb-5">
                <Sparkles className="h-7 w-7 text-white" />
              </div>
              <h1 className="text-7xl sm:text-8xl font-bold tracking-tight text-white leading-none">404</h1>
              <p className="mt-3 text-base sm:text-lg text-slate-200/80">页面未找到</p>
            </div>
          </div>

          <div className="px-6 py-8 sm:px-8 sm:py-10 text-center">
            <p className="text-sm text-gray-500 leading-relaxed">
              您访问的页面不存在，可能已被移除或地址输入有误。
            </p>

            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => router.back()}
                className="flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all active:scale-[0.98] flex-1"
              >
                <ArrowLeft className="h-4 w-4" />
                返回上页
              </button>
              <button
                onClick={() => router.push("/dashboard")}
                className="flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-slate-600 to-slate-700 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-slate-500/20 hover:shadow-xl hover:shadow-slate-500/30 hover:from-slate-700 hover:to-slate-800 focus:ring-2 focus:ring-slate-400/30 focus:outline-none transition-all active:scale-[0.98] flex-1"
              >
                <Home className="h-4 w-4" />
                回到首页
              </button>
            </div>

            <button
              onClick={() => router.push("/dashboard/help")}
              className="mt-4 inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-slate-600 transition-colors"
            >
              <Search className="h-3.5 w-3.5" />
              前往帮助中心
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
