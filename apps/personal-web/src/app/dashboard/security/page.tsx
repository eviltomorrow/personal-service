import { Shield, Key, Smartphone, History, AlertTriangle, CheckCircle } from "lucide-react";

const items = [
  { label: "Two-Factor Authentication", description: "Add an extra layer of security to your account", status: "Enabled", icon: Key },
  { label: "Active Sessions", description: "Manage devices and sessions", status: "3 active", icon: Smartphone },
  { label: "Login History", description: "Review recent login activity", status: "View", icon: History },
  { label: "Password Strength", description: "Last changed 30 days ago", status: "Strong", icon: Shield },
];

export default function SecurityPage() {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-2xl font-semibold text-white">Security</h1>
        <p className="mt-1 text-sm text-white/50">Protect your account and review security settings.</p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {items.map((item) => (
          <button
            key={item.label}
            className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-5 hover:bg-white/10 transition-all text-left w-full group"
          >
            <div className="rounded-lg bg-white/10 p-2.5 group-hover:bg-white/15 transition-colors">
              <item.icon className="h-5 w-5 text-white/70" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-white/80">{item.label}</p>
              <p className="text-xs text-white/40 mt-0.5">{item.description}</p>
            </div>
            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
              item.status === "Enabled" || item.status === "Strong"
                ? "bg-emerald-500/10 text-emerald-400"
                : "bg-white/10 text-white/60"
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
