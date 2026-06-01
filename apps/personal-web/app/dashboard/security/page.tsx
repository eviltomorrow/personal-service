export default function SecurityPage() {
  return (
    <>
      <div className="mb-8">
        <h1 className="text-xl font-semibold tracking-tight">Security</h1>
        <p className="mt-1 text-sm text-white/35">Manage your password and account security.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Password */}
        <div className="animate-fade-in rounded-xl border border-white/[0.06] bg-white/[0.03] p-6 backdrop-blur-xl">
          <h2 className="text-sm font-medium text-white/80 mb-5">Change password</h2>
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium tracking-wide text-white/45 uppercase">Current password</label>
              <input type="password" placeholder="Enter current password" className="block w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder-white/20 outline-none transition-colors focus:border-indigo-500/40 focus:bg-white/[0.06]" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium tracking-wide text-white/45 uppercase">New password</label>
              <input type="password" placeholder="Enter new password" className="block w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder-white/20 outline-none transition-colors focus:border-indigo-500/40 focus:bg-white/[0.06]" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium tracking-wide text-white/45 uppercase">Confirm new password</label>
              <input type="password" placeholder="Repeat new password" className="block w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder-white/20 outline-none transition-colors focus:border-indigo-500/40 focus:bg-white/[0.06]" />
            </div>
            {/* Strength indicator */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-white/45">Password strength</span>
                <span className="text-emerald-400 font-medium">Strong</span>
              </div>
              <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                <div className="h-full w-3/4 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400" />
              </div>
            </div>
            <button className="rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-zinc-900 transition-all hover:bg-white/90 w-full">Update password</button>
          </div>
        </div>

        {/* Two-factor */}
        <div className="animate-fade-in-delayed rounded-xl border border-white/[0.06] bg-white/[0.03] p-6 backdrop-blur-xl">
          <h2 className="text-sm font-medium text-white/80 mb-5">Two-factor authentication</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-3">
              <div>
                <div className="text-sm text-white/70">Authenticator app</div>
                <div className="text-xs text-white/30">Use an app like Google Authenticator or Authy.</div>
              </div>
              <button className="rounded-lg border border-white/[0.08] px-3 py-1.5 text-xs text-white/50 transition-colors hover:bg-white/[0.04] hover:text-white/70">Setup</button>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-3">
              <div>
                <div className="text-sm text-white/70">SMS codes</div>
                <div className="text-xs text-white/30">Receive verification codes via text message.</div>
              </div>
              <span className="rounded-md bg-white/[0.04] px-2 py-0.5 text-[10px] text-white/25 uppercase font-medium">Coming soon</span>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-3">
              <div>
                <div className="text-sm text-white/70">Recovery codes</div>
                <div className="text-xs text-white/30">Generate backup codes for account recovery.</div>
              </div>
              <button className="rounded-lg border border-white/[0.08] px-3 py-1.5 text-xs text-white/50 transition-colors hover:bg-white/[0.04] hover:text-white/70">Generate</button>
            </div>
          </div>
        </div>

        {/* Active sessions */}
        <div className="animate-fade-in-slow rounded-xl border border-white/[0.06] bg-white/[0.03] p-6 backdrop-blur-xl lg:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-medium text-white/80">Active sessions</h2>
            <button className="text-xs text-red-400/70 hover:text-red-400 transition-colors">Revoke all</button>
          </div>
          <div className="space-y-3">
            {[
              { device: "Chrome on macOS", ip: "203.0.113.42", location: "San Francisco, US", current: true, time: "Active now" },
              { device: "Safari on iPhone", ip: "198.51.100.7", location: "San Francisco, US", current: false, time: "2 hours ago" },
              { device: "Firefox on Windows", ip: "192.0.2.15", location: "New York, US", current: false, time: "3 days ago" },
            ].map((s) => (
              <div key={s.device} className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex size-9 items-center justify-center rounded-lg bg-white/[0.06] text-white/40">
                    <svg className="size-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
                    </svg>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-white/80">{s.device}</span>
                      {s.current && <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400">Current</span>}
                    </div>
                    <div className="text-xs text-white/30">{s.ip} · {s.location} · {s.time}</div>
                  </div>
                </div>
                {!s.current && (
                  <button className="rounded-lg border border-white/[0.08] px-3 py-1.5 text-xs text-white/40 transition-colors hover:bg-white/[0.04] hover:text-red-400">Revoke</button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
