import { BarChart3, TrendingUp, Users, Eye, Clock, ArrowUpRight } from "lucide-react";

const metrics = [
  { label: "Page Views", value: "142,832", change: "+18.2%", icon: Eye },
  { label: "Avg. Session", value: "4m 32s", change: "+5.7%", icon: Clock },
  { label: "Bounce Rate", value: "32.1%", change: "-2.4%", icon: TrendingUp },
  { label: "Active Users", value: "3,421", change: "+11.3%", icon: Users },
];

export default function AnalyticsPage() {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-2xl font-semibold text-white">Analytics</h1>
        <p className="mt-1 text-sm text-white/50">Track your platform performance and user engagement.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {metrics.map((m) => (
          <div key={m.label} className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-6 hover:bg-white/10 transition-all">
            <div className="flex items-center justify-between">
              <div className="rounded-lg bg-white/10 p-2.5">
                <m.icon className="h-5 w-5 text-white/70" />
              </div>
              <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-400">
                <ArrowUpRight className="h-3 w-3" />
                {m.change}
              </span>
            </div>
            <p className="mt-4 text-2xl font-semibold text-white">{m.value}</p>
            <p className="mt-1 text-sm text-white/50">{m.label}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-6">
        <h3 className="text-base font-semibold text-white mb-4">Analytics Overview</h3>
        <div className="h-64 flex items-end justify-between gap-2">
          {Array.from({ length: 24 }, (_, i) => ({
            label: `${String(i).padStart(2, "0")}:00`,
            value: 20 + Math.floor(Math.random() * 70),
          })).map((h) => (
            <div key={h.label} className="flex flex-col items-center gap-2 flex-1">
              <div className="w-full bg-white/5 rounded-full relative" style={{ height: "200px" }}>
                <div
                  className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-indigo-500 to-indigo-400/60 rounded-full transition-all duration-500"
                  style={{ height: `${h.value}%` }}
                />
              </div>
              <span className="text-[10px] text-white/30">{h.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
