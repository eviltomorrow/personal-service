"use client";

import { PageHeader } from "@/components/page-header";
import { formatCNY } from "@/lib/format";
import {
  Wallet, TrendingUp, ArrowUpRight, ArrowDownRight, BookOpen,
  ArrowRight, LayoutDashboard, MessageCircle, BarChart3,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";

const summaryCards = [
  { label: "本月收入", value: "¥ 28,500.00", change: "+8.3%", trend: "up" as const, icon: TrendingUp },
  { label: "本月支出", value: "¥ 16,230.00", change: "-2.1%", trend: "down" as const, icon: Wallet },
  { label: "投资总市值", value: "¥ 234,567.89", change: "+12.5%", trend: "up" as const, icon: BarChart3 },
];

const featureCards = [
  { label: "资产负债表", desc: "6 个资产类别", href: "/dashboard/balance-sheet", icon: BookOpen, color: "from-sky-500 to-blue-600" },
  { label: "投资组合", desc: "3 个持仓品种", href: "/dashboard/portfolio", icon: TrendingUp, color: "from-emerald-500 to-teal-600" },
  { label: "收入与支出", desc: "本月结余 ¥12,270", href: "/dashboard/cash-flow", icon: Wallet, color: "from-amber-500 to-orange-600" },
  { label: "系统设置", desc: "账户与偏好", href: "/dashboard/settings", icon: LayoutDashboard, color: "from-slate-500 to-slate-700" },
];

const recentActivity = [
  { type: "buy", text: "买入 贵州茅台 100股", module: "投资组合", time: "2小时前", href: "/dashboard/portfolio" },
  { type: "income", text: "工资入账 ¥28,500.00", module: "收入与支出", time: "3小时前", href: "/dashboard/cash-flow" },
  { type: "expense", text: "盒马鲜生 ¥328.50", module: "收入与支出", time: "5小时前", href: "/dashboard/cash-flow" },
  { type: "asset", text: "新增 货币资金 ¥500,000", module: "资产负债表", time: "昨天", href: "/dashboard/balance-sheet" },
  { type: "sell", text: "卖出 沪深300ETF 2手", module: "投资组合", time: "昨天", href: "/dashboard/portfolio" },
  { type: "expense", text: "物业管理费 ¥1,200.00", module: "收入与支出", time: "2天前", href: "/dashboard/cash-flow" },
];

const assetData = [
  { month: "1月", total: 2150000, change: 0 },
  { month: "2月", total: 2180000, change: 30000 },
  { month: "3月", total: 2250000, change: 70000 },
  { month: "4月", total: 2320000, change: 70000 },
  { month: "5月", total: 2380000, change: 60000 },
  { month: "6月", total: 2456789, change: 76789 },
];

const toWan = (v: number) => `${(v / 10000).toFixed(v >= 1000000 ? 0 : 1)}万`;

const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-md text-xs">
      <p className="font-semibold text-gray-900 mb-1">{label}</p>
      <p className="text-gray-600">总资产：<span className="font-medium text-gray-900">{formatCNY(d.total)}</span></p>
      {d.change !== 0 && (
        <p className={d.change > 0 ? "text-emerald-600" : "text-red-600"}>
          月变动：{d.change > 0 ? "+" : ""}{formatCNY(d.change)}
        </p>
      )}
    </div>
  );
};

export default function DashboardPage() {
  return (
    <div className="space-y-8 anim-in anim-fade anim-up" style={{ animationDuration: "500ms" }}>
      <PageHeader title="仪表盘" description="欢迎回来，这是你的财务与投资总览。" />

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {summaryCards.map((card) => (
          <div key={card.label} className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
            <div className="flex items-center justify-between">
              <div className="rounded-lg bg-slate-100 p-2.5">
                <card.icon className="h-5 w-5 text-slate-600" />
              </div>
              <span className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-medium ${
                card.trend === "up" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
              }`}>
                {card.trend === "up" ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                {card.change}
              </span>
            </div>
            <p className="mt-4 text-2xl font-semibold text-gray-900">{card.value}</p>
            <p className="mt-1 text-sm text-gray-500">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Feature entry cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {featureCards.map((card) => (
          <a key={card.label} href={card.href}
            className="group flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${card.color} shadow-sm transition-all group-hover:scale-105 group-hover:shadow-md`}>
              <card.icon className="h-6 w-6 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-gray-900">{card.label}</p>
              <p className="text-xs text-gray-500 mt-0.5">{card.desc}</p>
            </div>
            <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-gray-500 transition-colors shrink-0" />
          </a>
        ))}
      </div>

      {/* Bottom section */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Recent activity */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-between p-6 pb-4">
            <div>
              <h3 className="text-base font-semibold text-gray-900">近期活动</h3>
              <p className="text-sm text-gray-500">各模块的最新动态</p>
            </div>
          </div>
          <div className="divide-y divide-gray-100">
            {recentActivity.map((act, i) => {
              const iconMap: Record<string, string> = {
                buy: "text-emerald-600 bg-emerald-50",
                sell: "text-red-600 bg-red-50",
                income: "text-emerald-600 bg-emerald-50",
                expense: "text-red-600 bg-red-50",
                asset: "text-blue-600 bg-blue-50",
              };
              const dotCls = iconMap[act.type] || "text-gray-500 bg-gray-50";
              return (
                <a key={i} href={act.href}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors group">
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${dotCls}`}>
                    <MessageCircle className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 group-hover:text-slate-600 transition-colors">{act.text}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{act.time}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-gray-100 px-2.5 py-0.5 text-[10px] font-medium text-gray-600 ring-1 ring-gray-600/10">
                    {act.module}
                  </span>
                </a>
              );
            })}
          </div>
        </div>

        {/* Total asset trend */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-gray-900">总资产走势</h3>
              <p className="text-sm text-gray-500">近半年资产变化趋势</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-semibold text-gray-900 tabular-nums">{formatCNY(assetData[assetData.length - 1].total)}</p>
              <p className="text-xs text-emerald-600">较年初 +14.3%</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={360}>
            <BarChart data={assetData} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
              <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 4" vertical={false} />
              <XAxis dataKey="month" axisLine={{ stroke: "#e2e8f0" }} tickLine={false}
                tick={{ fontSize: 12, fill: "#9ca3af" }} dy={4} />
              <YAxis axisLine={false} tickLine={false}
                tick={{ fontSize: 11, fill: "#9ca3af" }} dx={-4}
                tickFormatter={(v: number) => (v >= 0 ? "+" : "") + toWan(Math.abs(v))} />
              <Tooltip content={<ChartTooltip />} cursor={{ stroke: "#cbd5e1", strokeDasharray: "3 3" }} />
              <Bar dataKey="change" barSize={48} radius={[6, 6, 0, 0]} maxBarSize={64}>
                {assetData.map((d, i) => (
                  <Cell key={i} fill={d.change >= 0 ? "#10b981" : "#ef4444"} fillOpacity={0.75} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
