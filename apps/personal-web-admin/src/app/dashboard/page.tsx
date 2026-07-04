"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/page-header";
import { formatCNY } from "@/lib/format";
import { api } from "@/lib/api";
import {
  Wallet, TrendingUp, ArrowUpRight, ArrowDownRight, BookOpen,
  ArrowRight, LayoutDashboard, BarChart3, Clock,
} from "lucide-react";
import {
  BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
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
  archived?: boolean;
}

interface Category {
  id: number;
  name: string;
  type: "income" | "expense";
}

interface BSApiItem {
  id: number;
  account_id: string;
  section: number;
  category: string;
  name: string;
  amount: number;
  note: string;
  date: string;
  sort_order: number;
  created_at: number;
  updated_at: number;
}

interface MonthlySummary {
  date: string;
  total_assets: number;
  total_liabilities: number;
  total_equity: number;
}

function assetCategoriesDesc(bsItems: BSApiItem[]): string {
  const assetCount = new Set(bsItems.filter(i => i.section === 1).map(i => i.category)).size;
  const liabilityCount = new Set(bsItems.filter(i => i.section === 2).map(i => i.category)).size;
  return `${assetCount} 个资产类别，${liabilityCount} 个负债类别`;
}

function portfolioDesc(positions: Position[]): string {
  const count = positions.filter(p => !p.archived).length;
  return `${count} 个持仓品种`;
}

const DONUT_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-xl border border-gray-200 bg-white/95 backdrop-blur-sm px-4 py-3 shadow-xl text-xs">
      <p className="font-semibold text-gray-900 mb-1.5">{label}</p>
      <div className="flex items-center gap-2">
        <span className="text-gray-500">总值</span>
        <span className="font-semibold text-gray-900 tabular-nums">{formatCNY(d.total)}</span>
      </div>
      {d.change && (
        <div className="flex items-center gap-2 mt-1">
          <span className="text-gray-500">环比</span>
          <span className={`font-medium tabular-nums ${Number(d.change) >= 0 ? "text-emerald-600" : "text-red-500"}`}>
            {Number(d.change) >= 0 ? "+" : ""}{d.change}%
          </span>
        </div>
      )}
    </div>
  );
};

export default function DashboardPage() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [summaries, setSummaries] = useState<MonthlySummary[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [bsItems, setBsItems] = useState<BSApiItem[]>([]);
  const [prevBsItems, setPrevBsItems] = useState<BSApiItem[]>([]);
  const [loading, setLoading] = useState(true);

  function prevMonth(y: number, m: number): [number, number] {
    if (m === 1) return [y - 1, 12];
    return [y, m - 1];
  }

  useEffect(() => {
    const [py, pm] = prevMonth(year, month);
    setLoading(true);
    async function load() {
      const [txRes, posRes, sumRes, catRes, bsRes, prevBsRes] = await Promise.allSettled([
        api(`/api/v1/cash-flow/transactions?year=${year}&month=${month}`).then(r => r.json()),
        api("/api/v1/cash-flow/portfolio/positions").then(r => r.json()),
        api("/api/v1/cash-flow/balance-sheet/summaries?months=12").then(r => r.json()),
        api(`/api/v1/cash-flow/categories?year=${year}&month=${month}`).then(r => r.json()),
        api(`/api/v1/cash-flow/balance-sheet/items?year=${year}&month=${month}`).then(r => r.json()),
        api(`/api/v1/cash-flow/balance-sheet/items?year=${py}&month=${pm}`).then(r => r.json()),
      ]);
      if (txRes.status === "fulfilled" && txRes.value.code === 0) {
        setTransactions(txRes.value.data?.transactions ?? []);
      }
      if (posRes.status === "fulfilled" && posRes.value.code === 0) {
        setPositions(posRes.value.data ?? []);
      }
      if (sumRes.status === "fulfilled" && sumRes.value.code === 0) {
        setSummaries(sumRes.value.data ?? []);
      }
      if (catRes.status === "fulfilled" && catRes.value.code === 0) {
        setCategories(catRes.value.data ?? []);
      }
      if (bsRes.status === "fulfilled" && bsRes.value.code === 0) {
        setBsItems(bsRes.value.data ?? []);
      }
      if (prevBsRes.status === "fulfilled" && prevBsRes.value.code === 0) {
        setPrevBsItems(prevBsRes.value.data ?? []);
      }
      setLoading(false);
    }
    load();
  }, [year, month]);

  const totalIncome = transactions
    .filter(t => t.type === "income")
    .reduce((s, t) => s + t.amount, 0);

  const totalExpense = transactions
    .filter(t => t.type === "expense")
    .reduce((s, t) => s + t.amount, 0);

  const portfolioValue = positions
    .reduce((s, p) => s + p.current_price * p.initial_qty, 0);

  const totalAssets = bsItems
    .filter(i => i.section === 1)
    .reduce((s, i) => s + i.amount, 0);

  const totalLiabilities = bsItems
    .filter(i => i.section === 2)
    .reduce((s, i) => s + i.amount, 0);

  const netEquity = totalAssets - totalLiabilities;

  const prevTotalAssets = prevBsItems
    .filter(i => i.section === 1)
    .reduce((s, i) => s + i.amount, 0);

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
  const assetChange = calcChange(totalAssets, prevTotalAssets || null);

  const summaryCards = [
    { label: "本月资产", value: totalAssets, change: assetChange, icon: BarChart3, bar: "bg-blue-500", iconBg: "bg-blue-100", iconColor: "text-blue-600" },
    { label: "本月收入", value: totalIncome, change: incomeChange, icon: TrendingUp, bar: "bg-emerald-500", iconBg: "bg-emerald-100", iconColor: "text-emerald-600" },
    { label: "本月支出", value: totalExpense, change: expenseChange, icon: Wallet, bar: "bg-red-500", iconBg: "bg-red-100", iconColor: "text-red-600" },
  ];

  const featureCards = [
    { label: "资产负债表", desc: assetCategoriesDesc(bsItems), href: "/dashboard/balance-sheet", icon: BookOpen, color: "from-sky-500 to-blue-600" as const },
    { label: "投资组合", desc: portfolioDesc(positions), href: "/dashboard/portfolio", icon: TrendingUp, color: "from-emerald-500 to-teal-600" as const },
    { label: "收入与支出", desc: `本月结余 ${formatCNY((totalIncome - totalExpense) / 100)}`, href: "/dashboard/cash-flow", icon: Wallet, color: "from-amber-500 to-orange-600" as const },
    { label: "系统设置", desc: "账户与偏好", href: "/dashboard/settings", icon: LayoutDashboard, color: "from-slate-500 to-slate-700" as const },
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

  const chartData = summaries
    .filter(s => s.date <= `${year}-${String(month).padStart(2, "0")}`)
    .map((s, i, arr) => {
    const monthLabel = s.date.length >= 7
      ? `${parseInt(s.date.slice(5, 7))}月`
      : s.date;
    const prev = i > 0 ? arr[i - 1].total_assets / 100 : 0;
    return {
      month: monthLabel,
      total: s.total_assets / 100,
      change: prev > 0 ? ((s.total_assets / 100 - prev) / prev * 100).toFixed(1) : null,
    };
  });

  const latestTotal = chartData.length > 0 ? chartData[chartData.length - 1].total : 0;
  const ytdChange = chartData.length > 1
    ? ((chartData[chartData.length - 1].total - chartData[0].total) / chartData[0].total * 100)
    : 0;

  const equityChartData = summaries
    .filter(s => s.date <= `${year}-${String(month).padStart(2, "0")}`)
    .map(s => ({
      month: s.date.length >= 7 ? `${parseInt(s.date.slice(5, 7))}月` : s.date,
      equity: s.total_equity / 100,
    }));

  const latestEquity = equityChartData.length > 0 ? equityChartData[equityChartData.length - 1].equity : 0;
  const firstEquity = equityChartData.length > 1 ? equityChartData[0].equity : 0;
  const equityChange = firstEquity > 0 ? ((latestEquity - firstEquity) / firstEquity * 100) : 0;

  const bsDonutData = [
    { name: "总资产", value: totalAssets, color: "#3b82f6" },
    { name: "总负债", value: totalLiabilities, color: "#ef4444" },
    { name: "净资产", value: netEquity > 0 ? netEquity : 0, color: "#10b981" },
  ].filter(d => d.value > 0);

  const bsDonutTotal = bsDonutData.reduce((s, d) => s + d.value, 0);

  return (
    <div className="space-y-8 anim-in anim-fade anim-up" style={{ animationDuration: "500ms" }}>
      {loading ? (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {[1,2,3].map(i => (
              <div key={i} className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden animate-pulse">
                <div className="h-1 bg-slate-200" />
                <div className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="rounded-lg bg-slate-200 h-9 w-9" />
                    <div className="rounded-full bg-slate-200 h-5 w-16" />
                  </div>
                  <div className="bg-slate-200 h-8 w-32 rounded" />
                  <div className="mt-1 bg-slate-200 h-4 w-16 rounded" />
                </div>
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
      <PageHeader title="仪表盘" description="财务与投资总览。"
        actions={
          <div className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 shadow-sm">
            <Clock className="h-4 w-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-900 select-none tabular-nums">
              {now.getFullYear()}.{String(now.getMonth() + 1).padStart(2, "0")}.{String(now.getDate()).padStart(2, "0")} · {["周日", "周一", "周二", "周三", "周四", "周五", "周六"][now.getDay()]} · {String(now.getHours()).padStart(2, "0")}:{String(now.getMinutes()).padStart(2, "0")}:{String(now.getSeconds()).padStart(2, "0")}
            </span>
          </div>
        }
      />

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {summaryCards.map((card) => (
          <div key={card.label} className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all">
            <div className={`h-1 ${card.bar}`} />
            <div className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className={`rounded-lg ${card.iconBg} p-2`}>
                  <card.icon className={`h-5 w-5 ${card.iconColor}`} />
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
              <p className="text-2xl font-bold text-gray-900 tabular-nums">{formatCNY(card.value / 100)}</p>
              <p className="mt-0.5 text-sm text-gray-500">{card.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Feature entry cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {featureCards.map((card) => (
          <a key={card.label} href={card.href}
            className="group flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${card.color} shadow-sm transition-all duration-200 group-hover:scale-110 group-hover:shadow-md`}>
              <card.icon className="h-6 w-6 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-gray-900 group-hover:text-slate-700 transition-colors">{card.label}</p>
              <p className="text-xs text-gray-500 mt-0.5">{card.desc}</p>
            </div>
            <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-gray-500 transition-colors shrink-0 group-hover:translate-x-0.5 transition-transform" />
          </a>
        ))}
      </div>

      {/* Bottom section */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Category expense donut */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6 hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="h-4 w-1 rounded-full bg-slate-400" />
              <div>
                <h3 className="text-sm font-semibold text-gray-900">分类支出占比</h3>
                <p className="text-xs text-gray-500 mt-0.5">当月支出按类别分布</p>
              </div>
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
                    isAnimationActive={false}
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
              <div className="space-y-3">
                {donutData.map((d) => (
                  <div key={d.name} className="flex items-center gap-2.5 text-sm">
                    <span className="inline-block h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                    <span className="text-gray-700 min-w-[3.5rem]">{d.name}</span>
                    <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${d.value / totalExpenseAmt * 100}%`, backgroundColor: d.color }} />
                    </div>
                    <span className="text-xs font-medium text-gray-600 w-10 text-right tabular-nums">
                      {Math.round(d.value / totalExpenseAmt * 100)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Asset/Liability structure */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6 hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="h-4 w-1 rounded-full bg-slate-400" />
              <div>
                <h3 className="text-sm font-semibold text-gray-900">资产与负债对比</h3>
                <p className="text-xs text-gray-500 mt-0.5">当月资产与负债总额</p>
              </div>
            </div>
          </div>
          {bsDonutData.length === 0 ? (
            <p className="text-sm text-gray-400 py-8 text-center">暂无数据</p>
          ) : (
            <div className="flex items-center gap-6">
              <ResponsiveContainer width="60%" height={220}>
                <PieChart>
                  <Pie data={bsDonutData} cx="50%" cy="50%" isAnimationActive={false}
                    innerRadius={55} outerRadius={85} paddingAngle={2} dataKey="value">
                    {bsDonutData.map((entry, idx) => (
                      <Cell key={idx} fill={entry.color} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any) => formatCNY(Number(value) / 100)} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-3">
                {bsDonutData.map((d) => (
                  <div key={d.name} className="flex items-center gap-2.5 text-sm">
                    <span className="inline-block h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                    <span className="text-gray-700 min-w-[3.5rem]">{d.name}</span>
                    <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${d.value / bsDonutTotal * 100}%`, backgroundColor: d.color }} />
                    </div>
                    <span className="text-xs font-medium text-gray-600 w-10 text-right tabular-nums">
                      {Math.round(d.value / bsDonutTotal * 100)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Total asset trend */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6 hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="h-4 w-1 rounded-full bg-slate-400" />
              <div>
                <h3 className="text-sm font-semibold text-gray-900">总资产走势</h3>
                <p className="text-xs text-gray-500 mt-0.5">资产变化趋势</p>
              </div>
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
                tickFormatter={(v: number) => `${(v / 10000).toFixed(v >= 1000000 ? 0 : 1)}万`} />
              <Tooltip content={<ChartTooltip />} cursor={{ stroke: "#cbd5e1", strokeDasharray: "3 3" }} />
              <Bar dataKey="total" barSize={48} radius={[6, 6, 0, 0]} maxBarSize={64} fill="#3b82f6" fillOpacity={0.75} />
            </BarChart>
          </ResponsiveContainer>
        </div>

      </div>
    </>
    )}
    </div>
  );
}
