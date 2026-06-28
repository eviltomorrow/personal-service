"use client";

import { PageHeader } from "@/components/page-header";
import { Bell, Globe, Lock, CreditCard, Users, ChevronRight } from "lucide-react";

const sections = [
  { label: "Profile", description: "Manage your personal information", icon: Users },
  { label: "Notifications", description: "Configure email and push notifications", icon: Bell },
  { label: "Security", description: "Password, 2FA, and session management", icon: Lock },
  { label: "Billing", description: "Subscription and payment methods", icon: CreditCard },
  { label: "Preferences", description: "Language, timezone, and display settings", icon: Globe },
];

export default function SettingsPage() {
  return (
    <div className="space-y-8 anim-in anim-fade anim-up" style={{ animationDuration: "500ms" }}>
      <PageHeader title="Settings" description="Manage your account settings and preferences." />

      <div className="grid grid-cols-1 gap-4">
        {sections.map((s) => (
          <button
            key={s.label}
            className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition-all text-left w-full group"
          >
            <div className="rounded-lg bg-indigo-50 p-2.5 group-hover:bg-indigo-100 transition-colors">
              <s.icon className="h-5 w-5 text-indigo-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">{s.label}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.description}</p>
            </div>
            <ChevronRight className="h-5 w-5 text-gray-300 group-hover:text-gray-500 transition-colors" />
          </button>
        ))}
      </div>
    </div>
  );
}
