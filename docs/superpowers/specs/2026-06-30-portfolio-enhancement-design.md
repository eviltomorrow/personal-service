# Portfolio Enhancement — Code, Direction & Auto Quantity

**Date:** 2026-06-30
**Status:** Draft
**Version:** 1.0

## Objective

Enhance the portfolio (投资组合) page to support trading code, position direction (long/short), and auto-calculated position quantity from trade records.

## Scope

Single file: `apps/personal-web-admin/src/app/dashboard/portfolio/page.tsx`

## Data Model

```typescript
interface Position {
  id: string;
  code: string;            // 交易代码 (e.g., 600519.SH, BTC/USD)
  name: string;            // 名称 (formerly 品种名称)
  type: "股票" | "期货";   // 类型 (unchanged)
  direction: "做多" | "做空"; // 方向 (new)
  initialQty: number;      // 初始持仓量 (set at creation, defaults to 0)
  quantity: number;        // 持仓量 (auto-calculated: initialQty + trade net)
  currentPrice: number;    // 现价
  costPrice: number;       // 成本均价 (weighted average from trades)
  trades: TradeRecord[];
}

interface TradeRecord {
  id: string;
  type: "买入" | "卖出";
  date: string;
  price: number;
  quantity: number;
  note?: string;
}
```

## Quantity Auto-Calculation

Position quantity is recalculated whenever trades are added, edited, or deleted:

```
quantity = initialQty + Σ(买入 qty) - Σ(卖出 qty)
```

- `initialQty` is stored on the Position object and set at creation (optional, defaults to 0)
- 买入 trade → adds to quantity
- 卖出 trade → subtracts from quantity
- Editing a trade → full recalculation from all trades
- Deleting a trade → full recalculation from remaining trades
- Removing the last trade does NOT reset initialQty — it stays as the starting balance

```typescript
function calcQuantity(trades: TradeRecord[], initialQty: number): number {
  return trades.reduce((qty, t) => {
    return t.type === "买入" ? qty + t.quantity : qty - t.quantity;
  }, Math.max(0, initialQty));
}
```

Note: quantity never goes below 0 (clipped). If a user sells more than the current position via trades, quantity is floored at 0. This is consistent with the existing cost price behavior.

Cost price remains weighted average (existing `recalcCostPrice` unchanged).

## Direction-Aware Profit Calculation

```typescript
function calcDerived(p: Position) {
  const marketValue = p.currentPrice * p.quantity;
  const priceDiff = p.direction === "做多"
    ? p.currentPrice - p.costPrice
    : p.costPrice - p.currentPrice;
  const profitAmount = p.quantity > 0 ? priceDiff * p.quantity : 0;
  const profitPct = p.costPrice > 0 && p.quantity > 0
    ? (priceDiff / p.costPrice) * 100
    : 0;
  return { marketValue, profitAmount, profitPct };
}
```

## Form Changes (AddPositionForm)

| Field | Change |
|-------|--------|
| 代码 | New required text input, placeholder e.g. "600519.SH" |
| 名称 | Renamed from "品种名称", same behavior |
| 类型 | Unchanged (股票/期货) |
| 方向 | New required select: 做多 / 做空 |
| 持仓量 | Changed from required to optional, default 0 |
| 现价 | Changed from required to optional, default 0 |

New validation:
- 代码 is required
- 名称 is required
- 方向 is required
- 持仓量 (if provided) must be >= 0
- 现价 (if provided) must be >= 0

## UI Display Changes

### Left Panel (LeftPanel)
- Each position row shows: `{code} {name}`
- If direction is "做空", show a "空" badge next to the name
- Market value column unchanged

### Right Panel (RightPanel)
- Header: show `{code} {name}` + type badge + direction badge
- Detail grid: add row for 代码 (code) and 方向 (direction)
- 持仓量: change from editable to read-only display (auto-calculated)
- 成本均价: unchanged (calculated from trades)
- 现价: keep inline editing (unchanged)
- Trade list: unchanged (already has 买入/卖出)

### Trade Records
- No changes to TradeForm or trade display
- 买入/卖出 direction in trades is unchanged

## Implementation Details

- All changes in a single file: `portfolio/page.tsx`
- No new dependencies
- No persistence changes (data remains in React state only)

## Test Plan

- Create position with code, direction, zero initial quantity
- Add buy trades → verify quantity increases
- Add sell trades → verify quantity decreases
- Edit a trade → verify quantity recalculates
- Delete a trade → verify quantity recalculates
- Verify profit sign is correct for 做多 (long) vs 做空 (short)
- Verify left panel shows code and direction badge
- Verify right panel shows code and direction in details
