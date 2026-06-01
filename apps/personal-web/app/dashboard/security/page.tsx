export default function SecurityPage() {
  return (
    <>
      <div className="mb-8">
        <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-white">Security</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-white/35">Manage your password and account security.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="animate-fade-in rounded-xl border border-zinc-200 bg-white p-6 dark:border-white/[0.06] dark:bg-white/[0.03] dark:backdrop-blur-xl">
          <h2 className="text-sm font-medium text-zinc-800 mb-5 dark:text-white/80">Change password</h2>
          <div className="space-y-4">
            {[
              { label: "Current password", placeholder: "Enter current password" },
              { label: "New password", placeholder: "Enter new password" },
              { label: "Confirm new password", placeholder: "Repeat new password" },
            ].map((f) => (
              <div key={f.label}>
                <label className="mb-1.5 block text-xs font-medium tracking-wide text-zinc-500 uppercase dark:text-white/45">{f.label}</label>
                <input type="password" placeholder={f.placeholder} className="block w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 outline-none transition-colors focus:border-indigo-400 focus:ring-1 focus:ring-indigo-200 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white dark:placeholder-white/20 dark:focus:border-indigo-500/40 dark:focus:bg-white/[0.06]" />
              </div>
            ))}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-zinc-500 dark:text-white/45">Password strength</span>
                <span className="text-emerald-600 font-medium dark:text-emerald-400">Strong</span>
              </div>
              <div className="h-1.5 rounded-full bg-zinc-100 overflow-hidden dark:bg-white/[0.06]">
                <div className="h-full w-3/4 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400" />
              </div>
            </div>
            <button className="rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-zinc-800 w-full dark:bg-white dark:text-zinc-900 dark:hover:bg-white/90">Update password</button>
          </div>
        </div>

        <div className="animate-fade-in-delayed rounded-xl border border-zinc-200 bg-white p-6 dark:border-white/[0.06] dark:bg-white/[0.03] dark:backdrop-blur-xl">
          <h2 className="text-sm font-medium text-zinc-800 mb-5 dark:text-white/80">Two-factor authentication</h2>
          <div className="space-y-4">
            {[
              { title: "Authenticator app", desc: "Use an app like Google Authenticator or Authy.", btn: "Setup", badge: null },
              { title: "SMS codes", desc: "Receive verification codes via text message.", btn: null, badge: "Coming soon" },
              { title: "Recovery codes", desc: "Generate backup codes for account recovery.", btn: "Generate", badge: null },
            ].map((item) => (
              <div key={item.title} className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white px-4 py-3 dark:border-white/[0.06] dark:bg-white/[0.02]">
                <div>
                  <div className="text-sm text-zinc-800 dark:text-white/70">{item.title}</div>
                  <div className="text-xs text-zinc-500 dark:text-white/30">{item.desc}</div>
                </div>
                {item.btn && <button className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:border-white/[0.08] dark:text-white/50 dark:hover:bg-white/[0.04] dark:hover:text-white/70">{item.btn}</button>}
                {item.badge && <span className="rounded-md bg-zinc-100 px-2 py-0.5 text-[10px] uppercase font-medium text-zinc-400 dark:bg-white/[0.04] dark:text-white/25">{item.badge}</span>}
              </div>
            ))}
          </div>
        </div>

        <div className="animate-fade-in-slow rounded-xl border border-zinc-200 bg-white p-6 dark:border-white/[0.06] dark:bg-white/[0.03] dark:backdrop-blur-xl lg:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-medium text-zinc-800 dark:text-white/80">Active sessions</h2>
            <button className="text-xs text-red-500 hover:text-red-600 transition-colors dark:text-red-400/70 dark:hover:text-red-400">Revoke all</button>
          </div>
          <div className="space-y-3">
            {[
              { device: "Chrome on macOS", ip: "203.0.113.42", location: "San Francisco, US", current: true, time: "Active now" },
              { device: "Safari on iPhone", ip: "198.51.100.7", location: "San Francisco, US", current: false, time: "2 hours ago" },
              { device: "Firefox on Windows", ip: "192.0.2.15", location: "New York, US", current: false, time: "3 days ago" },
            ].map((s) => (
              <div key={s.device} className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white px-4 py-3 dark:border-white/[0.06] dark:bg-white/[0.02]">
                <div className="flex items-center gap-3">
                  <div className="flex size-9 items-center justify-center rounded-lg bg-zinc-100 text-zinc-500 dark:bg-white/[0.06] dark:text-white/40">
                    <svg className="size-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
                    </svg>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-zinc-800 dark:text-white/80">{s.device}</span>
                      {s.current && <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">Current</span>}
                    </div>
                    <div className="text-xs text-zinc-500 dark:text-white/30">{s.ip} · {s.location} · {s.time}</div>
                  </div>
                </div>
                {!s.current && (
                  <button className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-red-500 dark:border-white/[0.08] dark:text-white/40 dark:hover:bg-white/[0.04] dark:hover:text-red-400">Revoke</button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
