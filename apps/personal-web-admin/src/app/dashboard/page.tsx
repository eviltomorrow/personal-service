"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/page-header";
import { formatCNY } from "@/lib/format";
import { api } from "@/lib/api";
import {
  Wallet, TrendingUp, ArrowUpRight, ArrowDownRight, BookOpen,
  ArrowRight, LayoutDashboard, BarChart3,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie,
} from "recharts";

interface Transaction {
  id: number;
  category_id: number;
  type: "income" | "expense";
  name: string;
  amount: number;
}

interface Position {
  current_price: number;
  initial_qty: number;
}

interface ValueSnapshot {
  date: string;
  total_value: number;
}

interface Category {
  id: number;
  name: string;
  type: "income" | "expense";
}

const featureCards = [
  { label: "资产负债表", desc: "6 个资产类别", href: "/dashboard/balance-sheet", icon: BookOpen, color: "from-sky-500 to-blue-600" },
  { label: "投资组合", desc: "3 个持仓品种", href: "/dashboard/portfolio", icon: TrendingUp, color: "from-emerald-500 to-teal-600" },
  { label: "收入与支出", desc: "本月结余 ¥12,270", href: "/dashboard/cash-flow", icon: Wallet, color: "from-amber-500 to-orange-600" },
  { label: "系统设置", desc: "账户与偏好", href: "/dashboard/settings", icon: LayoutDashboard, color: "from-slate-500 to-slate-700" },
];

const DONUT_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

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
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [snapshots, setSnapshots] = useState<ValueSnapshot[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth() + 1;
    Promise.all([
      api(`/api/v1/cash-flow/transactions?year=${y}&month=${m}`).then(r => r.json()),
      api("/api/v1/cash-flow/portfolio/positions").then(r => r.json()),
      api("/api/v1/cash-flow/portfolio/snapshots").then(r => r.json()),
      api(`/api/v1/cash-flow/categories?year=${y}&month=${m}`).then(r => r.json()),
    ]).then(([txRes, posRes, snapRes, catRes]: any[]) => {
      if (txRes.code === 0) setTransactions(txRes.data?.transactions ?? []);
      if (posRes.code === 0) setPositions(posRes.data ?? []);
      if (snapRes.code === 0) setSnapshots(snapRes.data ?? []);
      if (catRes.code === 0) setCategories(catRes.data ?? []);
    }).finally(() => setLoading(false));
  }, []);

  const totalIncome = transactions
    .filter(t => t.type === "income")
    .reduce((s, t) => s + t.amount, 0);

  const totalExpense = transactions
    .filter(t => t.type === "expense")
    .reduce((s, t) => s + t.amount, 0);

  const portfolioValue = positions
    .reduce((s, p) => s + p.current_price * p.initial_qty, 0);

  const sortedSnapshots = [...snapshots].sort((a, b) => a.date.localeCompare(b.date));
  const lastSnapshot = sortedSnapshots[sortedSnapshots.length - 1];
  const prevSnapshot = sortedSnapshots.length > 1 ? sortedSnapshots[sortedSnapshots.length - 2] : null;

  function calcChange(current: number, previous: number | null): { change: string; trend: "up" | "down" } | null {
    if (!previous || previous === 0) return null;
    const pct = ((current - previous) / previous) * 100;
    return {
      change: `${pct >= 0 ? "+" : ""}${Math.round(pct)}%`,
      trend: pct >= 0 ? "up" as const : "down" as const,
    };
  }

  const incomeChange = calcChange(totalIncome, null);
  const expenseChange = calcChange(totalExpense, null);
  const portfolioChange = lastSnapshot && prevSnapshot
    ? calcChange(portfolioValue, prevSnapshot.total_value)
    : null;

  const summaryCards = [
    { label: "本月收入", value: totalIncome, change: incomeChange, icon: TrendingUp },
    { label: "本月支出", value: totalExpense, change: expenseChange, icon: Wallet },
    { label: "投资总市值", value: portfolioValue, change: portfolioChange, icon: BarChart3 },
  ];

  const catMap = new Map(categories.filter(c => c.type === "expense").map(c => [c.id, c.name]));

  const expenseByCat = transactions
    .filter(t => t.type === "expense")
    .reduce<Map<number, number>>((map, t) => {
      map.set(t.category_id, (map.get(t.category_id) ?? 0) + t.amount);
      return map;
    }, new Map());

  const sortedCats = [...expenseByCat.entries()]
    .sort((a, b) => b[1] - a[1]);

  const topCats = sortedCats.slice(0, 5);
  const otherAmount = sortedCats.slice(5).reduce((s, [, v]) => s + v, 0);

  const donutData = topCats.map(([catId, amount], i) => ({
    name: catMap.get(catId) ?? `分类${catId}`,
    value: amount,
    color: DONUT_COLORS[i % DONUT_COLORS.length],
  }));
  if (otherAmount > 0) {
    donutData.push({ name: "其他", value: otherAmount, color: "#94a3b8" });
  }

  const totalExpenseAmt = donutData.reduce((s, d) => s + d.value, 0);

  const chartData = sortedSnapshots.slice(-12).map((s, i, arr) => {
    const monthLabel = s.date.length >= 7
      ? `${parseInt(s.date.slice(5, 7))}月`
      : s.date;
    const prev = i > 0 ? arr[i - 1].total_value : s.total_value;
    return {
      month: monthLabel,
      total: s.total_value,
      change: s.total_value - prev,
    };
  });

  const latestTotal = chartData.length > 0 ? chartData[chartData.length - 1].total : 0;
  const ytdChange = chartData.length > 1
    ? ((chartData[chartData.length - 1].total - chartData[0].total) / chartData[0].total * 100)
    : 0;

  return (
    <div className="space-y-8 anim-in anim-fade anim-up" style={{ animationDuration: "500ms" }}>
      {loading ? (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {[1,2,3].map(i => (
              <div key={i} className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm animate-pulse">
                <div className="flex items-center justify-between">
                  <div className="rounded-lg bg-slate-200 h-10 w-10" />
                  <div className="rounded-full bg-slate-200 h-5 w-16" />
                </div>
                <div className="mt-4 bg-slate-200 h-8 w-32 rounded" />
                <div className="mt-1 bg-slate-200 h-4 w-16 rounded" />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1,2,3,4].map(i => (
              <div key={i} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm animate-pulse">
                <div className="bg-slate-200 h-12 w-12 rounded-xl" />
                <div className="mt-3 bg-slate-200 h-4 w-24 rounded" />
                <div className="mt-1 bg-slate-200 h-3 w-16 rounded" />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6 animate-pulse">
              <div className="bg-slate-200 h-5 w-32 rounded mb-4" />
              <div className="bg-slate-200 h-48 w-full rounded" />
            </div>
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6 animate-pulse">
              <div className="bg-slate-200 h-5 w-32 rounded mb-4" />
              <div className="bg-slate-200 h-48 w-full rounded" />
            </div>
          </div>
        </div>
      ) : (
        <>
      <PageHeader title="仪表盘" description="欢迎回来，这是你的财务与投资总览。" />

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {summaryCards.map((card) => (
          <div key={card.label} className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
            <div className="flex items-center justify-between">
              <div className="rounded-lg bg-slate-100 p-2.5">
                <card.icon className="h-5 w-5 text-slate-600" />
              </div>
              {card.change && (
                <span className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-medium ${
                  card.change.trend === "up" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                }`}>
                  {card.change.trend === "up" ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                  {card.change.change}
                </span>
              )}
            </div>
            <p className="mt-4 text-2xl font-semibold text-gray-900">{formatCNY(card.value / 100)}</p>
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
        {/* Category expense donut */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-gray-900">分类支出占比</h3>
              <p className="text-sm text-gray-500">当月支出按类别分布</p>
            </div>
          </div>
          {donutData.length === 0 ? (
            <p className="text-sm text-gray-400 py-8 text-center">本月暂无支出记录</p>
          ) : (
            <div className="flex items-center gap-6">
              <ResponsiveContainer width="60%" height={220}>
                <PieChart>
                  <Pie
                    data={donutData}
                    cx="50%" cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {donutData.map((entry, idx) => (
                      <Cell key={idx} fill={entry.color} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any) => formatCNY(Number(value) / 100)}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2.5">
                {donutData.map((d) => (
                  <div key={d.name} className="flex items-center gap-2.5 text-sm">
                    <span className="inline-block h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                    <span className="text-gray-700 min-w-[3rem]">{d.name}</span>
                    <span className="text-gray-500">
                      {totalExpenseAmt > 0 ? `${Math.round(d.value / totalExpenseAmt * 100)}%` : "0%"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Total asset trend */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-gray-900">总资产走势</h3>
              <p className="text-sm text-gray-500">资产变化趋势</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-semibold text-gray-900 tabular-nums">{formatCNY(latestTotal)}</p>
              {ytdChange !== 0 && (
                <p className={`text-xs ${ytdChange > 0 ? "text-emerald-600" : "text-red-600"}`}>
                  {ytdChange > 0 ? "+" : ""}{Math.round(ytdChange)}%
                </p>
              )}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={360}>
            <BarChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
              <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 4" vertical={false} />
              <XAxis dataKey="month" axisLine={{ stroke: "#e2e8f0" }} tickLine={false}
                tick={{ fontSize: 12, fill: "#9ca3af" }} dy={4} />
              <YAxis axisLine={false} tickLine={false}
                tick={{ fontSize: 11, fill: "#9ca3af" }} dx={-4}
                tickFormatter={(v: number) => (v >= 0 ? "+" : "") + toWan(Math.abs(v))} />
              <Tooltip content={<ChartTooltip />} cursor={{ stroke: "#cbd5e1", strokeDasharray: "3 3" }} />
              <Bar dataKey="change" barSize={48} radius={[6, 6, 0, 0]} maxBarSize={64}>
                {chartData.map((d, i) => (
                  <Cell key={i} fill={d.change >= 0 ? "#10b981" : "#ef4444"} fillOpacity={0.75} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </>
    )}
    </div>
  );
}
