# Balance Sheet Page Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the balance sheet page with top summary cards, shrunken left panel, right transaction detail list, and 12-month trend chart.

**Architecture:** Single page component rewrite (`apps/personal-web-admin/src/app/dashboard/balance-sheet/page.tsx`). All state remains local with `useState`. No external chart library — CSS/SVG bar chart.

**Tech Stack:** Next.js 15, React 19, TypeScript, Tailwind CSS v4, lucide-react

## Global Constraints

- No external chart library dependency
- All data is mock/static (no API calls)
- Follow existing Tailwind v4 patterns from the codebase
- Keep existing Add/Edit/Delete CRUD functionality for balance sheet items
- Use lucide-react icons (already in project)

---

### Task 1: Rewrite page with new data model, top summary cards, left + right layout

**Files:**
- Modify: `apps/personal-web-admin/src/app/dashboard/balance-sheet/page.tsx` (full rewrite)

This is the single task since the entire page is being rewritten. The page will include:

**Data model changes:**
- Remove: `year`, `month`, `monthData`, `monthKey`, `getMonthKey`, `MONTH_LABELS`, `navigateMonth`
- Add: `selectedItem` state (`{ groupIndex: number; itemIndex: number } | null`)
- Add: `transactions` mock data: `Record<string, Transaction[]>` keyed by `"${groupIndex}-${itemIndex}"`
- Add `Transaction` interface: `{ date: string; amount: number; remark: string }`
- Add `TrendData` type for 12-month chart data

**Layout structure:**
```
PageHeader
└── Top summary cards row (3 cards: 总资产 blue, 总负债 orange, 净资产 green)
└── Two-column grid:
    ├── Left (w-80): shrunken category groups with clickable items
    │   ├── Each group: category header with add button
    │   ├── Each item row: name + amount, clickable, highlight on select
    │   └── Subtotal lines between groups
    └── Right (flex-1): selected item's detail
        ├── Detail list: table with date/amount/remark columns
        └── Trend chart: 12-month CSS bar chart
```

**Implementation steps:**

- [ ] **Step 1: Write the full page component**

```tsx
"use client";

import { useState, useMemo } from "react";
import { PageHeader } from "@/components/page-header";
import {
  Wallet, Landmark, TrendingUp, Plus, Pencil, Trash2, X, AlertTriangle,
} from "lucide-react";

// --- Types ---

interface BalanceItem {
  name: string;
  amount: number;
}

interface BalanceGroup {
  category: string;
  items: BalanceItem[];
}

interface Transaction {
  date: string;
  amount: number;
  remark: string;
}

interface TrendPoint {
  month: string;
  amount: number;
}

// --- Formatting ---

function formatCNY(amount: number) {
  const abs = Math.abs(amount);
  const formatted = abs.toLocaleString("zh-CN");
  return amount < 0 ? `- ¥ ${formatted}.00` : `¥ ${formatted}.00`;
}

// --- Default Data ---

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

function createDefaultTransactions(): Record<string, Transaction[]> {
  return {
    "0-0": [
      { date: "2026-06-15", amount: 15000, remark: "工资收入" },
      { date: "2026-06-10", amount: 5000, remark: "报销款" },
      { date: "2026-05-28", amount: 12000, remark: "项目奖金" },
    ],
    "0-1": [
      { date: "2026-06-20", amount: 30000, remark: "客户A回款" },
      { date: "2026-06-05", amount: 50000, remark: "客户B回款" },
    ],
    "0-2": [
      { date: "2026-06-18", amount: 15000, remark: "采购原材料" },
      { date: "2026-06-08", amount: 8000, remark: "补货" },
    ],
    "0-3": [
      { date: "2026-06-12", amount: 20000, remark: "理财产品申购" },
    ],
    "1-0": [
      { date: "2026-06-01", amount: 320000, remark: "房产估值" },
    ],
    "1-1": [
      { date: "2026-06-01", amount: 100000, remark: "设备采购" },
    ],
    "1-2": [
      { date: "2026-06-15", amount: 50000, remark: "基金投资" },
    ],
    "1-3": [
      { date: "2026-06-01", amount: 62500, remark: "软件著作权" },
    ],
    "1-4": [
      { date: "2026-06-01", amount: 65000, remark: "装修摊销" },
    ],
    "2-0": [
      { date: "2026-06-20", amount: 50000, remark: "供应商付款" },
      { date: "2026-06-10", amount: 30000, remark: "采购款" },
    ],
    "2-1": [
      { date: "2026-06-15", amount: 100000, remark: "银行短期贷款" },
    ],
    "2-2": [
      { date: "2026-06-25", amount: 38400, remark: "6月工资" },
    ],
    "3-0": [
      { date: "2026-06-01", amount: 180000, remark: "银行贷款" },
    ],
    "3-1": [
      { date: "2026-06-01", amount: 49000, remark: "企业债券发行" },
    ],
    "4-0": [
      { date: "2026-06-01", amount: 500000, remark: "实收资本" },
    ],
    "4-1": [
      { date: "2026-06-01", amount: 120000, remark: "资本溢价" },
    ],
    "4-2": [
      { date: "2026-06-25", amount: 50000, remark: "本月利润结转" },
      { date: "2026-05-25", amount: 45000, remark: "上月利润结转" },
    ],
  };
}

function createDefaultTrend(): Record<string, TrendPoint[]> {
  const months = [
    { month: "25年7月", amount: 480000 },
    { month: "25年8月", amount: 495000 },
    { month: "25年9月", amount: 510000 },
    { month: "25年10月", amount: 498000 },
    { month: "25年11月", amount: 520000 },
    { month: "25年12月", amount: 535000 },
    { month: "26年1月", amount: 528000 },
    { month: "26年2月", amount: 542000 },
    { month: "26年3月", amount: 550000 },
    { month: "26年4月", amount: 545000 },
    { month: "26年5月", amount: 559000 },
    { month: "26年6月", amount: 559000 },
  ];
  // Generate per-item trends (slightly varied)
  const result: Record<string, TrendPoint[]> = {};
  const keys = [
    "0-0", "0-1", "0-2", "0-3",
    "1-0", "1-1", "1-2", "1-3", "1-4",
    "2-0", "2-1", "2-2",
    "3-0", "3-1",
    "4-0", "4-1", "4-2",
  ];
  const baseValues = [285000, 128000, 96000, 50000, 320000, 100000, 180000, 62500, 65000, 156000, 100000, 38400, 180000, 49000, 500000, 120000, 143100];
  keys.forEach((key, idx) => {
    const base = baseValues[idx];
    result[key] = months.map((m, mi) => ({
      month: m.month,
      amount: Math.round(base * (0.85 + mi * 0.025)),
    }));
  });
  return result;
}

// --- Modal types ---

type ItemModalState =
  | { type: "add"; groupIndex: number }
  | { type: "edit"; groupIndex: number; itemIndex: number }
  | { type: "delete"; groupIndex: number; itemIndex: number }
  | null;

type TxModalState =
  | { type: "addTx" }
  | { type: "deleteTx"; txIndex: number }
  | null;

// --- Component ---

export default function BalanceSheetPage() {
  const [data, setData] = useState<BalanceGroup[]>(createDefaultData);
  const [transactions, setTransactions] = useState<Record<string, Transaction[]>>(createDefaultTransactions);
  const [trendData] = useState<Record<string, TrendPoint[]>>(createDefaultTrend);
  const [selectedItem, setSelectedItem] = useState<{ groupIndex: number; itemIndex: number }>({ groupIndex: 0, itemIndex: 0 });
  const [itemModal, setItemModal] = useState<ItemModalState>(null);
  const [txModal, setTxModal] = useState<TxModalState>(null);
  const [formName, setFormName] = useState("");
  const [formAmount, setFormAmount] = useState("");
  const [txDate, setTxDate] = useState("");
  const [txAmount, setTxAmount] = useState("");
  const [txRemark, setTxRemark] = useState("");

  const totalAssets = useMemo(() =>
    data.slice(0, 2).flatMap((g) => g.items).reduce((s, i) => s + i.amount, 0),
    [data],
  );
  const totalLiabilities = useMemo(() =>
    data.slice(2, 4).flatMap((g) => g.items).reduce((s, i) => s + i.amount, 0),
    [data],
  );
  const totalEquity = useMemo(() =>
    data.slice(4).flatMap((g) => g.items).reduce((s, i) => s + i.amount, 0),
    [data],
  );

  const selectedKey = `${selectedItem.groupIndex}-${selectedItem.itemIndex}`;
  const selectedTransactions = transactions[selectedKey] ?? [];
  const selectedTrend = trendData[selectedKey] ?? [];
  const selectedItemName = data[selectedItem.groupIndex]?.items[selectedItem.itemIndex]?.name ?? "";

  const maxTrend = Math.max(...selectedTrend.map((t) => t.amount), 1);

  // --- Item CRUD ---

  function openAddItem(groupIndex: number) {
    setFormName("");
    setFormAmount("");
    setItemModal({ type: "add", groupIndex });
  }

  function openEditItem(groupIndex: number, itemIndex: number) {
    const item = data[groupIndex].items[itemIndex];
    setFormName(item.name);
    setFormAmount(String(item.amount));
    setItemModal({ type: "edit", groupIndex, itemIndex });
  }

  function handleSaveItem() {
    if (!itemModal) return;
    const name = formName.trim();
    const amount = Number(formAmount);
    if (!name || isNaN(amount) || amount <= 0) return;

    setData((prev) => {
      const next = prev.map((g) => ({ ...g, items: [...g.items] }));
      if (itemModal.type === "add") {
        next[itemModal.groupIndex].items.push({ name, amount });
      } else if (itemModal.type === "edit") {
        next[itemModal.groupIndex].items[itemModal.itemIndex] = { name, amount };
      }
      return next;
    });
    setItemModal(null);
  }

  function handleDeleteItem() {
    if (!itemModal || itemModal.type !== "delete") return;
    setData((prev) => {
      const next = prev.map((g) => ({ ...g, items: [...g.items] }));
      next[itemModal.groupIndex].items.splice(itemModal.itemIndex, 1);
      return next;
    });
    setItemModal(null);
  }

  // --- Transaction CRUD ---

  function openAddTx() {
    setTxDate(new Date().toISOString().slice(0, 10));
    setTxAmount("");
    setTxRemark("");
    setTxModal({ type: "addTx" });
  }

  function handleSaveTx() {
    if (!txModal || txModal.type !== "addTx") return;
    const date = txDate.trim();
    const amount = Number(txAmount);
    const remark = txRemark.trim();
    if (!date || isNaN(amount)) return;

    setTransactions((prev) => {
      const existing = [...(prev[selectedKey] ?? [])];
      existing.push({ date, amount, remark });
      return { ...prev, [selectedKey]: existing };
    });
    setTxModal(null);
  }

  function handleDeleteTx() {
    if (!txModal || txModal.type !== "deleteTx") return;
    setTransactions((prev) => {
      const existing = [...(prev[selectedKey] ?? [])];
      existing.splice(txModal.txIndex, 1);
      return { ...prev, [selectedKey]: existing };
    });
    setTxModal(null);
  }

  // --- Render helpers ---

  const summaryCards = [
    { label: "总资产", value: formatCNY(totalAssets), color: "blue", icon: Wallet },
    { label: "总负债", value: formatCNY(totalLiabilities), color: "orange", icon: Landmark },
    { label: "净资产", value: formatCNY(totalEquity), color: "emerald", icon: TrendingUp },
  ];

  const colorMap = {
    blue: { bg: "bg-blue-50", text: "text-blue-700", iconBg: "bg-blue-100", iconColor: "text-blue-600" },
    orange: { bg: "bg-orange-50", text: "text-orange-700", iconBg: "bg-orange-100", iconColor: "text-orange-600" },
    emerald: { bg: "bg-emerald-50", text: "text-emerald-700", iconBg: "bg-emerald-100", iconColor: "text-emerald-600" },
  };

  return (
    <div className="space-y-6 anim-in anim-fade anim-up" style={{ animationDuration: "500ms" }}>
      <PageHeader title="资产负债表" description="个人资产负债总览" />

      {/* Top summary cards row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {summaryCards.map((card) => {
          const c = colorMap[card.color as keyof typeof colorMap];
          return (
            <div
              key={card.label}
              className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition-all"
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`rounded-lg ${c.iconBg} p-2`}>
                  <card.icon className={`h-5 w-5 ${c.iconColor}`} />
                </div>
              </div>
              <p className={`text-2xl font-bold ${c.text} tabular-nums`}>
                {card.value}
              </p>
              <p className="mt-1 text-sm text-gray-500">{card.label}</p>
            </div>
          );
        })}
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6 items-start">
        {/* Left: Category groups */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm divide-y divide-gray-100">
          {data.map((group, gi) => {
            const isAssetSection = gi <= 1;
            const isLiabilitySection = gi >= 2 && gi <= 3;
            const isEquitySection = gi === 4;

            return (
              <div key={group.category}>
                <div className="px-4 py-2.5 flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {group.category}
                  </span>
                  <button
                    type="button"
                    onClick={() => openAddItem(gi)}
                    className="rounded p-1 text-gray-300 hover:text-slate-500 transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="divide-y divide-gray-50">
                  {group.items.map((item, ii) => {
                    const isSelected = selectedItem.groupIndex === gi && selectedItem.itemIndex === ii;
                    return (
                      <button
                        key={`${gi}-${ii}`}
                        type="button"
                        onClick={() => setSelectedItem({ groupIndex: gi, itemIndex: ii })}
                        className={`w-full group flex items-center justify-between px-4 py-2 text-left transition-colors ${
                          isSelected
                            ? "bg-slate-100 border-l-2 border-slate-600"
                            : "hover:bg-gray-50 border-l-2 border-transparent"
                        }`}
                      >
                        <span className={`text-sm ${isSelected ? "font-semibold text-slate-900" : "text-gray-700"}`}>
                          {item.name}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className={`text-xs tabular-nums ${isSelected ? "font-semibold text-slate-900" : "text-gray-500"}`}>
                            {formatCNY(item.amount)}
                          </span>
                          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); openEditItem(gi, ii); }}
                              className="rounded p-0.5 text-gray-300 hover:text-slate-500 transition-colors"
                            >
                              <Pencil className="h-3 w-3" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); setItemModal({ type: "delete", groupIndex: gi, itemIndex: ii }); }}
                              className="rounded p-0.5 text-gray-300 hover:text-red-400 transition-colors"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
                {/* Subtotals */}
                {isAssetSection && gi === 1 && (
                  <div className="px-4 py-2 bg-blue-50/50 flex items-center justify-between">
                    <span className="text-xs font-semibold text-blue-700">资产合计</span>
                    <span className="text-xs font-semibold text-blue-700 tabular-nums">{formatCNY(totalAssets)}</span>
                  </div>
                )}
                {isLiabilitySection && gi === 3 && (
                  <div className="px-4 py-2 bg-orange-50/50 flex items-center justify-between">
                    <span className="text-xs font-semibold text-orange-700">负债合计</span>
                    <span className="text-xs font-semibold text-orange-700 tabular-nums">{formatCNY(totalLiabilities)}</span>
                  </div>
                )}
                {isEquitySection && (
                  <div className="px-4 py-2 bg-emerald-50/50 flex items-center justify-between">
                    <span className="text-xs font-semibold text-emerald-700">净资产合计</span>
                    <span className="text-xs font-semibold text-emerald-700 tabular-nums">{formatCNY(totalEquity)}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Right: Selected item detail */}
        <div className="space-y-5">
          {/* Detail list */}
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900">
                明细记录 — {selectedItemName}
              </h3>
              <button
                type="button"
                onClick={openAddTx}
                className="inline-flex items-center gap-1 text-xs font-medium text-gray-400 hover:text-slate-600 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" /> 添加
              </button>
            </div>
            {selectedTransactions.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-gray-400">暂无记录</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-50">
                      <th className="px-5 py-2.5 text-left text-xs font-medium text-gray-500">日期</th>
                      <th className="px-5 py-2.5 text-right text-xs font-medium text-gray-500">金额</th>
                      <th className="px-5 py-2.5 text-left text-xs font-medium text-gray-500">备注</th>
                      <th className="px-5 py-2.5 w-10" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {selectedTransactions.map((tx, txi) => (
                      <tr key={txi} className="group hover:bg-gray-50/50 transition-colors">
                        <td className="px-5 py-2.5 text-gray-700 whitespace-nowrap">{tx.date}</td>
                        <td className="px-5 py-2.5 text-right font-medium text-gray-900 tabular-nums whitespace-nowrap">
                          {formatCNY(tx.amount)}
                        </td>
                        <td className="px-5 py-2.5 text-gray-500">{tx.remark}</td>
                        <td className="px-5 py-2.5">
                          <button
                            type="button"
                            onClick={() => setTxModal({ type: "deleteTx", txIndex: txi })}
                            className="rounded p-1 text-gray-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Trend chart */}
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">
              近12个月趋势 — {selectedItemName}
            </h3>
            {selectedTrend.length === 0 ? (
              <div className="py-8 text-center text-sm text-gray-400">暂无数据</div>
            ) : (
              <div className="flex items-end gap-2 h-40" style={{ minHeight: "160px" }}>
                {selectedTrend.map((point, ti) => {
                  const height = maxTrend > 0 ? (point.amount / maxTrend) * 100 : 0;
                  const barColor =
                    selectedItem.groupIndex <= 1
                      ? "bg-blue-500"
                      : selectedItem.groupIndex <= 3
                        ? "bg-orange-500"
                        : "bg-emerald-500";
                  return (
                    <div key={ti} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                      <div
                        className={`w-full rounded-t ${barColor} transition-all duration-300 hover:opacity-80`}
                        style={{
                          height: `${Math.max(height, 2)}%`,
                          minHeight: "4px",
                        }}
                        title={`${point.month}: ${formatCNY(point.amount)}`}
                      />
                      <span className="text-[10px] text-gray-400 whitespace-nowrap">{point.month.slice(-3)}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* --- Item Add/Edit Modal --- */}
      {(itemModal?.type === "add" || itemModal?.type === "edit") && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/10 backdrop-blur-sm p-4 anim-in anim-fade"
          onClick={() => setItemModal(null)}
        >
          <div
            className="w-full max-w-md rounded-xl border border-gray-200 bg-white shadow-xl anim-in anim-fade anim-up"
            style={{ animationDuration: "200ms" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-base font-semibold text-gray-900">
                {itemModal.type === "add" ? "添加项目" : "编辑项目"}
              </h3>
              <button
                type="button"
                onClick={() => setItemModal(null)}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form
              onSubmit={(e) => { e.preventDefault(); handleSaveItem(); }}
              className="p-6 space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">项目名称</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="请输入项目名称"
                  className="block w-full rounded-lg border border-gray-200 bg-white py-2.5 px-3.5 text-sm text-gray-900 placeholder-gray-400 shadow-xs focus:border-slate-400 focus:ring-2 focus:ring-slate-200/60 focus:outline-none transition-all"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">金额（元）</label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-sm text-gray-400">¥</span>
                  <input
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
                  onClick={() => setItemModal(null)}
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

      {/* --- Item Delete Modal --- */}
      {itemModal?.type === "delete" && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/10 backdrop-blur-sm p-4 anim-in anim-fade"
          onClick={() => setItemModal(null)}
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
                确定要删除「{data[itemModal.groupIndex]?.items[itemModal.itemIndex]?.name}」吗？此操作不可恢复。
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 pb-6">
              <button
                type="button"
                onClick={() => setItemModal(null)}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleDeleteItem}
                className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-600 transition-all"
              >
                删除
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- Transaction Add Modal --- */}
      {txModal?.type === "addTx" && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/10 backdrop-blur-sm p-4 anim-in anim-fade"
          onClick={() => setTxModal(null)}
        >
          <div
            className="w-full max-w-md rounded-xl border border-gray-200 bg-white shadow-xl anim-in anim-fade anim-up"
            style={{ animationDuration: "200ms" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-base font-semibold text-gray-900">添加明细记录</h3>
              <button
                type="button"
                onClick={() => setTxModal(null)}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form
              onSubmit={(e) => { e.preventDefault(); handleSaveTx(); }}
              className="p-6 space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">日期</label>
                <input
                  type="date"
                  value={txDate}
                  onChange={(e) => setTxDate(e.target.value)}
                  className="block w-full rounded-lg border border-gray-200 bg-white py-2.5 px-3.5 text-sm text-gray-900 shadow-xs focus:border-slate-400 focus:ring-2 focus:ring-slate-200/60 focus:outline-none transition-all"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">金额（元）</label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-sm text-gray-400">¥</span>
                  <input
                    type="number"
                    value={txAmount}
                    onChange={(e) => setTxAmount(e.target.value)}
                    placeholder="0.00"
                    step="0.01"
                    className="block w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-8 pr-3.5 text-sm text-gray-900 placeholder-gray-400 shadow-xs focus:border-slate-400 focus:ring-2 focus:ring-slate-200/60 focus:outline-none transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">备注</label>
                <input
                  type="text"
                  value={txRemark}
                  onChange={(e) => setTxRemark(e.target.value)}
                  placeholder="请输入备注"
                  className="block w-full rounded-lg border border-gray-200 bg-white py-2.5 px-3.5 text-sm text-gray-900 placeholder-gray-400 shadow-xs focus:border-slate-400 focus:ring-2 focus:ring-slate-200/60 focus:outline-none transition-all"
                />
              </div>
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setTxModal(null)}
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

      {/* --- Transaction Delete Modal --- */}
      {txModal?.type === "deleteTx" && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/10 backdrop-blur-sm p-4 anim-in anim-fade"
          onClick={() => setTxModal(null)}
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
              <p className="mt-2 text-center text-sm text-gray-500">确定要删除这条记录吗？此操作不可恢复。</p>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 pb-6">
              <button
                type="button"
                onClick={() => setTxModal(null)}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleDeleteTx}
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
```

- [ ] **Step 2: Remove unused imports**

Remove `ChevronLeft`, `ChevronRight` imports (no longer needed).

- [ ] **Step 3: Run build to verify**

```bash
cd apps/personal-web-admin && npx next build 2>&1 | tail -20
```

Expected: Successful build with no errors.

- [ ] **Step 4: Commit**

```bash
git add apps/personal-web-admin/src/app/dashboard/balance-sheet/page.tsx \
        docs/superpowers/specs/2026-06-30-balance-sheet-redesign-design.md \
        docs/superpowers/plans/2026-06-30-balance-sheet-redesign.md
git commit -m "feat: redesign balance sheet page with summary cards, detail list and trend chart"
```
