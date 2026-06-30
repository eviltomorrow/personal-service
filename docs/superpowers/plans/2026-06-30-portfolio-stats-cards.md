# Portfolio Stats Cards Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add 5 summary stat cards above the content area on the portfolio page.

**Architecture:** Single inline `StatCards` component in `portfolio/page.tsx`, computed from `positions` state.

**Tech Stack:** Next.js 15, React 19, TypeScript, lucide-react

## Global Constraints

- Single file modified: `apps/personal-web-admin/src/app/dashboard/portfolio/page.tsx`
- No new dependencies
- Icons: `Layers`, `DollarSign`, `TrendUp`, `Percent`, `ArrowUpDown` from `lucide-react`
- Cards: rounded borders, white bg, shadow-sm, responsive grid

---

### Task 1: Add StatCards component

**Files:**
- Modify: `apps/personal-web-admin/src/app/dashboard/portfolio/page.tsx`

**Interfaces:**
- Consumes: `Position[]`, `formatCNY()`, `calcDerived()` (for individual position profit)
- Produces: `<StatCards positions={positions} />` rendered between PageHeader and TrendChart

**Step 1: Add icon imports**

Add to existing import line (line 5-7):
```typescript
import {
  Plus, Pencil, Trash2, X, AlertTriangle,
  Layers, DollarSign, TrendUp, Percent, ArrowUpDown,
} from "lucide-react";
```

**Step 2: Add StatCards component**

Insert after `calcDerived` function and before `LeftPanel`:

```typescript
function StatCards({ positions }: { positions: Position[] }) {
  const count = positions.length;
  const totalValue = positions.reduce((s, p) => s + p.currentPrice * p.quantity, 0);
  const totalCost = positions.reduce((s, p) => s + p.costPrice * p.quantity, 0);
  const totalProfit = positions.reduce((s, p) => {
    const d = calcDerived(p);
    return s + d.profitAmount;
  }, 0);
  const totalProfitPct = totalCost > 0 ? (totalProfit / totalCost) * 100 : null;
  const longCount = positions.filter((p) => p.direction === "做多").length;
  const shortCount = positions.filter((p) => p.direction === "做空").length;

  const cards = [
    { icon: Layers, label: "总品种数", value: String(count) },
    { icon: DollarSign, label: "总市值", value: formatCNY(totalValue) },
    {
      icon: TrendUp, label: "总盈亏",
      value: formatCNY(Math.abs(totalProfit)),
      positive: totalProfit >= 0,
      sign: totalProfit >= 0 ? "+" : "-",
    },
    {
      icon: Percent, label: "总收益率",
      value: totalProfitPct !== null ? `${(totalProfit >= 0 ? "+" : "")}${totalProfitPct.toFixed(2)}%` : "—",
      positive: totalProfit >= 0,
    },
    { icon: ArrowUpDown, label: "多空比", value: `${longCount} : ${shortCount}` },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {cards.map((card) => (
        <div key={card.label} className="rounded-xl border border-gray-200 bg-white shadow-sm p-4 flex items-center gap-3">
          <div className="rounded-lg bg-slate-50 p-2.5 shrink-0">
            <card.icon className="h-5 w-5 text-slate-600" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-gray-500">{card.label}</p>
            <p className={`text-lg font-semibold tabular-nums ${card.positive !== undefined ? (card.positive ? "text-emerald-600" : "text-red-600") : "text-gray-900"}`}>
              {card.sign || ""}{card.value}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
```

**Step 3: Render StatCards in PortfolioPage**

Add between PageHeader and TrendChart (line ~709):

```typescript
<StatCards positions={positions} />
```

**Step 4: Verify build**

```bash
cd apps/personal-web-admin && npm run build
```

**Step 5: Commit**

```bash
git add apps/personal-web-admin/src/app/dashboard/portfolio/page.tsx
git commit -m "feat: add portfolio stat cards"
```
