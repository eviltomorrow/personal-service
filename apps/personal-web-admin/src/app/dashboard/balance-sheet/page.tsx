"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { PageHeader } from "@/components/page-header";
import { formatCNY } from "@/lib/format";
import { api } from "@/lib/api";
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

const MONTH_LABELS = ["", "1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"];

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
  const [items, setItems] = useState<BSApiItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState<ModalState>(null);
  const [modalName, setModalName] = useState("");
  const [modalAmount, setModalAmount] = useState("");
  const [modalNote, setModalNote] = useState("");
  const [modalItemId, setModalItemId] = useState<number | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
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

  useEffect(() => {
    loadData(year, month);
  }, [year, month]);

  async function loadData(y: number, m: number) {
    setLoading(true);
    try {
      const res = await api(`/api/v1/cash-flow/balance-sheet/items?year=${y}&month=${m}`);
      const json = await res.json();
      if (json.code === 0) setItems(json.data);
      else setToast({ type: "error", message: json.message || "加载失败" });
    } catch {
      setToast({ type: "error", message: "网络错误" });
    } finally {
      setLoading(false);
    }
  }

  const groupedData = useMemo(() => {
    const sections: { section: number; category: string }[] = [
      { section: 1, category: "流动资产" },
      { section: 1, category: "固定资产" },
      { section: 2, category: "流动负债" },
      { section: 2, category: "非流动负债" },
      { section: 3, category: "净资产" },
    ];
    return sections.map(({ section, category }) => ({
      category,
      items: items
        .filter(i => i.section === section && i.category === category)
        .sort((a, b) => a.sort_order - b.sort_order)
        .map(i => ({ id: i.id, name: i.name, amount: i.amount })),
    }));
  }, [items]);

  const data = groupedData;

  function navigateMonth(delta: number) {
    const d = new Date(year, month - 1 + delta, 1);
    const ny = d.getFullYear();
    const nm = d.getMonth() + 1;
    setYear(ny);
    setMonth(nm);
    loadData(ny, nm);
  }

  const totalAssets = useMemo(
    () => items.filter(i => i.section === 1).reduce((s, i) => s + i.amount, 0),
    [items],
  );
  const totalLiabilities = useMemo(
    () => items.filter(i => i.section === 2).reduce((s, i) => s + i.amount, 0),
    [items],
  );
  const totalEquity = useMemo(
    () => items.filter(i => i.section === 3).reduce((s, i) => s + i.amount, 0),
    [items],
  );

  const totals = [totalAssets, totalLiabilities, totalEquity];

  function openAdd(group: number) {
    setModalName("");
    setModalAmount("");
    setModalNote("");
    setModalItemId(null);
    setModal({ type: "add", group });
  }

  function openEdit(group: number, item: number) {
    const apiItem = data[group].items[item];
    const src = items.find(i => i.id === (apiItem as any).id);
    setModalName(src?.name ?? "");
    setModalAmount(src ? (src.amount / 100).toFixed(2) : "");
    setModalNote(src?.note ?? "");
    setModalItemId(src?.id ?? null);
    setModal({ type: "edit", group, item });
  }

  async function handleSave() {
    if (!modal) return;
    const n = modalName.trim();
    const amt = Math.round(parseFloat(modalAmount) * 100);
    if (!n || isNaN(amt) || amt <= 0) {
      setToast({ type: "error", message: "请输入有效的项目名称和金额" });
      return;
    }
    const sectionCat = [
      { section: 1, category: "流动资产" },
      { section: 1, category: "固定资产" },
      { section: 2, category: "流动负债" },
      { section: 2, category: "非流动负债" },
      { section: 3, category: "净资产" },
    ][modal.group];
    if (modal.type === "add") {
      try {
        const res = await api("/api/v1/cash-flow/balance-sheet/items", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            section: sectionCat.section,
            category: sectionCat.category,
            name: n,
            amount: amt,
            note: modalNote || undefined,
            date: `${year}-${String(month).padStart(2, "0")}`,
          }),
        });
        const json = await res.json();
        if (json.code === 0 && json.data) {
          setItems(prev => [...prev, json.data]);
          setToast({ type: "success", message: "项目已添加" });
        } else {
          setToast({ type: "error", message: json.message || "添加失败" });
        }
      } catch {
        setToast({ type: "error", message: "网络错误，请重试" });
      }
    } else {
      try {
        const res = await api(`/api/v1/cash-flow/balance-sheet/items/${modalItemId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            section: sectionCat.section,
            category: sectionCat.category,
            name: n,
            amount: amt,
            note: modalNote || undefined,
            date: `${year}-${String(month).padStart(2, "0")}`,
          }),
        });
        const json = await res.json();
        if (json.code === 0 && json.data) {
          setItems(prev => prev.map(i => i.id === json.data.id ? json.data : i));
          setToast({ type: "success", message: "项目已更新" });
        } else {
          setToast({ type: "error", message: json.message || "更新失败" });
        }
      } catch {
        setToast({ type: "error", message: "网络错误，请重试" });
      }
    }
    setModal(null);
  }

  async function handleDelete() {
    if (!modal || modal.type !== "delete") return;
    const apiItem = data[modal.group]?.items[modal.item];
    const itemId = (apiItem as any).id;
    if (!itemId) {
      setModal(null);
      return;
    }
    try {
      const res = await api(`/api/v1/cash-flow/balance-sheet/items/${itemId}`, { method: "DELETE" });
      const json = await res.json();
      if (json.code === 0) {
        setItems(prev => prev.filter(i => i.id !== itemId));
        setToast({ type: "success", message: "项目已删除" });
      } else {
        setToast({ type: "error", message: json.message || "删除失败" });
      }
    } catch {
      setToast({ type: "error", message: "网络错误，请重试" });
    }
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

      {toast && (
        <div className={`flex items-center gap-3 rounded-lg border px-5 py-3 text-sm anim-in anim-fade anim-down ${
          toast.type === "success"
            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
            : "border-red-200 bg-red-50 text-red-700"
        }`}>
          <span className="flex-1">{toast.message}</span>
          <button type="button" onClick={() => setToast(null)}
            className="shrink-0 rounded p-0.5 opacity-60 hover:opacity-100 transition-opacity">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-12 text-sm text-gray-400">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600 mr-2" />
          加载中...
        </div>
      )}

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
                <p className={`text-2xl font-bold ${c.text} tabular-nums`}>{formatCNY(totals[i] / 100)}</p>
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
                      <span className="text-sm font-medium text-gray-900 tabular-nums">{formatCNY(item.amount / 100)}</span>
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
                    <span className={`text-sm font-semibold ${sec.text} tabular-nums`}>{formatCNY(totals[si] / 100)}</span>
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
                <input type="text" value={modalName} onChange={(e) => setModalName(e.target.value)} placeholder="请输入项目名称" autoFocus
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-200/60 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">金额（元）</label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-sm text-gray-400">¥</span>
                  <input type="number" value={modalAmount} onChange={(e) => setModalAmount(e.target.value)} placeholder="0.00" min="0" step="0.01"
                    className="block w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-8 pr-3.5 text-sm text-gray-900 placeholder-gray-400 shadow-xs focus:border-slate-400 focus:ring-2 focus:ring-slate-200/60 focus:outline-none transition-all" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">备注（可选）</label>
                <input type="text" value={modalNote} onChange={(e) => setModalNote(e.target.value)} placeholder="备注信息"
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-200/60 focus:outline-none" />
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
