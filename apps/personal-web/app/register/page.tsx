"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "@/app/_components/theme-provider";

export default function RegisterPage() {
  const router = useRouter();
  const { theme, toggle } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    router.push("/dashboard");
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 bg-zinc-50 dark:bg-[#07070b]">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.08),transparent_60%),radial-gradient(ellipse_at_bottom,rgba(168,85,247,0.04),transparent_60%)] dark:bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.15),transparent_60%),radial-gradient(ellipse_at_center,rgba(139,92,246,0.06),transparent_50%),radial-gradient(ellipse_at_bottom,rgba(236,72,153,0.05),transparent_50%)]" />
      <div className="pointer-events-none fixed left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2 size-[800px] rounded-full bg-indigo-500/[0.03] blur-3xl dark:bg-indigo-500/5" />

      <button onClick={toggle} className="fixed top-5 right-5 z-20 flex size-9 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white/40 dark:hover:bg-white/[0.06] dark:hover:text-white/70">
        {theme === "dark" ? (
          <svg className="size-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
          </svg>
        ) : (
          <svg className="size-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
          </svg>
        )}
      </button>

      <div className="animate-fade-in relative z-10 w-full max-w-sm">
        <div className="pointer-events-none absolute -inset-6 rounded-3xl bg-gradient-to-b from-indigo-500/5 via-transparent to-transparent opacity-60 blur-2xl dark:from-indigo-500/10" />

        <div className="relative rounded-2xl border border-zinc-200 bg-white/80 p-8 shadow-lg backdrop-blur-2xl dark:border-white/[0.06] dark:bg-white/[0.03] dark:shadow-2xl dark:shadow-indigo-500/5">
          <div className="pointer-events-none absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-indigo-400/20 to-transparent dark:via-indigo-400/30" />
          <div className="pointer-events-none absolute -inset-1 rounded-2xl bg-gradient-to-b from-indigo-500/5 via-transparent to-transparent opacity-40 blur-sm dark:from-indigo-500/10" />

          <div className="relative">
            <div className="mb-8 flex items-center gap-3">
              <div className="relative flex size-9 items-center justify-center rounded-xl bg-zinc-900 text-white ring-1 ring-zinc-800 dark:bg-white/[0.08] dark:ring-white/[0.06]">
                <svg className="relative size-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <div className="text-sm font-medium tracking-wide text-zinc-800 dark:text-white/80">PERSONAL</div>
                <div className="text-[11px] text-zinc-400 dark:text-white/25">platform v7.0</div>
              </div>
            </div>

            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-white">Create account</h1>
            <p className="mt-1.5 text-sm text-zinc-400 dark:text-white/35">Get started with your account</p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <div>
                <label htmlFor="email" className="mb-1.5 block text-xs font-medium tracking-wide text-zinc-500 uppercase dark:text-white/45">Email</label>
                <input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required
                  className="block w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 outline-none transition-colors focus:border-indigo-400 focus:ring-1 focus:ring-indigo-200 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white dark:placeholder-white/20 dark:focus:border-indigo-500/40 dark:focus:bg-white/[0.06]" />
              </div>
              <div>
                <label htmlFor="password" className="mb-1.5 block text-xs font-medium tracking-wide text-zinc-500 uppercase dark:text-white/45">Password</label>
                <input id="password" type="password" placeholder="Create a password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6}
                  className="block w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 outline-none transition-colors focus:border-indigo-400 focus:ring-1 focus:ring-indigo-200 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white dark:placeholder-white/20 dark:focus:border-indigo-500/40 dark:focus:bg-white/[0.06]" />
              </div>
              <div>
                <label htmlFor="confirm" className="mb-1.5 block text-xs font-medium tracking-wide text-zinc-500 uppercase dark:text-white/45">Confirm password</label>
                <input id="confirm" type="password" placeholder="Repeat your password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required
                  className="block w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 outline-none transition-colors focus:border-indigo-400 focus:ring-1 focus:ring-indigo-200 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white dark:placeholder-white/20 dark:focus:border-indigo-500/40 dark:focus:bg-white/[0.06]" />
              </div>
              <button type="submit" className="relative w-full overflow-hidden rounded-xl bg-zinc-900 py-2.5 text-sm font-semibold text-white transition-all hover:bg-zinc-800 active:scale-[0.98] dark:bg-white dark:text-zinc-900 dark:hover:bg-white/90">Create account</button>
            </form>

            <p className="mt-6 text-center text-sm text-zinc-500 dark:text-white/30">
              Already have an account?{" "}
              <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
