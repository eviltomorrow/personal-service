"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { PageHeader } from "@/components/page-header";
import { formatCNY } from "@/lib/format";
import { api } from "@/lib/api";
import {
  Wallet, TrendingUp, Plus, Pencil, Trash2, X, AlertTriangle,
  ChevronLeft, ChevronRight, ArrowUpRight, ArrowDownRight,
} from "lucide-react";

interface CashFlowItem {
  id: number;
  name: string;
  amount: number;
  date: string;
  note?: string;
}

interface CashFlowCategory {
  id: number;
  category: string;
  items: CashFlowItem[];
}

interface Category {
  id: number;
  account_id: string;
  name: string;
  type: "income" | "expense";
  sort_order: number;
  date: string;
  created_at: number;
  updated_at: number;
}

interface Transaction {
  id: number;
  account_id: string;
  category_id: number;
  type: "income" | "expense";
  name: string;
  amount: number;
  date: string;
  note: string;
  sort_order: number;
  created_at: number;
  updated_at: number;
}

const MONTH_LABELS = ["", "1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"];

export default function CashFlowPage() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState<{
    type: "add-item" | "edit-item" | "delete-item" | "add-category" | "delete-category";
    section: "income" | "expense";
    catIndex?: number;
    itemIndex?: number;
  } | null>(null);
  const [modalName, setModalName] = useState("");
  const [modalAmount, setModalAmount] = useState("");
  const [modalCatId, setModalCatId] = useState<number | null>(null);
  const [modalDate, setModalDate] = useState("");
  const [modalNote, setModalNote] = useState("");
  const [modalItemId, setModalItemId] = useState<number | null>(null);
  const [monthPickerOpen, setMonthPickerOpen] = useState(false);
  const [prevTransactions, setPrevTransactions] = useState<Transaction[]>([]);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
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

  function displayAmount(cents: number) {
    return displayAmount(cents / 100);
  }

  function prevMonth(y: number, m: number): [number, number] {
    if (m === 1) return [y - 1, 12];
    return [y, m - 1];
  }

  async function loadData(year: number, month: number) {
    setLoading(true);
    try {
      const [py, pm] = prevMonth(year, month);
      const [catRes, txRes, prevTxRes] = await Promise.all([
        api(`/api/v1/finance/categories?year=${year}&month=${month}`),
        api(`/api/v1/finance/transactions?year=${year}&month=${month}`),
        api(`/api/v1/finance/transactions?year=${py}&month=${pm}`),
      ]);
      const catJson = await catRes.json();
      const txJson = await txRes.json();
      const prevTxJson = await prevTxRes.json();
      if (catJson.code === 0) setCategories(catJson.data);
      if (txJson.code === 0) setTransactions(txJson.data.transactions);
      if (prevTxJson.code === 0) setPrevTransactions(prevTxJson.data.transactions);
    } catch {
      setToast({ type: "error", message: "加载数据失败" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData(year, month);
  }, [year, month]);

  function itemsOfCategory(ts: Transaction[], catId: number): CashFlowItem[] {
    return ts
      .filter((t) => t.category_id === catId)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((t) => ({ id: t.id, name: t.name, amount: t.amount, date: t.date, note: t.note, sortOrder: t.sort_order }));
  }

  const incomeCategories = useMemo(
    () => categories
      .filter((c) => c.type === "income")
      .map((c) => ({
        id: c.id,
        category: c.name,
        items: itemsOfCategory(transactions, c.id),
      })),
    [categories, transactions]
  );

  const expenseCategories = useMemo(
    () => categories
      .filter((c) => c.type === "expense")
      .map((c) => ({
        id: c.id,
        category: c.name,
        items: itemsOfCategory(transactions, c.id),
      })),
    [categories, transactions]
  );

  const totalIncome = useMemo(
    () => transactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0),
    [transactions]
  );

  const totalExpense = useMemo(
    () => transactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0),
    [transactions]
  );

  const netBalance = totalIncome - totalExpense;

  const prevTotalIncome = useMemo(
    () => prevTransactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0),
    [prevTransactions]
  );
  const prevTotalExpense = useMemo(
    () => prevTransactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0),
    [prevTransactions]
  );

  function navigateMonth(delta: number) {
    const d = new Date(year, month - 1 + delta, 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth() + 1);
  }

  function calcChange(current: number, previous: number): string | null {
    if (previous === 0) return null;
    const pct = ((current - previous) / previous) * 100;
    return `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`;
  }

  function openAddItem(section: "income" | "expense", catIndex: number) {
    const cat = section === "income" ? incomeCategories[catIndex] : expenseCategories[catIndex];
    setModalName("");
    setModalAmount("");
    setModalDate(new Date().toISOString().slice(0, 10));
    setModalNote("");
    setModalCatId(cat?.id ?? null);
    setModalItemId(null);
    setModal({ type: "add-item", section, catIndex });
  }

  function openEditItem(section: "income" | "expense", catIndex: number, itemIndex: number) {
    const cat = section === "income" ? incomeCategories[catIndex] : expenseCategories[catIndex];
    const item = cat.items[itemIndex];
    setModalName(item.name);
    setModalAmount((item.amount / 100).toFixed(2));
    setModalDate(item.date);
    setModalNote(item.note ?? "");
    setModalCatId(cat.id);
    setModalItemId(item.id);
    setModal({ type: "edit-item", section, catIndex, itemIndex });
  }

  function openAddCategory(section: "income" | "expense") {
    setModalName("");
    setModal({ type: "add-category", section });
    setModalAmount("");
  }

  function openDeleteCategory(section: "income" | "expense", categoryId: number) {
    setModalCatId(categoryId);
    setModal({ type: "delete-category", section });
  }

  async function handleSave() {
    const name = modalName.trim();
    const amt = Math.round(parseFloat(modalAmount) * 100);
    if (modal?.type === "add-category") {
      if (!name) {
        setToast({ type: "error", message: "请输入分类名称" });
        return;
      }
      const catDate = `${year}-${String(month).padStart(2, "0")}`;
      try {
        const res = await api(`/api/v1/finance/categories?date=${catDate}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, type: modal.section === "income" ? "income" : "expense", sort_order: 0 }),
        });
        const json = await res.json();
        if (json.code === 0 && json.data) {
          setCategories((prev) => [...prev, json.data]);
          setToast({ type: "success", message: "分类已添加" });
        } else {
          setToast({ type: "error", message: json.message || "添加分类失败" });
        }
      } catch {
        setToast({ type: "error", message: "网络错误，请重试" });
      }
      setModal(null);
      return;
    }
    if (modal?.type === "add-item") {
      if (!name) { setToast({ type: "error", message: "请输入项目名称" }); return; }
      if (isNaN(amt) || amt <= 0) { setToast({ type: "error", message: "请输入有效的金额" }); return; }
      try {
        const res = await api("/api/v1/finance/transactions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            category_id: modalCatId,
            type: modal.section === "income" ? "income" : "expense",
            name,
            amount: amt,
            date: modalDate,
            note: modalNote || undefined,
          }),
        });
        const json = await res.json();
        if (json.code === 0 && json.data) {
          setTransactions((prev) => [...prev, json.data]);
          setToast({ type: "success", message: "记录已添加" });
        } else {
          setToast({ type: "error", message: json.message || "添加失败" });
        }
      } catch {
        setToast({ type: "error", message: "网络错误，请重试" });
      }
      setModal(null);
      return;
    }
    if (modal?.type === "edit-item") {
      if (!name) { setToast({ type: "error", message: "请输入项目名称" }); return; }
      if (isNaN(amt) || amt <= 0) { setToast({ type: "error", message: "请输入有效的金额" }); return; }
      try {
        const res = await api(`/api/v1/finance/transactions/${modalItemId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            category_id: modalCatId,
            type: modal.section === "income" ? "income" : "expense",
            name,
            amount: amt,
            date: modalDate,
            note: modalNote || undefined,
          }),
        });
        const json = await res.json();
        if (json.code === 0 && json.data) {
          setTransactions((prev) => prev.map((t) => t.id === json.data.id ? json.data : t));
          setToast({ type: "success", message: "记录已更新" });
        } else {
          setToast({ type: "error", message: json.message || "更新失败" });
        }
      } catch {
        setToast({ type: "error", message: "网络错误，请重试" });
      }
      setModal(null);
      return;
    }
    setModal(null);
  }

  async function handleDelete() {
    if (!modal) return;
    if (modal.type === "delete-category" && modalCatId !== null) {
      try {
        const res = await api(`/api/v1/finance/categories/${modalCatId}`, { method: "DELETE" });
        const json = await res.json();
        if (json.code === 0) {
          setCategories((prev) => prev.filter((c) => c.id !== modalCatId));
          setTransactions((prev) => prev.filter((t) => t.category_id !== modalCatId));
          setToast({ type: "success", message: "分类已删除" });
        } else {
          setToast({ type: "error", message: json.message || "删除失败" });
        }
      } catch {
        setToast({ type: "error", message: "网络错误，请重试" });
      }
      setModal(null);
      return;
    }
    if (modal.type === "delete-item" && modalItemId !== null) {
      try {
        const res = await api(`/api/v1/finance/transactions/${modalItemId}`, { method: "DELETE" });
        const json = await res.json();
        if (json.code === 0) {
          setTransactions((prev) => prev.filter((t) => t.id !== modalItemId));
          setToast({ type: "success", message: "记录已删除" });
        } else {
          setToast({ type: "error", message: json.message || "删除失败" });
        }
      } catch {
        setToast({ type: "error", message: "网络错误，请重试" });
      }
      setModal(null);
      return;
    }
    setModal(null);
  }

  function getCategoryList(section: "income" | "expense"): CashFlowCategory[] {
    return section === "income" ? incomeCategories : expenseCategories;
  }

  return (
    <div className="space-y-6 anim-in anim-fade anim-up" style={{ animationDuration: "500ms" }}>
      <PageHeader
        title="收入与支出"
        description="月度收入与支出明细"
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
                  <button type="button" onClick={() => setYear(y => y - 1)}
                    className="rounded p-1 text-gray-400 hover:text-gray-700 transition-colors">
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="text-sm font-semibold text-gray-900">{year}年</span>
                  <button type="button" onClick={() => setYear(y => y + 1)}
                    className="rounded p-1 text-gray-400 hover:text-gray-700 transition-colors">
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-1">
                  {MONTH_LABELS.filter(Boolean).map((label, i) => {
                    const m = i + 1;
                    const isCurrent = m === month;
                    return (
                      <button key={m} type="button"
                        onClick={() => { setMonth(m); setMonthPickerOpen(false); }}
                        className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                          isCurrent ? "bg-slate-700 text-white" : "text-gray-600 hover:bg-gray-100"
                        }`}>
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
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="h-1 bg-emerald-500" />
          <div className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="rounded-lg bg-emerald-100 p-2">
                <TrendingUp className="h-5 w-5 text-emerald-600" />
              </div>
              {(() => {
                const change = calcChange(totalIncome, prevTotalIncome);
                return change !== null ? (
                  <span className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-medium ${
                    change.startsWith("+")
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-red-50 text-red-700"
                  }`}>
                    {change.startsWith("+") ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                    {change}
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-gray-50 text-gray-400">-</span>
                );
              })()}
            </div>
            <p className="text-2xl font-bold text-emerald-700 tabular-nums">
              {totalIncome > 0 ? displayAmount(totalIncome) : "¥ 0.00"}
            </p>
            <p className="mt-0.5 text-sm text-gray-500">总收入</p>
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="h-1 bg-red-500" />
          <div className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="rounded-lg bg-red-100 p-2">
                <Wallet className="h-5 w-5 text-red-600" />
              </div>
              {(() => {
                const change = calcChange(totalExpense, prevTotalExpense);
                return change !== null ? (
                  <span className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-medium ${
                    change.startsWith("+")
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-red-50 text-red-700"
                  }`}>
                    {change.startsWith("+") ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                    {change}
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-gray-50 text-gray-400">-</span>
                );
              })()}
            </div>
            <p className="text-2xl font-bold text-red-700 tabular-nums">
              {totalExpense > 0 ? displayAmount(totalExpense) : "¥ 0.00"}
            </p>
            <p className="mt-0.5 text-sm text-gray-500">总支出</p>
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className={`h-1 ${netBalance >= 0 ? "bg-blue-500" : "bg-red-500"}`} />
          <div className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className={`rounded-lg p-2 ${netBalance >= 0 ? "bg-blue-100" : "bg-red-100"}`}>
                <TrendingUp className={`h-5 w-5 ${netBalance >= 0 ? "text-blue-600" : "text-red-600"}`} />
              </div>
              {(() => {
                const prevNetBalance = prevTotalIncome - prevTotalExpense;
                const change = calcChange(netBalance, prevNetBalance);
                return change !== null ? (
                  <span className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-medium ${
                    change.startsWith("+")
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-red-50 text-red-700"
                  }`}>
                    {change.startsWith("+") ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                    {change}
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-gray-50 text-gray-400">-</span>
                );
              })()}
            </div>
            <p className={`text-2xl font-bold tabular-nums ${netBalance >= 0 ? "text-blue-700" : "text-red-700"}`}>
              {displayAmount(netBalance)}
            </p>
            <p className="mt-0.5 text-sm text-gray-500">净结余</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Income section */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="px-5 py-3 flex items-center gap-3 bg-emerald-50/80">
            <div className="w-1 h-4 rounded-full bg-emerald-500" />
            <span className="text-sm font-semibold text-gray-800">💰 收入</span>
            <button type="button" onClick={() => openAddCategory("income")}
              className="ml-auto rounded p-1 text-gray-300 hover:text-slate-500 transition-colors">
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="divide-y divide-gray-50">
            {incomeCategories.length === 0 && (
              <p className="px-5 py-3 text-sm text-gray-400">暂无分类，点击 + 添加</p>
            )}
            {incomeCategories.map((cat, ci) => {
              const catTotal = cat.items.reduce((s, i) => s + i.amount, 0);
              return (
                <div key={cat.id}>
                  {/* Category header */}
                  <div className="group flex items-center justify-between px-5 py-2.5 bg-gray-50/50">
                    <span className="text-sm font-semibold text-gray-700">{cat.category}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-emerald-600 tabular-nums w-24 text-right">{displayAmount(catTotal)}</span>
                      <div className="w-[34px] flex items-center justify-center">
                        <button type="button" onClick={() => openAddItem("income", ci)}
                          className="rounded p-0.5 text-gray-300 hover:text-slate-500 transition-colors">
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                        <button type="button" onClick={() => openDeleteCategory("income", incomeCategories[ci].id)}
                        className="rounded p-0.5 text-gray-300 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 transition-opacity">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                  {/* Items */}
                  {cat.items.length === 0 && (
                    <p className="px-8 py-2 text-xs text-gray-400">暂无记录</p>
                  )}
                  {cat.items.map((item, ii) => (
                    <div key={`${cat.id}-${item.id}`}
                      className="group flex items-center justify-between pl-8 pr-5 py-2 hover:bg-gray-50/50 transition-colors">
                      <span className="text-sm text-gray-600">{item.name}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-emerald-600 tabular-nums w-24 text-right">{displayAmount(item.amount)}</span>
                        <div className="w-[34px] flex items-center justify-center">
                          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button type="button" onClick={() => openEditItem("income", ci, ii)}
                              className="rounded p-0.5 text-gray-300 hover:text-slate-500 transition-colors">
                              <Pencil className="h-3 w-3" />
                            </button>
                            <button type="button" onClick={() => { setModalItemId(incomeCategories[ci].items[ii].id); setModal({ type: "delete-item", section: "income", catIndex: ci, itemIndex: ii }); }}
                              className="rounded p-0.5 text-gray-300 hover:text-red-400 transition-colors">
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
          <div className="px-5 py-2.5 flex items-center justify-between bg-emerald-50/80 border-t border-gray-100">
            <span className="text-sm font-semibold text-emerald-700">小计</span>
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-emerald-700 tabular-nums w-24 text-right">{displayAmount(totalIncome)}</span>
              <div className="w-[34px]" />
            </div>
          </div>
        </div>

        {/* Expense section */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="px-5 py-3 flex items-center gap-3 bg-red-50/80">
            <div className="w-1 h-4 rounded-full bg-red-500" />
            <span className="text-sm font-semibold text-gray-800">💸 支出</span>
            <button type="button" onClick={() => openAddCategory("expense")}
              className="ml-auto rounded p-1 text-gray-300 hover:text-slate-500 transition-colors">
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="divide-y divide-gray-50">
            {expenseCategories.length === 0 && (
              <p className="px-5 py-3 text-sm text-gray-400">暂无分类，点击 + 添加</p>
            )}
            {expenseCategories.map((cat, ci) => {
              const catTotal = cat.items.reduce((s, i) => s + i.amount, 0);
              return (
                <div key={cat.id}>
                  {/* Category header */}
                  <div className="group flex items-center justify-between px-5 py-2.5 bg-gray-50/50">
                    <span className="text-sm font-semibold text-gray-700">{cat.category}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-red-600 tabular-nums w-24 text-right">{displayAmount(catTotal)}</span>
                      <div className="w-[34px] flex items-center justify-center">
                        <button type="button" onClick={() => openAddItem("expense", ci)}
                          className="rounded p-0.5 text-gray-300 hover:text-slate-500 transition-colors">
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                        <button type="button" onClick={() => openDeleteCategory("expense", expenseCategories[ci].id)}
                        className="rounded p-0.5 text-gray-300 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 transition-opacity">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                  {/* Items */}
                  {cat.items.length === 0 && (
                    <p className="px-8 py-2 text-xs text-gray-400">暂无记录</p>
                  )}
                  {cat.items.map((item, ii) => (
                    <div key={`${cat.id}-${item.id}`}
                      className="group flex items-center justify-between pl-8 pr-5 py-2 hover:bg-gray-50/50 transition-colors">
                      <span className="text-sm text-gray-600">{item.name}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-red-600 tabular-nums w-24 text-right">{displayAmount(item.amount)}</span>
                        <div className="w-[34px] flex items-center justify-center">
                          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button type="button" onClick={() => openEditItem("expense", ci, ii)}
                              className="rounded p-0.5 text-gray-300 hover:text-slate-500 transition-colors">
                              <Pencil className="h-3 w-3" />
                            </button>
                            <button type="button" onClick={() => { setModalItemId(expenseCategories[ci].items[ii].id); setModal({ type: "delete-item", section: "expense", catIndex: ci, itemIndex: ii }); }}
                              className="rounded p-0.5 text-gray-300 hover:text-red-400 transition-colors">
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
          <div className="px-5 py-2.5 flex items-center justify-between bg-red-50/80 border-t border-gray-100">
            <span className="text-sm font-semibold text-red-700">小计</span>
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-red-700 tabular-nums w-24 text-right">{displayAmount(totalExpense)}</span>
              <div className="w-[34px]" />
            </div>
          </div>
        </div>
      </div>

      {/* Add Category Modal */}
      {modal?.type === "add-category" && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh] bg-black/5" onClick={() => setModal(null)}>
          <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white shadow-xl anim-in anim-fade anim-down" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-base font-semibold text-gray-900">
                添加分类
                <span className="text-sm font-normal text-gray-500 ml-2">({modal.section === "income" ? "收入" : "支出"})</span>
              </h3>
              <button type="button" onClick={() => setModal(null)} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">分类名称</label>
                <input type="text" value={modalName} onChange={(e) => setModalName(e.target.value)} placeholder="请输入分类名称" autoFocus
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

      {/* Add/Edit Item Modal */}
      {(modal?.type === "add-item" || modal?.type === "edit-item") && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh] bg-black/5" onClick={() => setModal(null)}>
          <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white shadow-xl anim-in anim-fade anim-down" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-base font-semibold text-gray-900">
                {modal.type === "add-item" ? "添加记录" : "编辑记录"}
                <span className="text-sm font-normal text-gray-500 ml-2">
                  ({modal.section === "income" ? "收入" : "支出"}
                  {` ${getCategoryList(modal.section)[modal.catIndex!]?.category}`})
                </span>
              </h3>
              <button type="button" onClick={() => setModal(null)} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">分类</label>
                <select value={modalCatId ?? ""} onChange={(e) => setModalCatId(Number(e.target.value))}
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-slate-400 focus:ring-2 focus:ring-slate-200/60 focus:outline-none">
                  {categories.filter(c => c.type === modal.section).map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
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
                <label className="block text-sm font-medium text-gray-700 mb-1.5">日期</label>
                <input type="date" value={modalDate} onChange={(e) => setModalDate(e.target.value)}
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-slate-400 focus:ring-2 focus:ring-slate-200/60 focus:outline-none" />
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
      {(modal?.type === "delete-item" || modal?.type === "delete-category") && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh] bg-black/5" onClick={() => setModal(null)}>
          <div className="w-full max-w-sm rounded-xl border border-gray-200 bg-white shadow-xl anim-in anim-fade anim-down" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 mx-auto">
                <AlertTriangle className="h-6 w-6 text-red-500" />
              </div>
              <h3 className="mt-4 text-center text-base font-semibold text-gray-900">确认删除</h3>
              <p className="mt-2 text-center text-sm text-gray-500">
                {modal.type === "delete-category"
                  ? `确定要删除分类「${categories.find(c => c.id === modalCatId)?.name}」及其所有记录吗？`
                  : `确定要删除「${getCategoryList(modal.section)[modal.catIndex!]?.items[modal.itemIndex!]?.name}」吗？`
                }
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 pb-6">
              <button type="button" onClick={() => setModal(null)} className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors">取消</button>
              <button type="button" onClick={handleDelete} autoFocus className="rounded-lg px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-500 transition-colors">删除</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
