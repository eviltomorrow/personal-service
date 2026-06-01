const apiKeys = [
  { name: "Production API", key: "sk_prod_••••••••••••a3f8", created: "3 days ago", lastUsed: "2 hours ago", status: "active" },
  { name: "Staging API", key: "sk_stag_••••••••••••b2c4", created: "1 week ago", lastUsed: "1 day ago", status: "active" },
  { name: "Development", key: "sk_dev_••••••••••••c1d9", created: "2 weeks ago", lastUsed: "5 days ago", status: "active" },
  { name: "Mobile App", key: "sk_mobi_••••••••••••e7f2", created: "1 month ago", lastUsed: "Never", status: "revoked" },
];

export default function ApiKeysPage() {
  return (
    <>
      <div className="mb-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-white">API Keys</h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-white/35">Manage access tokens and third-party integrations.</p>
          </div>
          <button className="rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-white/90">+ Create key</button>
        </div>
      </div>

      <div className="animate-fade-in mb-6 flex items-start gap-3 rounded-xl border border-indigo-200 bg-indigo-50/50 px-5 py-4 dark:border-indigo-500/10 dark:bg-indigo-500/[0.04] dark:backdrop-blur-xl">
        <svg className="mt-0.5 size-5 shrink-0 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
        </svg>
        <p className="text-xs text-indigo-700/80 leading-relaxed dark:text-indigo-300/80">API keys grant full access to your account. Treat them like passwords — never share them in client-side code or public repositories.</p>
      </div>

      <div className="animate-fade-in-delayed space-y-3">
        {apiKeys.map((key) => (
          <div key={key.name} className="rounded-xl border border-zinc-200 bg-white p-5 transition-all hover:border-zinc-300 hover:shadow-sm dark:border-white/[0.06] dark:bg-white/[0.03] dark:backdrop-blur-xl dark:hover:border-white/[0.1]">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2.5">
                  <h3 className="text-sm font-medium text-zinc-800 dark:text-white/80">{key.name}</h3>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${key.status === "active" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400" : "bg-zinc-100 text-zinc-500 dark:bg-zinc-500/10 dark:text-zinc-400"}`}>{key.status}</span>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <code className="rounded-md bg-zinc-100 px-2.5 py-1 text-xs font-mono text-zinc-500 dark:bg-white/[0.04] dark:text-white/40">{key.key}</code>
                  <button className="text-zinc-300 hover:text-zinc-500 transition-colors dark:text-white/20 dark:hover:text-white/50">
                    <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184" />
                    </svg>
                  </button>
                </div>
                <div className="mt-2 flex gap-4 text-xs text-zinc-400 dark:text-white/25">
                  <span>Created {key.created}</span>
                  <span>·</span>
                  <span>Last used {key.lastUsed}</span>
                </div>
              </div>
              <button className="shrink-0 rounded-lg border border-zinc-200 px-3 py-1.5 text-xs text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:border-white/[0.08] dark:text-white/40 dark:hover:bg-white/[0.04] dark:hover:text-white/60">{key.status === "active" ? "Revoke" : "Delete"}</button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
