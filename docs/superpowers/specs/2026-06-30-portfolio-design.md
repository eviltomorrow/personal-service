# Portfolio Tracking Page — Design Spec

**Date:** 2026-06-30
**Project:** personal-web-admin (Next.js 15 + React 19)
**Status:** Draft

## Overview

New page at `/dashboard/portfolio` for tracking stock and commodity futures positions. All data in-memory (React state), no data fetching. Follows existing dashboard patterns (balance-sheet, cash-flow) in style, modal patterns, and component conventions.

## Route & Navigation

- Route: `/dashboard/portfolio`
- Nav item in sidebar: `"投资组合"` with `TrendingUp` icon
- Inserted between "收入与支出" and "博客" in nav items

## Data Model

### Position

```typescript
interface Position {
  id: string;           // unique key
  name: string;         // e.g. "贵州茅台"
  type: "股票" | "期货";
  quantity: number;     // shares/contracts held
  currentPrice: number; // latest price, manually entered
  costPrice: number;    // weighted average buy price (auto-calculated)
  trades: TradeRecord[];
}
```

Derived (computed, not stored):

```
marketValue = currentPrice × quantity
profitAmount = (currentPrice - costPrice) × quantity
profitPct = (currentPrice - costPrice) / costPrice × 100
```

### TradeRecord

```typescript
interface TradeRecord {
  id: string;
  type: "买入" | "卖出";
  date: string;         // "YYYY-MM-DD"
  price: number;        // execution price
  quantity: number;
  note?: string;
}
```

### ValueSnapshot

A snapshot is taken whenever `currentPrice` is modified on any position. Keyed by date — if a snapshot for today already exists, it is updated in place (one snapshot per day, last price of the day wins).

```typescript
interface ValueSnapshot {
  date: string;   // ISO date
  totalValue: number;  // sum of all positions' marketValue
}
```

## Cost Price Calculation

Weighted average cost price:

```
costPrice = sum of (buy price × buy quantity) / total buy quantity
```

Only buy trades affect cost price. Sell trades reduce quantity but do not change cost price. When quantity reaches 0 and a new buy trade is added, costPrice resets to that new buy price.

Example: Buy 200 shares @ ¥1,480, then buy 100 shares @ ¥1,510
→ costPrice = (200 × 1480 + 100 × 1510) / 300 = ¥1,490

## Page Layout

### Full-width top: Trend Chart

SVG-based line chart showing total portfolio value over time. x-axis = dates, y-axis = total value. Data sourced from `ValueSnapshot[]`. Pure SVG — no external chart library.

- Line color: slate (matching existing palette)
- If 0 or 1 snapshots: show placeholder text "暂无足够数据绘制趋势图"
- Automatically scales y-axis to data range
- Responsive width, fixed ~240px height

### Two-column layout below

```
Left panel (w-[320px] shrink-0)    | Right panel (flex-1)
────────────────────────────────────┼─────────────────────────────────
Header: "持仓列表"                  | (When no position selected)
Each position row:                  | placeholder: "请从左侧选择一个品种"
  - name + type tag + marketValue   |
  - onClick → select position       |
    - selected row: `bg-slate-100` highlight | (When position selected)
                                    | Header: name + type tag
Add position button (bottom)        | Detail fields (read-only display):
                                    |   持仓量, 现价(可编辑), 均价,
                                    |   市值, 盈亏(金额+百分比)
                                    | Edit/Delete actions in header
                                    | ──────────────
                                    | Sub-header: "买卖记录"
                                    | Trade record list (date desc)
                                    | Each row: type + date + price + qty
                                    |   + edit/delete actions
                                    | Add trade button
```

### Right panel detail fields

All fields displayed as text (not inputs) except `currentPrice` which is editable inline:

```
现价: ¥1,500.00  [📝]  ← click pencil to enter edit mode
```

When editing, show a small input + confirm/cancel buttons inline.

### Type tags

- 股票 → green badge (`bg-emerald-50 text-emerald-700 ring-emerald-600/20`)
- 期货 → blue badge (`bg-blue-50 text-blue-700 ring-blue-600/20`)

### Profit/Loss display

- Positive: green text (`text-emerald-600`)
- Negative: red text (`text-red-600`)
- Format: `+¥ 1,350.00 (+1.35%)` or `-¥ 500.00 (-3.2%)`

## CRUD Operations

All modals follow the same pattern as cash-flow and balance-sheet pages:
- Centered modal with semi-transparent backdrop
- Form fields with labels
- Confirm + Cancel buttons
- AutoFocus the first input on open

### Operations

| Operation | Trigger | Notes |
|-----------|---------|-------|
| Add position | Left panel bottom "+ 新增品种" | Fields: name, type(select), quantity, currentPrice |
| Edit position | Right panel header edit icon | Edit name, type, quantity, currentPrice |
| Delete position | Right panel header delete icon | Confirmation: cascading delete of trades + all snapshots (portfolio changed materially) |
| Edit currentPrice | Right panel inline edit on price field | Auto-recalculates marketValue/profit, appends snapshot |
| Add trade | Right panel bottom "+ 新增记录" | Fields: type(买入/卖出), date, price, quantity, note(optional) |
| Edit trade | Trade row edit icon | Same fields, pre-filled |
| Delete trade | Trade row delete icon | Confirmation; triggers costPrice recalculation |

## State Management

```typescript
const [positions, setPositions] = useState<Position[]>([]);
const [selectedId, setSelectedId] = useState<string | null>(null);
const [snapshots, setSnapshots] = useState<ValueSnapshot[]>([]);
```

All mutations use functional updates. Helper functions for:
- `recalcCostPrice(positionId)` — walks trades, recalculates weighted average
- `recalcSnapshots()` — rebuilds snapshots from current prices
- `deletePositionCascade(positionId)` — removes position + trades

## Styling Conventions

- Same as existing pages: Tailwind CSS v4, gray/slate palette
- Cards: `rounded-xl border border-gray-200 bg-white shadow-sm`
- Buttons: `rounded-lg p-2 text-gray-400 hover:bg-slate-100 hover:text-slate-600`
- Modals: `rounded-xl border border-gray-200 bg-white shadow-xl`
- `formatCNY` utility: same implementation as cash-flow page

## Edge Cases & Error Handling

- **Empty state (no positions):** Both panels show appropriate empty messages; trend placeholder
- **No snapshots (only 1 price entry):** Trend chart shows placeholder text
- **No trades (fresh position):** costPrice = currentPrice, profit = 0, trade list shows "暂无记录"
- **All positions sold (quantity = 0):** Position remains visible until deleted; shows 0 quantity
- **Negative quantity:** Prevented at input — min 0 for quantity, min 0.01 for price
- **Invalid price input:** Input validation prevents non-numeric values

## Files Changed

| File | Change |
|------|--------|
| `src/app/dashboard/portfolio/page.tsx` | **New** — full page component (~500-600 lines) |
| `src/app/dashboard/layout.tsx` | Add nav item "投资组合" with `TrendingUp` icon; add to import |

## Out of Scope

- Real-time price feeds or API integration
- Persistent storage (localStorage or backend)
- Export/import functionality
- Multi-currency support
- Dividend/corporate action tracking
