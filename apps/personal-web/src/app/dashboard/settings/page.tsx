"use client";

import { Settings, Bell, Globe, Lock, CreditCard, Users, ChevronRight } from "lucide-react";

const sections = [
  { label: "Profile", description: "Manage your personal information", icon: Users },
  { label: "Notifications", description: "Configure email and push notifications", icon: Bell },
  { label: "Security", description: "Password, 2FA, and session management", icon: Lock },
  { label: "Billing", description: "Subscription and payment methods", icon: CreditCard },
  { label: "Preferences", description: "Language, timezone, and display settings", icon: Globe },
];

export default function SettingsPage() {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-2xl font-semibold text-white">Settings</h1>
        <p className="mt-1 text-sm text-white/50">Manage your account settings and preferences.</p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {sections.map((s) => (
          <button
            key={s.label}
            className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-5 hover:bg-white/10 transition-all text-left w-full group"
          >
            <div className="rounded-lg bg-white/10 p-2.5 group-hover:bg-white/15 transition-colors">
              <s.icon className="h-5 w-5 text-white/70" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-white/80">{s.label}</p>
              <p className="text-xs text-white/40 mt-0.5">{s.description}</p>
            </div>
            <ChevronRight className="h-5 w-5 text-white/20 group-hover:text-white/50 transition-colors" />
          </button>
        ))}
      </div>
    </div>
  );
}
