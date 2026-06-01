export default function SettingsPage() {
  return (
    <>
      <div className="mb-8">
        <h1 className="text-xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-white/35">Configure your account preferences and defaults.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Preferences */}
        <div className="animate-fade-in rounded-xl border border-white/[0.06] bg-white/[0.03] p-6 backdrop-blur-xl lg:col-span-2">
          <h2 className="text-sm font-medium text-white/80 mb-5">Preferences</h2>
          <div className="space-y-5">
            <div className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-3.5">
              <div>
                <div className="text-sm text-white/80">Email notifications</div>
                <div className="text-xs text-white/30 mt-0.5">Receive emails about account activity and security alerts.</div>
              </div>
              <div className="relative inline-flex h-6 w-10 cursor-pointer items-center rounded-full bg-indigo-500 transition-colors">
                <span className="inline-block size-4 translate-x-5 rounded-full bg-white shadow-sm transition-transform" />
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-3.5">
              <div>
                <div className="text-sm text-white/80">Two-factor authentication</div>
                <div className="text-xs text-white/30 mt-0.5">Require a verification code when signing in from new devices.</div>
              </div>
              <div className="relative inline-flex h-6 w-10 cursor-pointer items-center rounded-full bg-white/[0.1] transition-colors">
                <span className="inline-block size-4 translate-x-1 rounded-full bg-white/40 shadow-sm transition-transform" />
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-3.5">
              <div>
                <div className="text-sm text-white/80">Session timeout</div>
                <div className="text-xs text-white/30 mt-0.5">Automatically sign out after 30 minutes of inactivity.</div>
              </div>
              <div className="relative inline-flex h-6 w-10 cursor-pointer items-center rounded-full bg-indigo-500 transition-colors">
                <span className="inline-block size-4 translate-x-5 rounded-full bg-white shadow-sm transition-transform" />
              </div>
            </div>
          </div>
        </div>

        {/* Language & region */}
        <div className="animate-fade-in-delayed rounded-xl border border-white/[0.06] bg-white/[0.03] p-6 backdrop-blur-xl">
          <h2 className="text-sm font-medium text-white/80 mb-5">Language & region</h2>
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium tracking-wide text-white/45 uppercase">Language</label>
              <select className="block w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-sm text-white outline-none transition-colors focus:border-indigo-500/40 focus:bg-white/[0.06]">
                <option>English</option>
                <option>中文</option>
                <option>日本語</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium tracking-wide text-white/45 uppercase">Timezone</label>
              <select className="block w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-sm text-white outline-none transition-colors focus:border-indigo-500/40 focus:bg-white/[0.06]">
                <option>UTC (Coordinated Universal Time)</option>
                <option>America/New_York (EST)</option>
                <option>Asia/Shanghai (CST)</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium tracking-wide text-white/45 uppercase">Date format</label>
              <select className="block w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-sm text-white outline-none transition-colors focus:border-indigo-500/40 focus:bg-white/[0.06]">
                <option>YYYY-MM-DD</option>
                <option>DD/MM/YYYY</option>
                <option>MM/DD/YYYY</option>
              </select>
            </div>
          </div>
        </div>

        {/* Theme */}
        <div className="animate-fade-in-delayed rounded-xl border border-white/[0.06] bg-white/[0.03] p-6 backdrop-blur-xl">
          <h2 className="text-sm font-medium text-white/80 mb-5">Appearance</h2>
          <div className="space-y-3">
            {[
              { label: "Dark", desc: "Always use dark theme", selected: true },
              { label: "Light", desc: "Always use light theme", selected: false },
              { label: "System", desc: "Follow system preference", selected: false },
            ].map((t) => (
              <div key={t.label} className={`flex items-center justify-between rounded-lg border px-4 py-3 transition-colors cursor-pointer ${
                t.selected ? "border-indigo-500/30 bg-indigo-500/[0.06]" : "border-white/[0.06] bg-white/[0.02] hover:border-white/[0.1]"
              }`}>
                <div>
                  <div className="text-sm text-white/80">{t.label}</div>
                  <div className="text-xs text-white/30">{t.desc}</div>
                </div>
                <div className={`flex size-4.5 items-center justify-center rounded-full border-2 transition-colors ${
                  t.selected ? "border-indigo-500" : "border-white/20"
                }`}>
                  {t.selected && <span className="size-2 rounded-full bg-indigo-500" />}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Save */}
        <div className="animate-fade-in-slow flex justify-end gap-3 lg:col-span-2">
          <button className="rounded-xl border border-white/[0.08] px-5 py-2.5 text-sm text-white/50 transition-colors hover:bg-white/[0.04] hover:text-white/70">Reset</button>
          <button className="rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-zinc-900 transition-all hover:bg-white/90">Save settings</button>
        </div>
      </div>
    </>
  );
}
