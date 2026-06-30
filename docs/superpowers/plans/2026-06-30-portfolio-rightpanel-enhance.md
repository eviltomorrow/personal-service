# Portfolio RightPanel Enhancement Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add 持仓占比 with progress bar and 总成本 to detail grid; restyle trade records as cards.

**Architecture:** Single-file modification of `portfolio/page.tsx`. RightPanel gets a `totalValue` prop for percentage calculation.

**Tech Stack:** Next.js 15, React 19, TypeScript, Tailwind CSS

## Global Constraints

- Single file modified: `apps/personal-web-admin/src/app/dashboard/portfolio/page.tsx`
- No new dependencies
- Icons: `TrendUp` already imported

---

### Task 1: RightPanel Enhancement

**Files:**
- Modify: `apps/personal-web-admin/src/app/dashboard/portfolio/page.tsx`

**Interfaces:**
- Consumes: `Position`, `formatCNY()`
- RightPanel gets new prop: `totalValue: number` (portfolio total market value)
- Produces: enhanced detail grid + card-style trade records

- [ ] **Step 1: Add `totalValue` prop to RightPanel**

Update RightPanel interface (line ~153):

```typescript
function RightPanel({
  position, totalValue, onUpdatePosition, onAddTrade, onEditTrade, onDeleteTrade,
  onEditPosition, onDeletePosition,
}: {
  position: Position;
  totalValue: number;
  onUpdatePosition: (id: string, updates: Partial<Position>) => void;
  onAddTrade: (positionId: string) => void;
  onEditTrade: (positionId: string, trade: TradeRecord) => void;
  onDeleteTrade: (positionId: string, tradeId: string) => void;
  onEditPosition: (id: string) => void;
  onDeletePosition: (id: string) => void;
}) {
```

- [ ] **Step 2: Compute totalCost and positionPct**

Add after existing derived values (after line ~175):

```typescript
const totalCost = position.costPrice * position.quantity;
const positionPct = totalValue > 0 ? (position.currentPrice * position.quantity / totalValue) * 100 : null;
```

- [ ] **Step 3: Update detail grid to 3 columns with new fields**

Replace the detail grid `<div className="grid grid-cols-2 gap-x-8 gap-y-3 mb-6">` with:

```tsx
<div className="grid grid-cols-3 gap-x-6 gap-y-4 mb-6">
  <div>
    <span className="text-xs text-gray-500">代码</span>
    <p className="text-sm font-medium text-gray-900 tabular-nums">{position.code}</p>
  </div>
  <div>
    <span className="text-xs text-gray-500">方向</span>
    <p className="text-sm font-medium text-gray-900">
      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${position.direction === "做多" ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20" : "bg-orange-50 text-orange-700 ring-orange-600/20"}`}>
        {position.direction}
      </span>
    </p>
  </div>
  <div>
    <span className="text-xs text-gray-500">持仓占比</span>
    <p className="text-sm font-medium text-gray-900 tabular-nums">
      {positionPct !== null ? (
        <span className="flex items-center gap-2">
          <span className="h-1.5 w-16 rounded-full bg-gray-200 overflow-hidden">
            <span className="block h-full rounded-full bg-slate-600" style={{ width: `${Math.min(positionPct, 100)}%` }} />
          </span>
          <span>{positionPct.toFixed(1)}%</span>
        </span>
      ) : "—"}
    </p>
  </div>
  <div>
    <span className="text-xs text-gray-500">持仓量</span>
    <p className="text-sm font-medium text-gray-900 tabular-nums">
      {position.quantity} {position.type === "股票" ? "股" : "手"}
    </p>
  </div>
  <div>
    <span className="text-xs text-gray-500">总成本</span>
    <p className="text-sm font-medium text-gray-900 tabular-nums">{formatCNY(totalCost)}</p>
  </div>
  <div>
    <span className="text-xs text-gray-500">成本均价</span>
    <p className="text-sm font-medium text-gray-900 tabular-nums">{formatCNY(position.costPrice)}</p>
  </div>
  <div>
    <span className="text-xs text-gray-500">现价</span>
    {/* Preserve inline editing — same as current code */}
  </div>
  <div>
    <span className="text-xs text-gray-500">当前市值</span>
    <p className="text-sm font-semibold text-gray-900 tabular-nums">{formatCNY(marketValue)}</p>
  </div>
  <div className="col-span-3">
    <span className="text-xs text-gray-500">盈亏</span>
    <p className={`text-sm font-semibold tabular-nums ${profitColor}`}>
      {profitSign}{formatCNY(Math.abs(profitAmount))} ({profitSign}{profitPct.toFixed(2)}%)
    </p>
  </div>
</div>
```

- [ ] **Step 4: Replace trade records list with card style**

Replace the trade records section (lines ~298-345) — the div with `border-t` and the `sortedTrades.map` block:

```tsx
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
    <div className="space-y-3">
      {sortedTrades.map((t) => (
        <div key={t.id} className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                t.type === "买入" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
              }`}>
                {t.type}
              </span>
              <span className="text-sm text-gray-500 tabular-nums">{t.date}</span>
            </div>
            <div className="flex items-center gap-0.5">
              <button onClick={() => onEditTrade(position.id, t)}
                className="rounded p-1 text-gray-300 hover:text-gray-500 transition-colors">
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => onDeleteTrade(position.id, t.id)}
                className="rounded p-1 text-gray-300 hover:text-red-400 transition-colors">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
          <div className="flex items-baseline gap-1.5 mb-1">
            <span className="text-sm font-medium text-gray-900 tabular-nums">
              {formatCNY(t.price)} × {t.quantity}
            </span>
            <span className="text-xs text-gray-400">=</span>
            <span className="text-sm font-semibold text-gray-900 tabular-nums">
              {formatCNY(t.price * t.quantity)}
            </span>
          </div>
          {t.note && <p className="text-xs text-gray-400">{t.note}</p>}
        </div>
      ))}
    </div>
  )}
</div>
```

- [ ] **Step 5: Pass totalValue in PortfolioPage**

In PortfolioPage, compute totalValue and pass to RightPanel (line ~722 area):

```typescript
const totalPortfolioValue = useMemo(
  () => positions.reduce((sum, p) => sum + p.currentPrice * p.quantity, 0),
  [positions]
);
```

Add prop to RightPanel usage (line ~724):
```typescript
<RightPanel
  position={selectedPosition}
  totalValue={totalPortfolioValue}
  ...
/>
```

- [ ] **Step 6: Verify build**

Run: `cd apps/personal-web-admin && npm run build`
