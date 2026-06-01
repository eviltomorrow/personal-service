export default function SettingsPage() {
  return (
    <>
      <div className="mb-8">
        <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-white">Settings</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-white/35">Configure your account preferences and defaults.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="animate-fade-in rounded-xl border border-zinc-200 bg-white p-6 dark:border-white/[0.06] dark:bg-white/[0.03] dark:backdrop-blur-xl lg:col-span-2">
          <h2 className="text-sm font-medium text-zinc-800 mb-5 dark:text-white/80">Preferences</h2>
          <div className="space-y-5">
            {[
              { label: "Email notifications", desc: "Receive emails about account activity and security alerts.", on: true },
              { label: "Two-factor authentication", desc: "Require a verification code when signing in from new devices.", on: false },
              { label: "Session timeout", desc: "Automatically sign out after 30 minutes of inactivity.", on: true },
            ].map((t) => (
              <div key={t.label} className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white px-4 py-3.5 dark:border-white/[0.06] dark:bg-white/[0.02]">
                <div>
                  <div className="text-sm text-zinc-800 dark:text-white/80">{t.label}</div>
                  <div className="text-xs text-zinc-500 mt-0.5 dark:text-white/30">{t.desc}</div>
                </div>
                <div className={`relative inline-flex h-6 w-10 cursor-pointer items-center rounded-full transition-colors ${t.on ? "bg-indigo-500" : "bg-zinc-200 dark:bg-white/[0.1]"}`}>
                  <span className={`inline-block size-4 rounded-full bg-white shadow-sm transition-transform ${t.on ? "translate-x-5" : "translate-x-1 dark:bg-white/40"}`} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="animate-fade-in-delayed rounded-xl border border-zinc-200 bg-white p-6 dark:border-white/[0.06] dark:bg-white/[0.03] dark:backdrop-blur-xl">
          <h2 className="text-sm font-medium text-zinc-800 mb-5 dark:text-white/80">Language & region</h2>
          <div className="space-y-4">
            {[
              { label: "Language", options: ["English", "中文", "日本語"] },
              { label: "Timezone", options: ["UTC (Coordinated Universal Time)", "America/New_York (EST)", "Asia/Shanghai (CST)"] },
              { label: "Date format", options: ["YYYY-MM-DD", "DD/MM/YYYY", "MM/DD/YYYY"] },
            ].map((f) => (
              <div key={f.label}>
                <label className="mb-1.5 block text-xs font-medium tracking-wide text-zinc-500 uppercase dark:text-white/45">{f.label}</label>
                <select className="block w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 outline-none transition-colors focus:border-indigo-400 focus:ring-1 focus:ring-indigo-200 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white dark:focus:border-indigo-500/40 dark:focus:bg-white/[0.06]">
                  {f.options.map((o) => <option key={o}>{o}</option>)}
                </select>
              </div>
            ))}
          </div>
        </div>

        <div className="animate-fade-in-delayed rounded-xl border border-zinc-200 bg-white p-6 dark:border-white/[0.06] dark:bg-white/[0.03] dark:backdrop-blur-xl">
          <h2 className="text-sm font-medium text-zinc-800 mb-5 dark:text-white/80">Appearance</h2>
          <div className="space-y-3">
            {[
              { label: "Dark", desc: "Always use dark theme", selected: false },
              { label: "Light", desc: "Always use light theme", selected: false },
              { label: "System", desc: "Follow system preference", selected: true },
            ].map((t) => (
              <div key={t.label} className={`flex items-center justify-between rounded-lg border px-4 py-3 transition-colors cursor-pointer ${t.selected ? "border-indigo-300 bg-indigo-50 dark:border-indigo-500/30 dark:bg-indigo-500/[0.06]" : "border-zinc-200 bg-white hover:border-zinc-300 dark:border-white/[0.06] dark:bg-white/[0.02] dark:hover:border-white/[0.1]"}`}>
                <div>
                  <div className="text-sm text-zinc-800 dark:text-white/80">{t.label}</div>
                  <div className="text-xs text-zinc-500 dark:text-white/30">{t.desc}</div>
                </div>
                <div className={`flex size-4.5 items-center justify-center rounded-full border-2 transition-colors ${t.selected ? "border-indigo-500" : "border-zinc-300 dark:border-white/20"}`}>
                  {t.selected && <span className="size-2 rounded-full bg-indigo-500" />}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="animate-fade-in-slow flex justify-end gap-3 lg:col-span-2">
          <button className="rounded-xl border border-zinc-200 px-5 py-2.5 text-sm text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:border-white/[0.08] dark:text-white/50 dark:hover:bg-white/[0.04] dark:hover:text-white/70">Reset</button>
          <button className="rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-white/90">Save settings</button>
        </div>
      </div>
    </>
  );
}
