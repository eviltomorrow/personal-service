import { PageHeader } from "@/components/page-header";
import { Shield, Key, Smartphone, History, CheckCircle } from "lucide-react";

const items = [
  { label: "Two-Factor Authentication", description: "Add an extra layer of security to your account", status: "Enabled", icon: Key },
  { label: "Active Sessions", description: "Manage devices and sessions", status: "3 active", icon: Smartphone },
  { label: "Login History", description: "Review recent login activity", status: "View", icon: History },
  { label: "Password Strength", description: "Last changed 30 days ago", status: "Strong", icon: Shield },
];

export default function SecurityPage() {
  return (
    <div className="space-y-8 anim-in anim-fade anim-up" style={{ animationDuration: "500ms" }}>
      <PageHeader title="Security" description="Protect your account and review security settings." />

      <div className="grid grid-cols-1 gap-4">
        {items.map((item) => (
          <button
            key={item.label}
            className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition-all text-left w-full group"
          >
            <div className="rounded-lg bg-indigo-50 p-2.5 group-hover:bg-indigo-100 transition-colors">
              <item.icon className="h-5 w-5 text-indigo-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">{item.label}</p>
              <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
            </div>
            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
              item.status === "Enabled" || item.status === "Strong"
                ? "bg-emerald-50 text-emerald-700"
                : "bg-gray-100 text-gray-700"
            }`}>
              {item.status === "Enabled" || item.status === "Strong" ? (
                <CheckCircle className="h-3 w-3" />
              ) : null}
              {item.status}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
