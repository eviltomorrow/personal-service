import { PageHeader } from "@/components/page-header";
import { TrendingUp, Users, Eye, Clock, ArrowUpRight } from "lucide-react";

const metrics = [
  { label: "页面浏览量", value: "142,832", change: "+18.2%", icon: Eye },
  { label: "平均会话时长", value: "4分32秒", change: "+5.7%", icon: Clock },
  { label: "跳出率", value: "32.1%", change: "-2.4%", icon: TrendingUp },
  { label: "活跃用户", value: "3,421", change: "+11.3%", icon: Users },
];

export default function AnalyticsPage() {
  return (
    <div className="space-y-8 anim-in anim-fade anim-up" style={{ animationDuration: "500ms" }}>
      <PageHeader title="数据分析" description="跟踪平台性能与用户参与度。" />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {metrics.map((m) => (
          <div key={m.label} className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <div className="rounded-lg bg-indigo-50 p-2.5">
                <m.icon className="h-5 w-5 text-indigo-600" />
              </div>
              <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                <ArrowUpRight className="h-3 w-3" />
                {m.change}
              </span>
            </div>
            <p className="mt-4 text-2xl font-semibold text-gray-900">{m.value}</p>
            <p className="mt-1 text-sm text-gray-500">{m.label}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="text-base font-semibold text-gray-900 mb-4">分析概览</h3>
        <div className="h-64 flex items-end justify-between gap-2">
          {Array.from({ length: 24 }, (_, i) => ({
            label: `${String(i).padStart(2, "0")}:00`,
            value: 20 + Math.floor(Math.random() * 70),
          })).map((h) => (
            <div key={h.label} className="flex flex-col items-center gap-2 flex-1">
              <div className="w-full bg-gray-100 rounded-full relative" style={{ height: "200px" }}>
                <div
                  className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-indigo-500 to-indigo-400/60 rounded-full transition-all duration-500"
                  style={{ height: `${h.value}%` }}
                />
              </div>
              <span className="text-[10px] text-gray-400">{h.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
