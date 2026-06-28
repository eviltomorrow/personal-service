import { Activity, UserPlus, ShoppingCart, Settings, Shield, LogIn, FileText } from "lucide-react";

const activities = [
  { action: "New user registered", detail: "Emma Davis created an account", time: "2 min ago", icon: UserPlus, color: "text-emerald-400" },
  { action: "Order completed", detail: "Order #3821 was completed", time: "15 min ago", icon: ShoppingCart, color: "text-indigo-400" },
  { action: "Settings updated", detail: "API rate limit was changed", time: "1 hour ago", icon: Settings, color: "text-amber-400" },
  { action: "Security alert", detail: "New login from unknown device", time: "2 hours ago", icon: Shield, color: "text-red-400" },
  { action: "User logged in", detail: "John Doe logged in", time: "3 hours ago", icon: LogIn, color: "text-emerald-400" },
  { action: "Report generated", detail: "Monthly report for June", time: "5 hours ago", icon: FileText, color: "text-indigo-400" },
  { action: "New user registered", detail: "James Wilson created an account", time: "6 hours ago", icon: UserPlus, color: "text-emerald-400" },
  { action: "Order refunded", detail: "Order #3810 was refunded", time: "8 hours ago", icon: ShoppingCart, color: "text-red-400" },
];

export default function ActivityPage() {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-2xl font-semibold text-white">Activity</h1>
        <p className="mt-1 text-sm text-white/50">Real-time activity log for your platform.</p>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-6">
        <h3 className="text-base font-semibold text-white mb-2">Live Feed</h3>
        <p className="text-sm text-white/50 mb-6">Recent actions across the platform.</p>

        <div className="space-y-0">
          {activities.map((a, i) => (
            <div key={i} className="flex items-start gap-4 py-4 border-t border-white/5 first:border-t-0">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 shrink-0">
                <a.icon className={`h-4 w-4 ${a.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white/80">{a.action}</p>
                <p className="text-xs text-white/40 mt-0.5">{a.detail}</p>
              </div>
              <span className="text-xs text-white/30 shrink-0">{a.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
