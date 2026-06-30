"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { PageHeader } from "@/components/page-header";
import { formatCNY } from "@/lib/format";
import {
  Wallet, Landmark, TrendingUp, Plus, Pencil, Trash2, X, AlertTriangle,
  ChevronLeft, ChevronRight,
} from "lucide-react";

interface BalanceItem {
  name: string;
  amount: number;
}

interface BalanceGroup {
  category: string;
  items: BalanceItem[];
}

function createDefaultData(): BalanceGroup[] {
  return [
    {
      category: "流动资产",
      items: [
        { name: "现金及银行存款", amount: 285000 },
        { name: "应收账款", amount: 128000 },
        { name: "存货", amount: 96000 },
        { name: "短期投资", amount: 50000 },
      ],
    },
    {
      category: "固定资产",
      items: [
        { name: "房屋及建筑物", amount: 320000 },
        { name: "机器设备", amount: 100000 },
        { name: "长期投资", amount: 180000 },
        { name: "无形资产", amount: 62500 },
        { name: "长期待摊费用", amount: 65000 },
      ],
    },
    {
      category: "流动负债",
      items: [
        { name: "应付账款", amount: 156000 },
        { name: "短期借款", amount: 100000 },
        { name: "应付职工薪酬", amount: 38400 },
      ],
    },
    {
      category: "非流动负债",
      items: [
        { name: "长期借款", amount: 180000 },
        { name: "应付债券", amount: 49000 },
      ],
    },
    {
      category: "净资产",
      items: [
        { name: "实收资本", amount: 500000 },
        { name: "资本公积", amount: 120000 },
        { name: "未分配利润", amount: 143100 },
      ],
    },
  ];
}

const MONTH_LABELS = ["", "1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"];

function getMonthKey(year: number, month: number) {
  return `${year}-${String(month).padStart(2, "0")}`;
}

type ModalState =
  | { type: "add"; group: number }
  | { type: "edit"; group: number; item: number }
  | { type: "delete"; group: number; item: number }
  | null;

const summaryMeta = [
  { key: "assets", label: "总资产", icon: Wallet, color: "blue", bar: "bg-blue-500" },
  { key: "liabilities", label: "总负债", icon: Landmark, color: "orange", bar: "bg-orange-500" },
  { key: "equity", label: "净资产", icon: TrendingUp, color: "emerald", bar: "bg-emerald-500" },
] as const;

const summaryColors = {
  blue: { text: "text-blue-700", bg: "bg-blue-50", icon: "text-blue-600", iconBg: "bg-blue-100" },
  orange: { text: "text-orange-700", bg: "bg-orange-50", icon: "text-orange-600", iconBg: "bg-orange-100" },
  emerald: { text: "text-emerald-700", bg: "bg-emerald-50", icon: "text-emerald-600", iconBg: "bg-emerald-100" },
};

const sectionMeta = [
  { label: "资产合计", indicator: "bg-blue-500", text: "text-blue-700", bg: "bg-blue-50" },
  { label: "负债合计", indicator: "bg-orange-500", text: "text-orange-700", bg: "bg-orange-50" },
  { label: "净资产合计", indicator: "bg-emerald-500", text: "text-emerald-700", bg: "bg-emerald-50" },
];

export default function BalanceSheetPage() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [monthData, setMonthData] = useState<Record<string, BalanceGroup[]>>({
    [getMonthKey(today.getFullYear(), today.getMonth() + 1)]: createDefaultData(),
  });
  const [modal, setModal] = useState<ModalState>(null);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");

  const monthKey = getMonthKey(year, month);
  const data = monthData[monthKey] ?? createDefaultData();
  const [monthPickerOpen, setMonthPickerOpen] = useState(false);
  const monthPickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (monthPickerRef.current && !monthPickerRef.current.contains(e.target as Node)) {
        setMonthPickerOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function navigateMonth(delta: number) {
    const d = new Date(year, month - 1 + delta, 1);
    const ny = d.getFullYear();
    const nm = d.getMonth() + 1;
    const nk = getMonthKey(ny, nm);
    setYear(ny);
    setMonth(nm);
    if (!monthData[nk]) {
      setMonthData((prev) => ({ ...prev, [nk]: prev[monthKey].map((g) => ({ ...g, items: [...g.items] })) }));
    }
  }

  const totalAssets = useMemo(
    () => data.slice(0, 2).flatMap((g) => g.items).reduce((s, i) => s + i.amount, 0),
    [data],
  );
  const totalLiabilities = useMemo(
    () => data.slice(2, 4).flatMap((g) => g.items).reduce((s, i) => s + i.amount, 0),
    [data],
  );
  const totalEquity = useMemo(
    () => data.slice(4).flatMap((g) => g.items).reduce((s, i) => s + i.amount, 0),
    [data],
  );

  const totals = [totalAssets, totalLiabilities, totalEquity];

  function openAdd(group: number) {
    setName("");
    setAmount("");
    setModal({ type: "add", group });
  }

  function openEdit(group: number, item: number) {
    setName(data[group].items[item].name);
    setAmount(String(data[group].items[item].amount));
    setModal({ type: "edit", group, item });
  }

  function handleSave() {
    if (!modal) return;
    const n = name.trim();
    const a = Number(amount);
    if (!n || isNaN(a) || a <= 0) return;

    setMonthData((prev) => {
      const src = prev[monthKey];
      const next = src.map((g) => ({ ...g, items: [...g.items] }));
      if (modal.type === "add") {
        next[modal.group].items.push({ name: n, amount: a });
      } else {
        next[modal.group].items[modal.item] = { name: n, amount: a };
      }
      return { ...prev, [monthKey]: next };
    });
    setModal(null);
  }

  function handleDelete() {
    if (!modal || modal.type !== "delete") return;
    setMonthData((prev) => {
      const src = prev[monthKey];
      const next = src.map((g) => ({ ...g, items: [...g.items] }));
      next[modal.group].items.splice(modal.item, 1);
      return { ...prev, [monthKey]: next };
    });
    setModal(null);
  }

  function sectionIndex(gi: number) {
    if (gi <= 1) return 0;
    if (gi <= 3) return 1;
    return 2;
  }

  return (
    <div className="space-y-6 anim-in anim-fade anim-up" style={{ animationDuration: "500ms" }}>
      <PageHeader
        title="资产负债表"
        description="个人资产负债总览"
        actions={
          <div className="relative" ref={monthPickerRef}>
            <div className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 shadow-sm">
              <button type="button" onClick={() => navigateMonth(-1)}
                className="rounded p-0.5 text-gray-400 hover:text-gray-700 transition-colors">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button type="button" onClick={() => setMonthPickerOpen(!monthPickerOpen)}
                className="text-sm font-medium text-gray-900 select-none min-w-[72px] text-center hover:text-slate-600 transition-colors">
                {year}年{MONTH_LABELS[month]}
              </button>
              <button type="button" onClick={() => navigateMonth(1)}
                className="rounded p-0.5 text-gray-400 hover:text-gray-700 transition-colors">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            {monthPickerOpen && (
              <div className="absolute right-0 top-full mt-2 w-64 rounded-xl border border-gray-200 bg-white shadow-xl z-50 p-4"
                style={{ animationDuration: "200ms" }}>
                <div className="flex items-center justify-between mb-3">
                  <button type="button" onClick={() => { const d = new Date(year - 1, month - 1, 1); setYear(d.getFullYear()); }}
                    className="rounded p-1 text-gray-400 hover:text-gray-700 transition-colors">
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="text-sm font-semibold text-gray-900">{year}年</span>
                  <button type="button" onClick={() => { const d = new Date(year + 1, month - 1, 1); setYear(d.getFullYear()); }}
                    className="rounded p-1 text-gray-400 hover:text-gray-700 transition-colors">
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-1">
                  {MONTH_LABELS.filter(Boolean).map((label, i) => {
                    const m = i + 1;
                    const isCurrent = m === month;
                    return (
                      <button
                        key={m}
                        type="button"
                        onClick={() => { setMonth(m); setMonthPickerOpen(false); }}
                        className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                          isCurrent
                            ? "bg-slate-700 text-white"
                            : "text-gray-600 hover:bg-gray-100"
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {summaryMeta.map((meta, i) => {
          const c = summaryColors[meta.color];
          return (
            <div key={meta.key} className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
              <div className={`h-1 ${meta.bar}`} />
              <div className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className={`rounded-lg ${c.iconBg} p-2`}>
                    <meta.icon className={`h-5 w-5 ${c.icon}`} />
                  </div>
                </div>
                <p className={`text-2xl font-bold ${c.text} tabular-nums`}>{formatCNY(totals[i])}</p>
                <p className="mt-0.5 text-sm text-gray-500">{meta.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        {data.map((group, gi) => {
          const si = sectionIndex(gi);
          const sec = sectionMeta[si];
          const isLastInSection = si === 0 ? gi === 1 : si === 1 ? gi === 3 : gi === 4;

          return (
            <div key={group.category}>
              {gi > 0 && <div className="h-px bg-gray-100" />}
              <div className="px-5 py-3 flex items-center gap-3 bg-gray-50/80">
                <div className={`w-1 h-4 rounded-full ${sec.indicator}`} />
                <span className="text-sm font-semibold text-gray-800">{group.category}</span>
                <button
                  type="button"
                  onClick={() => openAdd(gi)}
                  className="ml-auto rounded p-1 text-gray-300 hover:text-slate-500 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="divide-y divide-gray-50">
                {group.items.length === 0 && (
                  <p className="px-5 py-3 text-sm text-gray-400">暂无数据</p>
                )}
                {group.items.map((item, ii) => (
                  <div
                    key={`${gi}-${ii}`}
                    className="group flex items-center justify-between px-5 py-2.5 hover:bg-gray-50/50 transition-colors"
                  >
                    <span className="text-sm text-gray-700">{item.name}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-gray-900 tabular-nums">{formatCNY(item.amount)}</span>
                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={() => openEdit(gi, ii)}
                          className="rounded p-0.5 text-gray-300 hover:text-slate-500 transition-colors"
                        >
                          <Pencil className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setModal({ type: "delete", group: gi, item: ii })}
                          className="rounded p-0.5 text-gray-300 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {isLastInSection && (
                <div className={`px-5 py-2.5 flex items-center justify-between ${sec.bg} border-t border-gray-100`}>
                  <span className={`text-sm font-semibold ${sec.text}`}>{sec.label}</span>
                  <div className="flex items-center gap-3">
                    <span className={`text-sm font-semibold ${sec.text} tabular-nums`}>{formatCNY(totals[si])}</span>
                    <div className="w-[34px]" />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add/Edit Modal */}
      {(modal?.type === "add" || modal?.type === "edit") && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh] bg-black/5" onClick={() => setModal(null)}>
          <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white shadow-xl anim-in anim-fade anim-down" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-base font-semibold text-gray-900">
                {modal.type === "add" ? "添加项目" : "编辑项目"}
              </h3>
              <button type="button" onClick={() => setModal(null)} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">项目名称</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="请输入项目名称" autoFocus
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-200/60 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">金额（元）</label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-sm text-gray-400">¥</span>
                  <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" min="0" step="0.01"
                    className="block w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-8 pr-3.5 text-sm text-gray-900 placeholder-gray-400 shadow-xs focus:border-slate-400 focus:ring-2 focus:ring-slate-200/60 focus:outline-none transition-all" />
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 pt-2">
                <button type="button" onClick={() => setModal(null)} className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors">取消</button>
                <button type="submit" className="rounded-lg px-4 py-2 text-sm font-medium text-white bg-slate-600 hover:bg-slate-500 transition-colors">保存</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {modal?.type === "delete" && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[18vh] bg-black/5" onClick={() => setModal(null)}>
          <div className="w-full max-w-sm rounded-xl border border-gray-200 bg-white shadow-xl anim-in anim-fade anim-down" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 mx-auto">
                <AlertTriangle className="h-6 w-6 text-red-500" />
              </div>
              <h3 className="mt-4 text-center text-base font-semibold text-gray-900">确认删除</h3>
              <p className="mt-2 text-center text-sm text-gray-500">
                确定要删除「{data[modal.group]?.items[modal.item]?.name}」吗？
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 pb-6">
              <button type="button" onClick={() => setModal(null)} className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors">取消</button>
              <button type="button" onClick={handleDelete} className="rounded-lg px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-500 transition-colors">删除</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
