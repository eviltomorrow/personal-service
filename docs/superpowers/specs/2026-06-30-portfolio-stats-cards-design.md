# Portfolio Stats Cards

**Date:** 2026-06-30
**Status:** Draft
**Version:** 1.0

## Objective

Add a portfolio summary stats bar (5 stat cards) above the content area on the portfolio page to fill empty space and provide at-a-glance overview.

## Scope

Single file: `apps/personal-web-admin/src/app/dashboard/portfolio/page.tsx`

## Layout

```
[PageHeader]
[StatCards × 5 (responsive grid)]    ← NEW
[TrendChart]
[LeftPanel]  [RightPanel]
```

Stat cards grid: 5 columns → 3 columns (md) → 1 column (sm).

## Cards

| # | Label | Icon | Formula |
|---|-------|------|---------|
| 1 | 总品种数 | `Layers` | `positions.length` |
| 2 | 总市值 | `DollarSign` | `Σ currentPrice × quantity` |
| 3 | 总盈亏 | `TrendUp` | `Σ direction-aware profit` |
| 4 | 总收益率 | `Percent` | `totalProfit / Σ(costPrice × quantity)` |
| 5 | 多空比 | `ArrowUpDown` | `做多 count : 做空 count` |

## Card UI

Each card:
- Rounded border, white bg, shadow-sm
- Icon in a colored rounded square (light bg)
- Label in small gray text
- Value in large bold tabular-nums
- 总盈亏 card: green text when profit, red when loss
- 总收益率: displayed as percentage with 2 decimal places
- 多空比: displayed as "N : M"

## Component

New inline component `StatCards` inside `portfolio/page.tsx`:

```typescript
function StatCards({ positions }: { positions: Position[] }) {
  // compute totals
  // render 5 cards in grid
}
```

## Empty State

When no positions exist, all cards show `0` or `—`. Cards remain visible.
- 总品种数: `0`
- 总市值: `¥ 0.00`
- 总盈亏: `¥ 0.00`
- 总收益率: `—` (when total cost is 0, avoid division by zero)
- 多空比: `0 : 0`

## Dependencies

- `lucide-react`: `Layers`, `DollarSign`, `TrendUp`, `Percent`, `ArrowUpDown`
- No new packages
