"use client";

import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import {
  Wallet, Landmark, TrendingUp, ArrowUpRight, ArrowDownRight,
  AlertCircle, Plus, Pencil, Trash2, X, AlertTriangle,
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

function formatCNY(amount: number) {
  return `¥ ${amount.toLocaleString("zh-CN")}.00`;
}

function getMonthKey(year: number, month: number) {
  return `${year}-${String(month).padStart(2, "0")}`;
}

const MONTH_LABELS = ["", "1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"];

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

const today = new Date();
const todayYear = today.getFullYear();
const todayMonth = today.getMonth() + 1;
const initialKey = getMonthKey(todayYear, todayMonth);

type ModalState =
  | { type: "add"; groupIndex: number }
  | { type: "edit"; groupIndex: number; itemIndex: number }
  | { type: "delete"; groupIndex: number; itemIndex: number }
  | null;

export default function BalanceSheetPage() {
  const [year, setYear] = useState(todayYear);
  const [month, setMonth] = useState(todayMonth);
  const [monthData, setMonthData] = useState<Record<string, BalanceGroup[]>>({
    [initialKey]: createDefaultData(),
  });
  const [modal, setModal] = useState<ModalState>(null);
  const [formName, setFormName] = useState("");
  const [formAmount, setFormAmount] = useState("");

  const monthKey = getMonthKey(year, month);
  const data = monthData[monthKey] ?? createDefaultData();

  const totalAssets = data.slice(0, 2).flatMap((g) => g.items).reduce((s, i) => s + i.amount, 0);
  const totalLiabilities = data.slice(2, 4).flatMap((g) => g.items).reduce((s, i) => s + i.amount, 0);
  const totalEquity = data.slice(4).flatMap((g) => g.items).reduce((s, i) => s + i.amount, 0);

  function navigateMonth(delta: number) {
    const newDate = new Date(year, month - 1 + delta, 1);
    const newYear = newDate.getFullYear();
    const newMonth = newDate.getMonth() + 1;
    const newKey = getMonthKey(newYear, newMonth);
    const curKey = monthKey;

    setYear(newYear);
    setMonth(newMonth);

    if (!monthData[newKey]) {
      setMonthData((prev) => ({
        ...prev,
        [newKey]: prev[curKey].map((g) => ({ ...g, items: [...g.items] })),
      }));
    }
  }

  function openAdd(groupIndex: number) {
    setFormName("");
    setFormAmount("");
    setModal({ type: "add", groupIndex });
  }

  function openEdit(groupIndex: number, itemIndex: number) {
    const item = data[groupIndex].items[itemIndex];
    setFormName(item.name);
    setFormAmount(String(item.amount));
    setModal({ type: "edit", groupIndex, itemIndex });
  }

  function handleSave() {
    if (!modal) return;
    const name = formName.trim();
    const amount = Number(formAmount);
    if (!name || isNaN(amount) || amount <= 0) return;

    setMonthData((prev) => {
      const next = { ...prev, [monthKey]: prev[monthKey].map((g) => ({ ...g, items: [...g.items] })) };
      if (modal.type === "add") {
        next[monthKey][modal.groupIndex].items.push({ name, amount });
      } else if (modal.type === "edit") {
        next[monthKey][modal.groupIndex].items[modal.itemIndex] = { name, amount };
      }
      return next;
    });
    setModal(null);
  }

  function handleDelete() {
    if (!modal || modal.type !== "delete") return;
    setMonthData((prev) => {
      const next = { ...prev, [monthKey]: prev[monthKey].map((g) => ({ ...g, items: [...g.items] })) };
      next[monthKey][modal.groupIndex].items.splice(modal.itemIndex, 1);
      return next;
    });
    setModal(null);
  }

  const summaryCards = [
    { label: "总资产", value: formatCNY(totalAssets), change: "+3.2%", trend: "up" as const, icon: Wallet },
    { label: "总负债", value: formatCNY(totalLiabilities), change: "-1.8%", trend: "down" as const, icon: Landmark },
    { label: "净资产", value: formatCNY(totalEquity), change: "+6.7%", trend: "up" as const, icon: TrendingUp },
  ];

  function renderSection(group: BalanceGroup, gi: number) {
    return (
      <div key={group.category} className="rounded-lg border border-gray-100 bg-gray-50/30">
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100">
          <span className="text-sm font-semibold text-gray-800">{group.category}</span>
          <button
            type="button"
            onClick={() => openAdd(gi)}
            className="inline-flex items-center gap-1 text-xs font-medium text-gray-400 hover:text-slate-600 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            添加
          </button>
        </div>
        <div className="divide-y divide-gray-50">
          {group.items.length === 0 && (
            <p className="px-4 py-3 text-xs text-gray-400">暂无数据</p>
          )}
          {group.items.map((item, ii) => (
            <div
              key={`${gi}-${ii}`}
              className="group flex items-center justify-between px-4 py-2.5 hover:bg-white transition-colors"
            >
              <span className="text-sm text-gray-700">{item.name}</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-900 tabular-nums">
                  {formatCNY(item.amount)}
                </span>
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={() => openEdit(gi, ii)}
                    className="rounded p-1 text-gray-300 hover:text-slate-500 transition-colors"
                  >
                    <Pencil className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setModal({ type: "delete", groupIndex: gi, itemIndex: ii })}
                    className="rounded p-1 text-gray-300 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 anim-in anim-fade anim-up" style={{ animationDuration: "500ms" }}>
      <PageHeader title="资产负债表" description="个人资产负债总览" />

      {/* Sidebar + Detail grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6 items-start">
        {/* Left sidebar: month nav + summary cards */}
        <div className="space-y-5">
          {/* Month navigation */}
          <div className="flex items-center justify-center gap-4 rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
            <button
              type="button"
              onClick={() => navigateMonth(-1)}
              className="inline-flex items-center justify-center rounded-lg p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all active:scale-95"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm font-semibold text-gray-900 select-none">
              {year}年{MONTH_LABELS[month]}
            </span>
            <button
              type="button"
              onClick={() => navigateMonth(1)}
              className="inline-flex items-center justify-center rounded-lg p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all active:scale-95"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Summary cards stacked */}
          <div className="space-y-3">
            {summaryCards.map((card) => (
              <div
                key={card.label}
                className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="rounded-lg bg-slate-100 p-2">
                    <card.icon className="h-4 w-4 text-slate-600" />
                  </div>
                  <span
                    className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-medium ${
                      card.trend === "up"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-red-50 text-red-700"
                    }`}
                  >
                    {card.trend === "up" ? (
                      <ArrowUpRight className="h-3 w-3" />
                    ) : (
                      <ArrowDownRight className="h-3 w-3" />
                    )}
                    {card.change}
                  </span>
                </div>
                <p className="mt-3 text-xl font-semibold text-gray-900">{card.value}</p>
                <p className="mt-0.5 text-xs text-gray-500">{card.label}</p>
              </div>
            ))}
          </div>

          {/* Legend hint */}
          <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/50 p-4 text-center">
            <p className="text-xs text-gray-400">点击项目可修改，支持新增和删除</p>
          </div>
        </div>

        {/* Right: detail panel */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h3 className="text-base font-semibold text-gray-900">资产负债表明细</h3>
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
              <AlertCircle className="h-3.5 w-3.5" />
              数据仅供参考
            </span>
          </div>
          <div className="p-5 space-y-4">
            {data.map((group, gi) => (
              <div key={group.category}>
                {group.category === "净资产" ? (
                  <div className="rounded-lg border border-emerald-100 bg-emerald-50/30">
                    <div className="flex items-center justify-between px-4 py-2.5 border-b border-emerald-100">
                      <span className="text-sm font-semibold text-emerald-800">{group.category}</span>
                      <button
                        type="button"
                        onClick={() => openAdd(gi)}
                        className="inline-flex items-center gap-1 text-xs font-medium text-emerald-500 hover:text-emerald-700 transition-colors"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        添加
                      </button>
                    </div>
                    <div className="divide-y divide-emerald-50">
                      {group.items.length === 0 && (
                        <p className="px-4 py-3 text-xs text-gray-400">暂无数据</p>
                      )}
                      {group.items.map((item, ii) => (
                        <div
                          key={`${gi}-${ii}`}
                          className="group flex items-center justify-between px-4 py-2.5 hover:bg-white/60 transition-colors"
                        >
                          <span className="text-sm text-gray-700">{item.name}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-emerald-700 tabular-nums">
                              {formatCNY(item.amount)}
                            </span>
                            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                type="button"
                                onClick={() => openEdit(gi, ii)}
                                className="rounded p-1 text-gray-300 hover:text-slate-500 transition-colors"
                              >
                                <Pencil className="h-3 w-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setModal({ type: "delete", groupIndex: gi, itemIndex: ii })}
                                className="rounded p-1 text-gray-300 hover:text-red-400 transition-colors"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  renderSection(group, gi)
                )}
                {/* Totals between groups */}
                {gi === 1 && (
                  <div className="flex items-center justify-between px-4 py-3 rounded-lg bg-gray-50/80 border border-gray-100">
                    <span className="text-sm font-semibold text-gray-800">资产合计</span>
                    <span className="text-sm font-semibold text-gray-900 tabular-nums">
                      {formatCNY(totalAssets)}
                    </span>
                  </div>
                )}
                {gi === 3 && (
                  <div className="flex items-center justify-between px-4 py-3 rounded-lg bg-gray-50/80 border border-gray-100">
                    <span className="text-sm font-semibold text-gray-800">负债合计</span>
                    <span className="text-sm font-semibold text-gray-900 tabular-nums">
                      {formatCNY(totalLiabilities)}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="border-t-2 border-emerald-200 px-6 py-3.5 flex items-center justify-between bg-emerald-50/50">
            <span className="text-sm font-semibold text-emerald-800">净资产合计</span>
            <span className="text-sm font-semibold text-emerald-700 tabular-nums">
              {formatCNY(totalEquity)}
            </span>
          </div>
        </div>
      </div>

      {/* Add / Edit modal */}
      {(modal?.type === "add" || modal?.type === "edit") && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/10 backdrop-blur-sm p-4 anim-in anim-fade"
          onClick={() => setModal(null)}
        >
          <div
            className="w-full max-w-md rounded-xl border border-gray-200 bg-white shadow-xl anim-in anim-fade anim-up"
            style={{ animationDuration: "200ms" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-base font-semibold text-gray-900">
                {modal.type === "add" ? "添加项目" : "编辑项目"}
              </h3>
              <button
                type="button"
                onClick={() => setModal(null)}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form
              onSubmit={(e) => { e.preventDefault(); handleSave(); }}
              className="p-6 space-y-4"
            >
              <div>
                <label htmlFor="modalName" className="block text-sm font-medium text-gray-700 mb-1.5">
                  项目名称
                </label>
                <input
                  id="modalName"
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="请输入项目名称"
                  className="block w-full rounded-lg border border-gray-200 bg-white py-2.5 px-3.5 text-sm text-gray-900 placeholder-gray-400 shadow-xs focus:border-slate-400 focus:ring-2 focus:ring-slate-200/60 focus:outline-none transition-all"
                  autoFocus
                />
              </div>
              <div>
                <label htmlFor="modalAmount" className="block text-sm font-medium text-gray-700 mb-1.5">
                  金额（元）
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-sm text-gray-400">¥</span>
                  <input
                    id="modalAmount"
                    type="number"
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    className="block w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-8 pr-3.5 text-sm text-gray-900 placeholder-gray-400 shadow-xs focus:border-slate-400 focus:ring-2 focus:ring-slate-200/60 focus:outline-none transition-all"
                  />
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModal(null)}
                  className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-gradient-to-r from-slate-600 to-slate-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:from-slate-700 hover:to-slate-800 transition-all"
                >
                  保存
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {modal?.type === "delete" && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/10 backdrop-blur-sm p-4 anim-in anim-fade"
          onClick={() => setModal(null)}
        >
          <div
            className="w-full max-w-sm rounded-xl border border-gray-200 bg-white shadow-xl anim-in anim-fade anim-up"
            style={{ animationDuration: "200ms" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 mx-auto">
                <AlertTriangle className="h-6 w-6 text-red-500" />
              </div>
              <h3 className="mt-4 text-center text-base font-semibold text-gray-900">确认删除</h3>
              <p className="mt-2 text-center text-sm text-gray-500">
                确定要删除「{data[modal.groupIndex]?.items[modal.itemIndex]?.name}」吗？此操作不可恢复。
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 pb-6">
              <button
                type="button"
                onClick={() => setModal(null)}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-600 transition-all"
              >
                删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
