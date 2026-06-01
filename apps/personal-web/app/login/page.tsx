"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale } from "@/app/_components/locale-provider";

export default function LoginPage() {
  const router = useRouter();
  const { t, locale, setLocale } = useLocale();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    router.push("/dashboard");
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-zinc-50 px-4 dark:bg-[#07070b]">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.1),transparent_60%),radial-gradient(ellipse_at_bottom,rgba(168,85,247,0.05),transparent_60%)] dark:bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.15),transparent_60%),radial-gradient(ellipse_at_center,rgba(139,92,246,0.06),transparent_50%)]" />
      <div className="pointer-events-none fixed left-1/2 top-1/3 size-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-500/[0.03] blur-3xl dark:bg-indigo-500/[0.06]" />
      <div className="pointer-events-none fixed inset-0 opacity-[0.015] dark:opacity-[0.02]" style={{
        backgroundImage: "linear-gradient(rgba(0,0,0,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(0,0,0,0.04) 1px,transparent 1px)",
        backgroundSize: "48px 48px",
      }} />

      {/* Lang toggle */}
      <button onClick={() => setLocale(locale === "en" ? "zh" : "en")}
        className="fixed top-5 right-5 z-20 flex size-9 items-center justify-center rounded-xl border border-zinc-200 bg-white text-xs font-medium text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white/40 dark:hover:bg-white/[0.06] dark:hover:text-white/70">
        {locale === "en" ? "中" : "EN"}
      </button>

      <div className="relative z-10 w-full max-w-sm">
        <div className="relative rounded-2xl border border-zinc-200 bg-white/80 p-8 shadow-lg backdrop-blur-2xl dark:border-white/[0.06] dark:bg-white/[0.03] dark:shadow-2xl dark:shadow-indigo-500/5">
          <div className="pointer-events-none absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-indigo-400/20 to-transparent dark:via-indigo-400/40" />
          <div className="pointer-events-none absolute -inset-1 rounded-2xl bg-gradient-to-b from-indigo-500/5 via-transparent to-transparent opacity-40 blur-sm dark:from-indigo-500/10" />

          <div className="relative">
            <div className="mb-8 flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-zinc-900 text-white dark:bg-white/[0.08]">
                <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="text-sm font-medium tracking-wider text-zinc-800 dark:text-white/70">{t.brand}</span>
            </div>

            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-white">{t.login_title}</h1>
            <p className="mt-1.5 text-sm text-zinc-500 dark:text-white/35">{t.login_subtitle}</p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <div>
                <label htmlFor="email" className="mb-1.5 block text-xs font-medium text-zinc-500 dark:text-white/45">{t.email_label}</label>
                <input id="email" type="email" placeholder={t.email_placeholder} value={email} onChange={(e) => setEmail(e.target.value)} required
                  className="block w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 outline-none transition-colors focus:border-indigo-400 focus:ring-1 focus:ring-indigo-200 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white dark:placeholder-white/20 dark:focus:border-indigo-500/40 dark:focus:bg-white/[0.06]" />
              </div>
              <div>
                <label htmlFor="password" className="mb-1.5 block text-xs font-medium text-zinc-500 dark:text-white/45">{t.password_label}</label>
                <input id="password" type="password" placeholder={t.password_placeholder} value={password} onChange={(e) => setPassword(e.target.value)} required
                  className="block w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 outline-none transition-colors focus:border-indigo-400 focus:ring-1 focus:ring-indigo-200 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white dark:placeholder-white/20 dark:focus:border-indigo-500/40 dark:focus:bg-white/[0.06]" />
              </div>
              <button type="submit" className="w-full rounded-xl bg-zinc-900 py-2.5 text-sm font-semibold text-white transition-all hover:bg-zinc-800 active:scale-[0.98] dark:bg-white dark:text-zinc-900 dark:hover:bg-white/90">
                {t.sign_in}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-zinc-500 dark:text-white/30">
              {t.no_account}{" "}
              <Link href="/register" className="font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300">{t.create_one}</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
