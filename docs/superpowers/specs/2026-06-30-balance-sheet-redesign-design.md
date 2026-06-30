# Balance Sheet Page Redesign

**Date:** 2026-06-30
**Project:** personal-web-admin
**Status:** Approved

## Overview

Redesign the `/dashboard/balance-sheet` page with a new layout: summary cards on top, shrunken category detail on the left, and an item-specific transaction list + trend chart on the right.

## Changes

### 1. Remove Month Navigation

- Delete `year`, `month`, `monthData`, `monthKey`, `navigateMonth`
- Delete `MONTH_LABELS`, `getMonthKey`
- Simplify data to a single `BalanceGroup[]` state (no per-month keying)
- Remove the month-switcher UI component

### 2. Summary Cards at Top

Replace the left sidebar stacked summary cards with a horizontal row of 3 cards at the top:

| Card | Color | Icon |
|------|-------|------|
| 总资产 | blue-600 | Wallet |
| 总负债 | orange-600 | Landmark |
| 净资产 | emerald-600 | TrendingUp |

Each card shows large formatted value with label and color accent.

### 3. Two-Column Layout (Left + Right)

```
Top: Summary cards row
├── Left (w-80): Category detail panel (shrunken)
│   ├── Category groups with item rows
│   ├── Asset/Liability subtotals between groups
│   └── Click item → select it for right panel
└── Right (flex-1): Selected item details
    ├── Detail list table (date, amount, remark)
    └── Trend chart (12-month bar chart)
```

#### Left Panel
- Same balance sheet category groups as before but more compact
- Active item highlighted (selected state)
- Click any item to show its transactions in right panel
- Still supports Add/Edit/Delete via modals

#### Right Panel: Detail List
- Table with 3 columns: Date, Amount, Remark
- Each row is a transaction record for the selected item
- Supports adding new transaction records
- Updates when clicking a different left-panel item

#### Right Panel: Trend Chart
- CSS/SVG-based bar chart (no external library)
- 12 bars for last 12 months
- Height proportional to monthly values
- Updates when clicking a different left-panel item

### 4. Data Model Additions

```typescript
interface Transaction {
  date: string;    // "2026-06-15"
  amount: number;
  remark: string;  // "工资收入"
}

// Transactions keyed by item identifier
type TransactionsMap = Record<string, Transaction[]>;

// Trend data: monthly totals for last 12 months
type TrendData = { month: string; amount: number }[];
```

Mock transaction data will be generated for each item initially.
