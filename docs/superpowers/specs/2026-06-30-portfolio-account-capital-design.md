# Portfolio Account Capital

**Date:** 2026-06-30
**Status:** Draft
**Version:** 1.0

## Objective

Add editable initial capital breakdown (futures account + stock account) and use total capital for return rate calculation.

## Scope

Single file: `apps/personal-web-admin/src/app/dashboard/portfolio/page.tsx`

## Layout

```
[PageHeader]
[期货本金 | 股票本金 | 总本金]      ← NEW
[StatCards × 5]
[TrendChart]
[LeftPanel]  [RightPanel]
```

## Account Capital Card Row

Three cards in a `grid grid-cols-3 gap-4`:

| Card | Behavior |
|------|----------|
| 期货账户本金 | Editable number input, default `""` (empty = 0), formatted as `¥ X,XXX.XX` when not focused |
| 股票账户本金 | Editable number input, default `""` (empty = 0) |
| 总本金 | Read-only sum, `¥ X,XXX.XX` |

Visual style: same as StatCards — rounded-xl border border-gray-200 bg-white shadow-sm p-4.

Editing UX:
- When not focused: show formatted value `¥ 100,000.00`
- When focused: show plain number input (no border, just the number)
- On blur: parse and store the value

## State

```typescript
const [futuresCapital, setFuturesCapital] = useState(0);
const [stockCapital, setStockCapital] = useState(0);
const totalCapital = futuresCapital + stockCapital;
```

Stored in PortfolioPage, passed down as needed.

## Impact on StatCards

- 总收益率: change from `totalProfit / totalCost` to `totalProfit / totalCapital`
- When `totalCapital === 0`, show `—`
- Display the total capital value somewhere (e.g., existing 总市值 card or new display)

## Persistence

Same as positions — React state only, no persistence (consistent with existing pattern).

## Dependencies

None (same tech stack).
