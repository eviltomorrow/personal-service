"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { PageHeader } from "@/components/page-header";
import {
  Wallet, TrendingUp, Plus, Pencil, Trash2, X, AlertTriangle,
  ChevronLeft, ChevronRight, ArrowUpRight, ArrowDownRight,
} from "lucide-react";

interface CashFlowItem {
  category: string;
  amount: number;
}

interface MonthCashFlow {
  income: CashFlowItem[];
  expense: CashFlowItem[];
}

const INCOME_CATEGORIES = ["工资", "理财收益", "兼职", "其他"];
const EXPENSE_CATEGORIES = ["住房", "餐饮", "交通", "购物", "学习", "医疗", "娱乐", "其他"];

const MONTH_LABELS = ["", "1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"];

function getMonthKey(year: number, month: number) {
  return `${year}-${String(month).padStart(2, "0")}`;
}

function formatCNY(amount: number) {
  return `¥ ${Math.abs(amount).toLocaleString("zh-CN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function createEmptyMonth(): MonthCashFlow {
  return { income: [], expense: [] };
}

export default function CashFlowPage() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [monthData, setMonthData] = useState<Record<string, MonthCashFlow>>({
    [getMonthKey(today.getFullYear(), today.getMonth() + 1)]: {
      income: [
        { category: "工资", amount: 28500 },
        { category: "理财收益", amount: 3500 },
      ],
      expense: [
        { category: "住房", amount: 4800 },
        { category: "餐饮", amount: 3200 },
        { category: "交通", amount: 1500 },
        { category: "购物", amount: 2800 },
        { category: "学习", amount: 600 },
        { category: "医疗", amount: 200 },
        { category: "娱乐", amount: 800 },
        { category: "其他", amount: 430 },
      ],
    },
  });
  const [modal, setModal] = useState<{
    type: "add" | "edit" | "delete";
    section: "income" | "expense";
    index?: number;
  } | null>(null);
  const [modalCategory, setModalCategory] = useState("");
  const [modalAmount, setModalAmount] = useState("");
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

  const monthKey = getMonthKey(year, month);
  const data = monthData[monthKey] ?? createEmptyMonth();

  function navigateMonth(delta: number) {
    const d = new Date(year, month - 1 + delta, 1);
    const ny = d.getFullYear();
    const nm = d.getMonth() + 1;
    const nk = getMonthKey(ny, nm);
    setYear(ny);
    setMonth(nm);
    if (!monthData[nk]) {
      setMonthData((prev) => ({ ...prev, [nk]: createEmptyMonth() }));
    }
  }

  const totalIncome = useMemo(
    () => data.income.reduce((s, i) => s + i.amount, 0),
    [data],
  );
  const totalExpense = useMemo(
    () => data.expense.reduce((s, i) => s + i.amount, 0),
    [data],
  );
  const netBalance = totalIncome - totalExpense;

  const prevMonthKey = getMonthKey(
    month === 1 ? year - 1 : year,
    month === 1 ? 12 : month - 1,
  );
  const prevData = monthData[prevMonthKey];
  const prevTotalIncome = prevData ? prevData.income.reduce((s, i) => s + i.amount, 0) : 0;
  const prevTotalExpense = prevData ? prevData.expense.reduce((s, i) => s + i.amount, 0) : 0;

  function calcChange(current: number, previous: number): string | null {
    if (previous === 0) return null;
    const pct = ((current - previous) / previous) * 100;
    return `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`;
  }

  function openAdd(section: "income" | "expense") {
    setModalCategory(section === "income" ? INCOME_CATEGORIES[0] : EXPENSE_CATEGORIES[0]);
    setModalAmount("");
    setModal({ type: "add", section });
  }

  function openEdit(section: "income" | "expense", index: number) {
    const item = data[section][index];
    setModalCategory(item.category);
    setModalAmount(String(item.amount));
    setModal({ type: "edit", section, index });
  }

  function handleSave() {
    if (!modal || modal.type === "delete") return;
    const cat = modalCategory.trim();
    const amt = Number(modalAmount);
    if (!cat || isNaN(amt) || amt <= 0) return;

    setMonthData((prev) => {
      const src = prev[monthKey];
      const next: MonthCashFlow = {
        income: src?.income.map((i) => ({ ...i })) ?? [],
        expense: src?.expense.map((i) => ({ ...i })) ?? [],
      };
      if (modal.type === "add") {
        next[modal.section].push({ category: cat, amount: amt });
      } else {
        next[modal.section][modal.index!] = { category: cat, amount: amt };
      }
      return { ...prev, [monthKey]: next };
    });
    setModal(null);
  }

  function handleDelete() {
    if (!modal || modal.type !== "delete") return;
    setMonthData((prev) => {
      const src = prev[monthKey];
      const next: MonthCashFlow = {
        income: src?.income.map((i) => ({ ...i })) ?? [],
        expense: src?.expense.map((i) => ({ ...i })) ?? [],
      };
      next[modal.section].splice(modal.index!, 1);
      return { ...prev, [monthKey]: next };
    });
    setModal(null);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="现金流量表"
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
              {totalIncome > 0 ? formatCNY(totalIncome) : "¥ 0.00"}
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
              {totalExpense > 0 ? formatCNY(totalExpense) : "¥ 0.00"}
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
              {formatCNY(netBalance)}
            </p>
            <p className="mt-0.5 text-sm text-gray-500">净结余</p>
          </div>
        </div>
      </div>

      {/* Income section */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-3 flex items-center gap-3 bg-emerald-50/80">
          <div className="w-1 h-4 rounded-full bg-emerald-500" />
          <span className="text-sm font-semibold text-gray-800">💰 收入</span>
          <button type="button" onClick={() => openAdd("income")}
            className="ml-auto rounded p-1 text-gray-300 hover:text-slate-500 transition-colors">
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="divide-y divide-gray-50">
          {data.income.length === 0 && (
            <p className="px-5 py-3 text-sm text-gray-400">暂无数据</p>
          )}
          {data.income.map((item, ii) => (
            <div key={ii}
              className="group flex items-center justify-between px-5 py-2.5 hover:bg-gray-50/50 transition-colors">
              <span className="text-sm text-gray-700">{item.category}</span>
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-emerald-600 tabular-nums">{formatCNY(item.amount)}</span>
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button type="button" onClick={() => openEdit("income", ii)}
                    className="rounded p-0.5 text-gray-300 hover:text-slate-500 transition-colors">
                    <Pencil className="h-3 w-3" />
                  </button>
                  <button type="button" onClick={() => setModal({ type: "delete", section: "income", index: ii })}
                    className="rounded p-0.5 text-gray-300 hover:text-red-400 transition-colors">
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="px-5 py-2.5 flex items-center justify-between bg-emerald-50/80 border-t border-gray-100">
          <span className="text-sm font-semibold text-emerald-700">小计</span>
          <span className="text-sm font-semibold text-emerald-700 tabular-nums">{formatCNY(totalIncome)}</span>
        </div>
      </div>

      {/* Expense section */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-3 flex items-center gap-3 bg-red-50/80">
          <div className="w-1 h-4 rounded-full bg-red-500" />
          <span className="text-sm font-semibold text-gray-800">💸 支出</span>
          <button type="button" onClick={() => openAdd("expense")}
            className="ml-auto rounded p-1 text-gray-300 hover:text-slate-500 transition-colors">
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="divide-y divide-gray-50">
          {data.expense.length === 0 && (
            <p className="px-5 py-3 text-sm text-gray-400">暂无数据</p>
          )}
          {data.expense.map((item, ii) => (
            <div key={ii}
              className="group flex items-center justify-between px-5 py-2.5 hover:bg-gray-50/50 transition-colors">
              <span className="text-sm text-gray-700">{item.category}</span>
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-red-600 tabular-nums">{formatCNY(item.amount)}</span>
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button type="button" onClick={() => openEdit("expense", ii)}
                    className="rounded p-0.5 text-gray-300 hover:text-slate-500 transition-colors">
                    <Pencil className="h-3 w-3" />
                  </button>
                  <button type="button" onClick={() => setModal({ type: "delete", section: "expense", index: ii })}
                    className="rounded p-0.5 text-gray-300 hover:text-red-400 transition-colors">
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="px-5 py-2.5 flex items-center justify-between bg-red-50/80 border-t border-gray-100">
          <span className="text-sm font-semibold text-red-700">小计</span>
          <span className="text-sm font-semibold text-red-700 tabular-nums">{formatCNY(totalExpense)}</span>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {(modal?.type === "add" || modal?.type === "edit") && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/10 backdrop-blur-sm p-4" onClick={() => setModal(null)}>
          <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-base font-semibold text-gray-900">
                {modal.type === "add" ? "添加记录" : "编辑记录"}
                <span className="text-sm font-normal text-gray-500 ml-2">
                  ({modal.section === "income" ? "收入" : "支出"})
                </span>
              </h3>
              <button type="button" onClick={() => setModal(null)} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">分类</label>
                <select value={modalCategory} onChange={(e) => setModalCategory(e.target.value)}
                  className="block w-full rounded-lg border border-gray-200 bg-white py-2.5 px-3.5 text-sm text-gray-900 shadow-xs focus:border-slate-400 focus:ring-2 focus:ring-slate-200/60 focus:outline-none transition-all">
                  {(modal.section === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">金额（元）</label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-sm text-gray-400">¥</span>
                  <input type="number" value={modalAmount} onChange={(e) => setModalAmount(e.target.value)} placeholder="0.00" min="0" step="0.01" autoFocus
                    className="block w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-8 pr-3.5 text-sm text-gray-900 placeholder-gray-400 shadow-xs focus:border-slate-400 focus:ring-2 focus:ring-slate-200/60 focus:outline-none transition-all" />
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 pt-2">
                <button type="button" onClick={() => setModal(null)} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">取消</button>
                <button type="submit" className="rounded-lg bg-gradient-to-r from-slate-600 to-slate-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:from-slate-700 hover:to-slate-800 transition-all">保存</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {modal?.type === "delete" && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/10 backdrop-blur-sm p-4" onClick={() => setModal(null)}>
          <div className="w-full max-w-sm rounded-xl border border-gray-200 bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 mx-auto">
                <AlertTriangle className="h-6 w-6 text-red-500" />
              </div>
              <h3 className="mt-4 text-center text-base font-semibold text-gray-900">确认删除</h3>
              <p className="mt-2 text-center text-sm text-gray-500">
                确定要删除这条{modal.section === "income" ? "收入" : "支出"}记录吗？
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 pb-6">
              <button type="button" onClick={() => setModal(null)} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">取消</button>
              <button type="button" onClick={handleDelete} autoFocus className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-600 transition-all">删除</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
