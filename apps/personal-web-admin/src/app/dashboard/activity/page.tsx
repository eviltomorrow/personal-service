import { PageHeader } from "@/components/page-header";
import { UserPlus, ShoppingCart, Settings, Shield, LogIn, FileText } from "lucide-react";

const activities = [
  { action: "New user registered", detail: "Emma Davis created an account", time: "2 min ago", icon: UserPlus, color: "text-emerald-600" },
  { action: "Order completed", detail: "Order #3821 was completed", time: "15 min ago", icon: ShoppingCart, color: "text-indigo-600" },
  { action: "Settings updated", detail: "API rate limit was changed", time: "1 hour ago", icon: Settings, color: "text-amber-600" },
  { action: "Security alert", detail: "New login from unknown device", time: "2 hours ago", icon: Shield, color: "text-red-600" },
  { action: "User logged in", detail: "John Doe logged in", time: "3 hours ago", icon: LogIn, color: "text-emerald-600" },
  { action: "Report generated", detail: "Monthly report for June", time: "5 hours ago", icon: FileText, color: "text-indigo-600" },
  { action: "New user registered", detail: "James Wilson created an account", time: "6 hours ago", icon: UserPlus, color: "text-emerald-600" },
  { action: "Order refunded", detail: "Order #3810 was refunded", time: "8 hours ago", icon: ShoppingCart, color: "text-red-600" },
];

export default function ActivityPage() {
  return (
    <div className="space-y-8 anim-in anim-fade anim-up" style={{ animationDuration: "500ms" }}>
      <PageHeader title="Activity" description="Real-time activity log for your platform." />

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="text-base font-semibold text-gray-900 mb-2">Live Feed</h3>
        <p className="text-sm text-gray-500 mb-6">Recent actions across the platform.</p>

        <div className="space-y-0">
          {activities.map((a, i) => (
            <div key={i} className="flex items-start gap-4 py-4 border-t border-gray-100 first:border-t-0">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 shrink-0">
                <a.icon className={`h-4 w-4 ${a.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">{a.action}</p>
                <p className="text-xs text-gray-500 mt-0.5">{a.detail}</p>
              </div>
              <span className="text-xs text-gray-400 shrink-0">{a.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
