# Portfolio Tracking Page — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a stock/commodity futures portfolio tracking page at `/dashboard/portfolio` with positions list, detail panel, trade records, and trend chart.

**Architecture:** Single "use client" page component (~550-650 lines) following the existing cash-flow and balance-sheet patterns. All data in React state (in-memory), no external dependencies. SVG line chart drawn inline — no chart library.

**Tech Stack:** Next.js 15, React 19, TypeScript, Tailwind CSS v4, lucide-react

## Global Constraints

- No external UI libraries or chart libraries
- All data in React state (useState), no data fetching
- Amounts displayed in CNY format using `formatCNY` from existing pattern
- Colors: green for profit/income, red for loss/expense, slate/gray palette
- Modal patterns follow cash-flow page exactly

---

### Task 1: Navigation & Page Shell

**Files:**
- Create: `src/app/dashboard/portfolio/page.tsx`
- Modify: `src/app/dashboard/layout.tsx`

**Interfaces:**
- Consumes: layout nav items array, lucide-react icons
- Produces: `/dashboard/portfolio` route accessible via sidebar

- [ ] **Step 1: Add nav item to layout.tsx**

Add `TrendingUp` to the lucide-react import and insert the nav item:

```tsx
// In import:
  LayoutDashboard, Settings, Shield, Bell, Search, Menu, X, ChevronDown,
  HelpCircle, Sparkles, User, CreditCard, LogOut,
  Clock, ShoppingCart, MessageCircle, Feather, BookOpen, Plus,
  Wallet, TrendingUp,
} from "lucide-react";

// In navItems array, between "收入与支出" and "博客":
  { label: "投资组合", href: "/dashboard/portfolio", icon: TrendingUp },
```

- [ ] **Step 2: Create page shell with types**

```typescript
// src/app/dashboard/portfolio/page.tsx
"use client";

import { useState, useMemo, useRef } from "react";
import { PageHeader } from "@/components/page-header";
import {
  TrendingUp, Plus, Pencil, Trash2, X, AlertTriangle,
  ChevronLeft, ChevronRight, ArrowUpRight, ArrowDownRight,
} from "lucide-react";

let nextId = 1;
function genId() { return String(nextId++); }

interface TradeRecord {
  id: string;
  type: "买入" | "卖出";
  date: string;
  price: number;
  quantity: number;
  note?: string;
}

interface Position {
  id: string;
  name: string;
  type: "股票" | "期货";
  quantity: number;
  currentPrice: number;
  costPrice: number;
  trades: TradeRecord[];
}

interface ValueSnapshot {
  date: string;
  totalValue: number;
}

function formatCNY(amount: number) {
  const prefix = amount < 0 ? "- " : "";
  return `${prefix}¥ ${Math.abs(amount).toLocaleString("zh-CN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
```

- [ ] **Step 3: Add state and default data, render empty page**

```tsx
export default function PortfolioPage() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [snapshots, setSnapshots] = useState<ValueSnapshot[]>([]);

  const selectedPosition = useMemo(
    () => positions.find((p) => p.id === selectedId) ?? null,
    [positions, selectedId]
  );

  const totalMarketValue = useMemo(
    () => positions.reduce((s, p) => s + p.currentPrice * p.quantity, 0),
    [positions]
  );

  return (
    <div className="space-y-6 anim-in anim-fade anim-up" style={{ animationDuration: "500ms" }}>
      <PageHeader title="投资组合" description="股票与期货持仓监控" />
      <p className="text-sm text-gray-500">暂无持仓数据，请添加品种。</p>
    </div>
  );
}
```

- [ ] **Step 4: Build verify**

Run: `npx next build` in `apps/personal-web-admin/` — expect success.

- [ ] **Step 5: Commit**

```bash
git add apps/personal-web-admin/src/app/dashboard/layout.tsx apps/personal-web-admin/src/app/dashboard/portfolio/page.tsx
git commit -m "feat: add portfolio page shell and nav item"
```

---

### Task 2: Left Panel — Position List

**Files:**
- Modify: `src/app/dashboard/portfolio/page.tsx`

**Interfaces:**
- Consumes: `positions[]`, `selectedId`, `setSelectedId`
- Produces: left panel with position list, add position button triggers modal

- [ ] **Step 1: Replace the placeholder paragraph with full layout structure**

```tsx
return (
  <div className="space-y-6 anim-in anim-fade anim-up" style={{ animationDuration: "500ms" }}>
    <PageHeader title="投资组合" description="股票与期货持仓监控" />

    {/* Trend chart area — placeholder for Task 4 */}
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6">
      <h3 className="text-sm font-semibold text-gray-900 mb-1">总市值趋势</h3>
      <p className="text-xs text-gray-500">暂无足够数据绘制趋势图</p>
    </div>

    {/* Two-column layout */}
    <div className="flex gap-6">
      {/* Left panel */}
      <LeftPanel
        positions={positions}
        selectedId={selectedId}
        onSelect={setSelectedId}
        onAdd={() => {}}
      />

      {/* Right panel */}
      <div className="flex-1 rounded-xl border border-gray-200 bg-white shadow-sm p-6">
        {selectedPosition ? (
          <p className="text-sm text-gray-500">{selectedPosition.name} — 详情区（待实现）</p>
        ) : (
          <p className="text-sm text-gray-500">请从左侧选择一个品种</p>
        )}
      </div>
    </div>
  </div>
);
```

- [ ] **Step 2: Implement LeftPanel component**

Add above the main component:

```tsx
function LeftPanel({
  positions, selectedId, onSelect, onAdd,
}: {
  positions: Position[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAdd: () => void;
}) {
  return (
    <div className="w-[320px] shrink-0 rounded-xl border border-gray-200 bg-white shadow-sm flex flex-col">
      <div className="px-4 py-3 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-900">持仓列表</h3>
      </div>
      <div className="flex-1 overflow-y-auto">
        {positions.length === 0 ? (
          <p className="px-4 py-6 text-sm text-gray-400 text-center">暂无持仓</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {positions.map((p) => {
              const mv = p.currentPrice * p.quantity;
              const isSelected = p.id === selectedId;
              return (
                <button
                  key={p.id}
                  onClick={() => onSelect(p.id)}
                  className={`w-full flex items-center justify-between px-4 py-3 text-left transition-colors hover:bg-slate-50 ${
                    isSelected ? "bg-slate-100" : ""
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-sm font-medium text-gray-900 truncate">{p.name}</span>
                    <span className={`shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${
                      p.type === "股票"
                        ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20"
                        : "bg-blue-50 text-blue-700 ring-blue-600/20"
                    }`}>
                      {p.type}
                    </span>
                  </div>
                  <span className="text-sm text-gray-700 tabular-nums ml-3">{formatCNY(mv)}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
      <div className="px-4 py-3 border-t border-gray-100">
        <button
          onClick={onAdd}
          className="flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-500 transition-colors"
        >
          <Plus className="h-4 w-4" />
          新增品种
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Build verify**

Run: `npx next build` — expect success.

- [ ] **Step 4: Commit**

```bash
git add apps/personal-web-admin/src/app/dashboard/portfolio/page.tsx
git commit -m "feat: add left panel with position list"
```

---

### Task 3: Right Panel — Position Detail + Trade List

**Files:**
- Modify: `src/app/dashboard/portfolio/page.tsx`

**Interfaces:**
- Consumes: `selectedPosition`, `setPositions`, `setSnapshots`
- Produces: detail view with fields, inline price editing, trade list

- [ ] **Step 1: Add helper functions**

Insert before the main component:

```tsx
function recalcCostPrice(trades: TradeRecord[]): number {
  let totalQty = 0;
  let totalCost = 0;
  for (const t of trades) {
    if (t.type === "买入") {
      totalQty += t.quantity;
      totalCost += t.price * t.quantity;
    } else {
      totalQty -= t.quantity;
    }
    if (totalQty < 0) totalQty = 0;
  }
  if (totalQty <= 0) return 0;
  return totalCost / totalQty;
}

function calcDerived(p: Position) {
  const marketValue = p.currentPrice * p.quantity;
  const profitAmount = p.quantity > 0 ? (p.currentPrice - p.costPrice) * p.quantity : 0;
  const profitPct = p.costPrice > 0 && p.quantity > 0
    ? ((p.currentPrice - p.costPrice) / p.costPrice) * 100
    : 0;
  return { marketValue, profitAmount, profitPct };
}
```

- [ ] **Step 2: Implement RightPanel component**

Add above the main component:

```tsx
function RightPanel({
  position, onUpdatePosition, onAddTrade, onEditTrade, onDeleteTrade,
  onEditPosition, onDeletePosition,
}: {
  position: Position;
  onUpdatePosition: (id: string, updates: Partial<Position>) => void;
  onAddTrade: (positionId: string) => void;
  onEditTrade: (positionId: string, trade: TradeRecord) => void;
  onDeleteTrade: (positionId: string, tradeId: string) => void;
  onEditPosition: (id: string) => void;
  onDeletePosition: (id: string) => void;
}) {
  const { marketValue, profitAmount, profitPct } = useMemo(
    () => calcDerived(position),
    [position]
  );
  const [editingPrice, setEditingPrice] = useState(false);
  const [priceDraft, setPriceDraft] = useState(String(position.currentPrice));

  const sortedTrades = useMemo(
    () => [...position.trades].sort((a, b) => b.date.localeCompare(a.date)),
    [position.trades]
  );

  const profitColor = profitAmount >= 0 ? "text-emerald-600" : "text-red-600";
  const profitSign = profitAmount >= 0 ? "+" : "";

  return (
    <div className="flex-1 rounded-xl border border-gray-200 bg-white shadow-sm p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-semibold text-gray-900">{position.name}</h3>
          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${
            position.type === "股票"
              ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20"
              : "bg-blue-50 text-blue-700 ring-blue-600/20"
          }`}>
            {position.type}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onEditPosition(position.id)}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDeletePosition(position.id)}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Detail fields */}
      <div className="grid grid-cols-2 gap-x-8 gap-y-3 mb-6">
        <div>
          <span className="text-xs text-gray-500">持仓量</span>
          <p className="text-sm font-medium text-gray-900 tabular-nums">
            {position.quantity} {position.type === "股票" ? "股" : "手"}
          </p>
        </div>
        <div>
          <span className="text-xs text-gray-500">成本均价</span>
          <p className="text-sm font-medium text-gray-900 tabular-nums">{formatCNY(position.costPrice)}</p>
        </div>
        <div>
          <span className="text-xs text-gray-500">现价</span>
          {editingPrice ? (
            <div className="flex items-center gap-1 mt-0.5">
              <span className="text-sm text-gray-400">¥</span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={priceDraft}
                onChange={(e) => setPriceDraft(e.target.value)}
                className="w-24 rounded-md border border-gray-300 px-2 py-0.5 text-sm text-gray-900 tabular-nums focus:border-slate-400 focus:ring-2 focus:ring-slate-200/60 focus:outline-none"
                autoFocus
              />
              <button
                onClick={() => {
                  const v = parseFloat(priceDraft);
                  if (!isNaN(v) && v > 0) {
                    onUpdatePosition(position.id, { currentPrice: v });
                  }
                  setEditingPrice(false);
                }}
                className="text-xs font-medium text-slate-600 hover:text-slate-500"
              >
                确认
              </button>
              <button
                onClick={() => { setEditingPrice(false); setPriceDraft(String(position.currentPrice)); }}
                className="text-xs text-gray-400 hover:text-gray-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-medium text-gray-900 tabular-nums">{formatCNY(position.currentPrice)}</p>
              <button
                onClick={() => { setEditingPrice(true); setPriceDraft(String(position.currentPrice)); }}
                className="text-gray-300 hover:text-gray-500 transition-colors"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
        <div>
          <span className="text-xs text-gray-500">当前市值</span>
          <p className="text-sm font-semibold text-gray-900 tabular-nums">{formatCNY(marketValue)}</p>
        </div>
        <div className="col-span-2">
          <span className="text-xs text-gray-500">盈亏</span>
          <p className={`text-sm font-semibold tabular-nums ${profitColor}`}>
            {profitSign}{formatCNY(Math.abs(profitAmount))} ({profitSign}{profitPct.toFixed(2)}%)
          </p>
        </div>
      </div>

      {/* Trade records */}
      <div className="border-t border-gray-100 pt-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-gray-900">买卖记录</h4>
          <button
            onClick={() => onAddTrade(position.id)}
            className="flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-slate-500 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            新增记录
          </button>
        </div>
        {sortedTrades.length === 0 ? (
          <p className="text-sm text-gray-400">暂无记录</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {sortedTrades.map((t) => (
              <div key={t.id} className="flex items-center justify-between py-2.5">
                <div className="flex items-center gap-3 min-w-0">
                  <span className={`shrink-0 text-xs font-medium px-1.5 py-0.5 rounded ${
                    t.type === "买入" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                  }`}>
                    {t.type}
                  </span>
                  <span className="text-sm text-gray-500 tabular-nums">{t.date}</span>
                  <span className="text-sm text-gray-900 tabular-nums">
                    {t.price.toFixed(2)} × {t.quantity}
                  </span>
                  {t.note && <span className="text-xs text-gray-400 truncate">{t.note}</span>}
                </div>
                <div className="flex items-center gap-0.5 shrink-0">
                  <button
                    onClick={() => onEditTrade(position.id, t)}
                    className="rounded p-1 text-gray-300 hover:text-gray-500 transition-colors"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => onDeleteTrade(position.id, t.id)}
                    className="rounded p-1 text-gray-300 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Wire RightPanel into main component**

Replace the right panel placeholder:

```tsx
{selectedPosition ? (
  <RightPanel
    position={selectedPosition}
    onUpdatePosition={handleUpdatePosition}
    onAddTrade={(posId) => setModal({ type: "addTrade", positionId: posId })}
    onEditTrade={(posId, trade) => setModal({ type: "editTrade", positionId: posId, trade })}
    onDeleteTrade={handleDeleteTrade}
    onEditPosition={(id) => setModal({ type: "editPosition", positionId: id })}
    onDeletePosition={handleDeletePosition}
  />
) : (
  <div className="flex-1 rounded-xl border border-gray-200 bg-white shadow-sm p-6 flex items-center justify-center">
    <p className="text-sm text-gray-400">请从左侧选择一个品种</p>
  </div>
)}
```

Add state and handlers in main component:

```tsx
type ModalType =
  | { type: "addPosition" }
  | { type: "editPosition"; positionId: string }
  | { type: "addTrade"; positionId: string }
  | { type: "editTrade"; positionId: string; trade: TradeRecord }
  | { type: "deletePosition"; positionId: string }
  | { type: "deleteTrade"; positionId: string; tradeId: string }
  | null;

const [modal, setModal] = useState<ModalType>(null);

function handleUpdatePosition(id: string, updates: Partial<Position>) {
  const updatedPositions = positions.map((p) =>
    p.id === id ? { ...p, ...updates } : p
  );
  setPositions(updatedPositions);
  if ("currentPrice" in updates) {
    const today = new Date().toISOString().slice(0, 10);
    const newTotal = updatedPositions.reduce((s, p) => s + p.currentPrice * p.quantity, 0);
    setSnapshots((prev) => {
      const existing = prev.findIndex((s) => s.date === today);
      if (existing >= 0) {
        const next = [...prev];
        next[existing] = { ...next[existing], totalValue: newTotal };
        return next;
      }
      return [...prev, { date: today, totalValue: newTotal }];
    });
  }
}

// Placeholder handlers for now
function handleDeleteTrade(positionId: string, tradeId: string) {
  setPositions((prev) =>
    prev.map((p) =>
      p.id === positionId
        ? { ...p, trades: p.trades.filter((t) => t.id !== tradeId), costPrice: recalcCostPrice(p.trades.filter((t) => t.id !== tradeId)) }
        : p
    )
  );
}

function handleDeletePosition(id: string) {
  setPositions((prev) => prev.filter((p) => p.id !== id));
  setSnapshots([]);
  if (selectedId === id) setSelectedId(null);
}
```

- [ ] **Step 4: Build verify**

Run: `npx next build` — expect success.

- [ ] **Step 5: Commit**

```bash
git add apps/personal-web-admin/src/app/dashboard/portfolio/page.tsx
git commit -m "feat: add right panel with detail fields and trade list"
```

---

### Task 4: Modal Components (Add/Edit Position, Add/Edit/Delete Trade, Delete Position)

**Files:**
- Modify: `src/app/dashboard/portfolio/page.tsx`

**Interfaces:**
- Consumes: `modal`, `setModal`, `positions`, `setPositions`, `setSnapshots`
- Produces: all modal dialogs following cash-flow modal patterns

- [ ] **Step 1: Add Modal component**

Insert before the main component:

```tsx
function Modal({
  title, children, onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  const overlayRef = useRef<HTMLDivElement>(null);
  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div
        className="w-full max-w-md rounded-xl border border-gray-200 bg-white shadow-xl anim-in anim-fade anim-down"
        style={{ animationDuration: "200ms" }}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-900">{title}</h3>
          <button onClick={onClose} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Add position form**

```tsx
function AddPositionForm({ initial, onSave, onClose }: {
  initial?: Position;
  onSave: (p: Omit<Position, "id" | "trades" | "costPrice">) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [type, setType] = useState<"股票" | "期货">(initial?.type ?? "股票");
  const [quantity, setQuantity] = useState(initial ? String(initial.quantity) : "");
  const [price, setPrice] = useState(initial ? String(initial.currentPrice) : "");
  const [error, setError] = useState("");

  function handleSubmit() {
    if (!name.trim() || !quantity || !price) { setError("请填写所有必填字段"); return; }
    const q = parseFloat(quantity);
    const p = parseFloat(price);
    if (isNaN(q) || q <= 0) { setError("持仓量必须大于 0"); return; }
    if (isNaN(p) || p <= 0) { setError("价格必须大于 0"); return; }
    onSave({ name: name.trim(), type, quantity: q, currentPrice: p });
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-4">
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">品种名称</label>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} autoFocus
          className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-200/60 focus:outline-none"
          placeholder="如 贵州茅台" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">类型</label>
        <select value={type} onChange={(e) => setType(e.target.value as "股票" | "期货")}
          className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-slate-400 focus:ring-2 focus:ring-slate-200/60 focus:outline-none">
          <option value="股票">股票</option>
          <option value="期货">期货</option>
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">持仓量</label>
          <input type="number" min="0" step="1" value={quantity} onChange={(e) => setQuantity(e.target.value)}
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-slate-400 focus:ring-2 focus:ring-slate-200/60 focus:outline-none"
            placeholder="100" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">现价</label>
          <input type="number" min="0.01" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)}
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-slate-400 focus:ring-2 focus:ring-slate-200/60 focus:outline-none"
            placeholder="1500.00" />
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors">取消</button>
        <button type="submit" className="rounded-lg px-4 py-2 text-sm font-medium text-white bg-slate-600 hover:bg-slate-500 transition-colors">确认</button>
      </div>
    </form>
  );
}
```

- [ ] **Step 3: Add trade form**

```tsx
function TradeForm({
  initial, onSave, onClose,
}: {
  initial?: TradeRecord;
  onSave: (t: Omit<TradeRecord, "id">) => void;
  onClose: () => void;
}) {
  const [type, setType] = useState<"买入" | "卖出">(initial?.type ?? "买入");
  const [date, setDate] = useState(initial?.date ?? new Date().toISOString().slice(0, 10));
  const [price, setPrice] = useState(initial ? String(initial.price) : "");
  const [quantity, setQuantity] = useState(initial ? String(initial.quantity) : "");
  const [note, setNote] = useState(initial?.note ?? "");
  const [error, setError] = useState("");

  function handleSubmit() {
    if (!date || !price || !quantity) { setError("请填写所有必填字段"); return; }
    const p = parseFloat(price);
    const q = parseFloat(quantity);
    if (isNaN(p) || p <= 0) { setError("价格必须大于 0"); return; }
    if (isNaN(q) || q <= 0) { setError("数量必须大于 0"); return; }
    onSave({ type, date, price: p, quantity: q, note: note.trim() || undefined });
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-4">
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">方向</label>
        <select value={type} onChange={(e) => setType(e.target.value as "买入" | "卖出")}
          className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-slate-400 focus:ring-2 focus:ring-slate-200/60 focus:outline-none">
          <option value="买入">买入</option>
          <option value="卖出">卖出</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">日期</label>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} autoFocus
          className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-slate-400 focus:ring-2 focus:ring-slate-200/60 focus:outline-none" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">成交价</label>
          <input type="number" min="0.01" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)}
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-slate-400 focus:ring-2 focus:ring-slate-200/60 focus:outline-none"
            placeholder="1500.00" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">数量</label>
          <input type="number" min="0" step="1" value={quantity} onChange={(e) => setQuantity(e.target.value)}
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-slate-400 focus:ring-2 focus:ring-slate-200/60 focus:outline-none"
            placeholder="100" />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">备注（可选）</label>
        <input type="text" value={note} onChange={(e) => setNote(e.target.value)}
          className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-200/60 focus:outline-none"
          placeholder="备注信息" />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors">取消</button>
        <button type="submit" className="rounded-lg px-4 py-2 text-sm font-medium text-white bg-slate-600 hover:bg-slate-500 transition-colors">确认</button>
      </div>
    </form>
  );
}
```

- [ ] **Step 4: Delete confirm modal**

```tsx
function DeleteConfirm({
  message, onConfirm, onClose,
}: {
  message: string;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="rounded-full bg-red-50 p-3 mb-3">
        <AlertTriangle className="h-6 w-6 text-red-500" />
      </div>
      <p className="text-sm text-gray-700 mb-1">{message}</p>
      <p className="text-xs text-gray-500 mb-4">此操作不可撤销</p>
      <div className="flex gap-2">
        <button onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors">取消</button>
        <button onClick={() => { onConfirm(); onClose(); }} className="rounded-lg px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-500 transition-colors">确认删除</button>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Wire modal rendering into main component**

Add at the end of the main component's return, inside the root div:

```tsx
{/* Modals */}
{modal?.type === "addPosition" && (
  <Modal title="新增品种" onClose={() => setModal(null)}>
    <AddPositionForm
      onSave={(data) => {
        const id = genId();
        setPositions((prev) => [...prev, { ...data, id, costPrice: data.currentPrice, trades: [] }]);
        setSnapshots((prev) => {
          const today = new Date().toISOString().slice(0, 10);
          const newTotal = positions.reduce((s, p) => s + p.currentPrice * p.quantity, 0) + data.currentPrice * data.quantity;
          const existing = prev.findIndex((s) => s.date === today);
          if (existing >= 0) {
            const next = [...prev];
            next[existing] = { ...next[existing], totalValue: newTotal };
            return next;
          }
          return [...prev, { date: today, totalValue: newTotal }];
        });
        setSelectedId(id);
        setModal(null);
      }}
      onClose={() => setModal(null)}
    />
  </Modal>
)}

{modal?.type === "editPosition" && (() => {
  const p = positions.find((x) => x.id === modal.positionId);
  if (!p) return null;
  return (
    <Modal title="编辑品种" onClose={() => setModal(null)}>
      <AddPositionForm
        initial={p}
        onSave={(data) => {
          handleUpdatePosition(modal.positionId, data);
          setModal(null);
        }}
        onClose={() => setModal(null)}
      />
    </Modal>
  );
})()}

{modal?.type === "deletePosition" && (
  <Modal title="删除品种" onClose={() => setModal(null)}>
    <DeleteConfirm
      message="删除此品种将同时清除所有关联的买卖记录和趋势数据。"
      onConfirm={() => { handleDeletePosition(modal.positionId); }}
      onClose={() => setModal(null)}
    />
  </Modal>
)}

{modal?.type === "addTrade" && (
  <Modal title="新增记录" onClose={() => setModal(null)}>
    <TradeForm
      onSave={(data) => {
        const newTrade = { id: genId(), ...data };
        setPositions((prev) =>
          prev.map((p) => {
            if (p.id !== modal.positionId) return p;
            const newTrades = [...p.trades, newTrade];
            return { ...p, trades: newTrades, costPrice: recalcCostPrice(newTrades) };
          })
        );
        setModal(null);
      }}
      onClose={() => setModal(null)}
    />
  </Modal>
)}

{modal?.type === "editTrade" && (
  <Modal title="编辑记录" onClose={() => setModal(null)}>
    <TradeForm
      initial={modal.trade}
      onSave={(data) => {
        setPositions((prev) =>
          prev.map((p) =>
            p.id === modal.positionId
              ? { ...p, trades: p.trades.map((t) => t.id === modal.trade.id ? { ...t, ...data } : t) }
              : p
          )
        );
        setModal(null);
      }}
      onClose={() => setModal(null)}
    />
  </Modal>
)}

{modal?.type === "deleteTrade" && (
  <Modal title="删除记录" onClose={() => setModal(null)}>
    <DeleteConfirm
      message="确定要删除此买卖记录吗？"
      onConfirm={() => { handleDeleteTrade(modal.positionId, modal.tradeId); }}
      onClose={() => setModal(null)}
    />
  </Modal>
)}
```

- [ ] **Step 6: Build verify**

Run: `npx next build` — expect success.

- [ ] **Step 7: Commit**

```bash
git add apps/personal-web-admin/src/app/dashboard/portfolio/page.tsx
git commit -m "feat: add all CRUD modals for portfolio page"
```

---

### Task 5: Trend Chart (SVG)

**Files:**
- Modify: `src/app/dashboard/portfolio/page.tsx`

**Interfaces:**
- Consumes: `snapshots[]`
- Produces: SVG line chart in the top area

- [ ] **Step 1: Add TrendChart component**

Insert before the main component:

```tsx
function TrendChart({ snapshots }: { snapshots: ValueSnapshot[] }) {
  if (snapshots.length < 2) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-1">总市值趋势</h3>
        <p className="text-xs text-gray-500">暂无足够数据绘制趋势图</p>
      </div>
    );
  }

  const sorted = [...snapshots].sort((a, b) => a.date.localeCompare(b.date));
  const values = sorted.map((s) => s.totalValue);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const padding = range * 0.1;
  const paddedMin = min - padding;
  const paddedMax = max + padding;
  const paddedRange = paddedMax - paddedMin;

  const W = 700; // viewBox width
  const H = 200; // viewBox height
  const count = sorted.length;
  const stepX = count > 1 ? W / (count - 1) : W / 2;

  const points = sorted.map((s, i) => {
    const x = count > 1 ? i * stepX : W / 2;
    const y = H - ((s.totalValue - paddedMin) / paddedRange) * H * 0.85 - H * 0.075;
    return `${x},${y}`;
  });

  const pathD = `M ${points.join(" L ")}`;

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900">总市值趋势</h3>
        <p className="text-xs text-gray-500 tabular-nums">
          {formatCNY(sorted[sorted.length - 1].totalValue)}
        </p>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-[240px]" preserveAspectRatio="xMidYMid meet">
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
          const y = H - ratio * H * 0.85 - H * 0.075;
          return (
            <g key={ratio}>
              <line x1={0} y1={y} x2={W} y2={y} stroke="#e2e8f0" strokeWidth="1" />
              <text x={W - 4} y={y + 3} textAnchor="end" className="fill-gray-400" fontSize="10">
                {formatCNY(paddedMin + ratio * paddedRange)}
              </text>
            </g>
          );
        })}
        {/* Area fill */}
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#64748b" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#64748b" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <path d={`${pathD} L ${points[points.length - 1].split(",")[0]},${H} L ${points[0].split(",")[0]},${H} Z`} fill="url(#areaGrad)" />
        {/* Line */}
        <path d={pathD} fill="none" stroke="#64748b" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        {/* Dots */}
        {sorted.map((s, i) => {
          const [cx, cy] = points[i].split(",");
          return <circle key={s.date} cx={cx} cy={cy} r="3" fill="#64748b" className="hover:r-4" />;
        })}
        {/* X-axis labels */}
        {sorted.filter((_, i) => i === 0 || i === count - 1 || (i % Math.max(1, Math.floor(count / 5)) === 0)).map((s, i) => {
          const idx = sorted.indexOf(s);
          const x = count > 1 ? idx * stepX : W / 2;
          return (
            <text key={s.date} x={x} y={H - 4} textAnchor="middle" className="fill-gray-400" fontSize="10">
              {s.date.slice(5)}
            </text>
          );
        })}
      </svg>
    </div>
  );
}
```

- [ ] **Step 2: Replace trend chart placeholder in main component**

Replace:
```tsx
{/* Trend chart area — placeholder for Task 4 */}
<div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6">
  <h3 className="text-sm font-semibold text-gray-900 mb-1">总市值趋势</h3>
  <p className="text-xs text-gray-500">暂无足够数据绘制趋势图</p>
</div>
```

With:
```tsx
<TrendChart snapshots={snapshots} />
```

- [ ] **Step 3: Build verify**

Run: `npx next build` — expect success.

- [ ] **Step 4: Commit**

```bash
git add apps/personal-web-admin/src/app/dashboard/portfolio/page.tsx
git commit -m "feat: add SVG trend chart for portfolio total value"
```
