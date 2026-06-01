"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    router.push("/dashboard");
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.12),transparent_60%),radial-gradient(ellipse_at_bottom,rgba(168,85,247,0.08),transparent_60%)]" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 size-[600px] rounded-full border border-white/[0.03] bg-white/[0.02] blur-3xl" />

      {/* Grid overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.1) 1px,transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* Card */}
      <div className="animate-fade-in relative w-full max-w-sm rounded-2xl border border-white/[0.06] bg-white/[0.04] p-8 backdrop-blur-xl">
        {/* Glow */}
        <div className="pointer-events-none absolute -inset-1 rounded-2xl bg-gradient-to-b from-indigo-500/20 via-transparent to-transparent opacity-50 blur-sm" />

        <div className="relative">
          {/* Logo */}
          <div className="mb-8 flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-lg bg-white/10">
              <svg className="size-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="text-sm font-medium tracking-wide text-white/60">PERSONAL</span>
          </div>

          <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
          <p className="mt-1.5 text-sm text-white/40">Sign in to your account</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label htmlFor="email" className="mb-1.5 block text-xs font-medium tracking-wide text-white/50 uppercase">
                Email
              </label>
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="block w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder-white/25 outline-none transition-colors focus:border-indigo-500/50 focus:bg-white/[0.06]"
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 block text-xs font-medium tracking-wide text-white/50 uppercase">
                Password
              </label>
              <input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="block w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder-white/25 outline-none transition-colors focus:border-indigo-500/50 focus:bg-white/[0.06]"
              />
            </div>

            <button
              type="submit"
              className="relative w-full overflow-hidden rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-zinc-900 transition-all hover:bg-white/90 active:scale-[0.98]"
            >
              Sign in
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-white/30">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="font-medium text-indigo-400 transition-colors hover:text-indigo-300">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
