# Portfolio RightPanel Enhancement

**Date:** 2026-06-30
**Status:** Draft
**Version:** 1.0

## Objective

Add position-level financial indicators (持仓占比, 总成本) to the detail grid and restyle trade records as cards.

## Scope

Single file: `apps/personal-web-admin/src/app/dashboard/portfolio/page.tsx`

## Detail Grid Changes

Expand from 2-column to 3-column grid. Add:

| Field | Formula | Display |
|-------|---------|---------|
| 总成本 | `costPrice × quantity` | `¥ X,XXX.XX` |
| 持仓占比 | `positionMarketValue / totalPortfolioValue × 100` | Progress bar + `XX.X%` |

For 持仓占比:
- totalPortfolioValue = `Σ all positions' currentPrice × quantity`
- If totalPortfolioValue is 0, show `—`
- Progress bar: inline div with bg-slate-200 track and bg-slate-600 fill, width = percentage

## Trade Records → Card Style

Each trade record becomes a rounded card with border + shadow-sm:

```
┌──────────────────────────────────────┐
│ [买入/卖出 badge]  2026-06-30       │
│ ¥ 150.00 × 100  =  ¥ 15,000.00     │
│ 备注文本（如果有）                   │
│ [编辑] [删除]                       │
└──────────────────────────────────────┘
```

Key changes:
- Each record: rounded-xl border border-gray-200 bg-white p-4
- Badge: 买入 green / 卖出 red (same as current)
- Price and quantity: larger font, tabular-nums
- Computed total: `price × quantity` as `¥ XX,XXX.XX`
- Note: gray small text, only shown if present
- Edit/delete buttons: bottom right corner
- Records stack vertically with gap-3
- No more horizontal divider between records

## Empty State

- Detail grid: when totalPortfolioValue is 0, show `—` for 持仓占比
- Trade records: no change to empty state (already shows "暂无记录")
