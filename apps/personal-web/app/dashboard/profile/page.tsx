export default function ProfilePage() {
  return (
    <>
      <div className="mb-8">
        <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-white">Profile</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-white/35">Manage your personal information and public profile.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="animate-fade-in rounded-xl border border-zinc-200 bg-white p-6 dark:border-white/[0.06] dark:bg-white/[0.03] dark:backdrop-blur-xl">
          <div className="flex flex-col items-center text-center">
            <div className="relative">
              <div className="flex size-24 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-2xl font-bold text-white ring-2 ring-zinc-200 dark:ring-white/[0.08]">JD</div>
              <button className="absolute -bottom-1 -right-1 flex size-8 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-500 transition-colors hover:text-zinc-700 dark:border-white/[0.1] dark:bg-[#0a0a0f] dark:text-white/60 dark:hover:text-white">
                <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Z" />
                </svg>
              </button>
            </div>
            <h2 className="mt-4 text-lg font-semibold text-zinc-900 dark:text-white/90">John Doe</h2>
            <p className="text-sm text-zinc-500 dark:text-white/40">john@example.com</p>
            <span className="mt-3 rounded-full bg-emerald-100 px-3 py-0.5 text-[11px] font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">Active</span>
          </div>
        </div>

        <div className="animate-fade-in-delayed rounded-xl border border-zinc-200 bg-white p-6 dark:border-white/[0.06] dark:bg-white/[0.03] dark:backdrop-blur-xl lg:col-span-2">
          <h2 className="text-sm font-medium text-zinc-800 mb-5 dark:text-white/80">Personal details</h2>
          <div className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-medium tracking-wide text-zinc-500 uppercase dark:text-white/45">First name</label>
                <input type="text" defaultValue="John" className="block w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 outline-none transition-colors focus:border-indigo-400 focus:ring-1 focus:ring-indigo-200 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white dark:focus:border-indigo-500/40 dark:focus:bg-white/[0.06]" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium tracking-wide text-zinc-500 uppercase dark:text-white/45">Last name</label>
                <input type="text" defaultValue="Doe" className="block w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 outline-none transition-colors focus:border-indigo-400 focus:ring-1 focus:ring-indigo-200 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white dark:focus:border-indigo-500/40 dark:focus:bg-white/[0.06]" />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium tracking-wide text-zinc-500 uppercase dark:text-white/45">Email</label>
              <input type="email" defaultValue="john@example.com" className="block w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 outline-none transition-colors focus:border-indigo-400 focus:ring-1 focus:ring-indigo-200 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white dark:focus:border-indigo-500/40 dark:focus:bg-white/[0.06]" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium tracking-wide text-zinc-500 uppercase dark:text-white/45">Username</label>
              <input type="text" defaultValue="johndoe" className="block w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 outline-none transition-colors focus:border-indigo-400 focus:ring-1 focus:ring-indigo-200 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white dark:focus:border-indigo-500/40 dark:focus:bg-white/[0.06]" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium tracking-wide text-zinc-500 uppercase dark:text-white/45">Bio</label>
              <textarea rows={3} defaultValue="Full-stack developer & designer." className="block w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 outline-none transition-colors focus:border-indigo-400 focus:ring-1 focus:ring-indigo-200 resize-none dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white dark:placeholder-white/20 dark:focus:border-indigo-500/40 dark:focus:bg-white/[0.06]" />
            </div>
            <div className="flex justify-end gap-3">
              <button className="rounded-xl border border-zinc-200 px-4 py-2 text-sm text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:border-white/[0.08] dark:text-white/50 dark:hover:bg-white/[0.04] dark:hover:text-white/70">Cancel</button>
              <button className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-white/90">Save changes</button>
            </div>
          </div>
        </div>

        <div className="animate-fade-in-slow rounded-xl border border-red-200 bg-red-50/50 p-6 dark:border-red-500/10 dark:bg-red-500/[0.03] dark:backdrop-blur-xl lg:col-span-3">
          <h2 className="text-sm font-medium text-red-600 dark:text-red-400/80">Danger zone</h2>
          <p className="mt-1 text-xs text-zinc-500 dark:text-white/30">Irreversible actions — proceed with caution.</p>
          <div className="mt-4 flex items-center justify-between rounded-lg border border-red-200 bg-red-100/50 px-4 py-3 dark:border-red-500/10 dark:bg-red-500/[0.04]">
            <div>
              <div className="text-sm text-zinc-800 dark:text-white/70">Delete account</div>
              <div className="text-xs text-zinc-500 dark:text-white/30">Permanently remove your account and all associated data.</div>
            </div>
            <button className="shrink-0 rounded-lg border border-red-300 px-3.5 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-100 dark:border-red-500/20 dark:text-red-400 dark:hover:bg-red-500/10">Delete</button>
          </div>
        </div>
      </div>
    </>
  );
}
