# Portfolio Account Capital Plan

**Goal:** Add editable futures/stock capital fields and use total capital for return rate.

**Architecture:** Single-file change to `portfolio/page.tsx`. New state + AccountCapital component.

## Global Constraints

- Single file modified: `apps/personal-web-admin/src/app/dashboard/portfolio/page.tsx`
- No new dependencies

---

### Task 1: Add AccountCapital component + wire state

**Files:**
- Modify: `apps/personal-web-admin/src/app/dashboard/portfolio/page.tsx`

**Step 1: Add capital state in PortfolioPage**

After `setSnapshots` useState (line ~695 area):
```typescript
const [futuresCapital, setFuturesCapital] = useState(0);
const [stockCapital, setStockCapital] = useState(0);
const totalCapital = futuresCapital + stockCapital;
```

**Step 2: Add AccountCapital component**

Insert after `StatCards` and before `LeftPanel`:

```typescript
function AccountCapital({
  futuresCapital, stockCapital, onFuturesChange, onStockChange,
}: {
  futuresCapital: number;
  stockCapital: number;
  onFuturesChange: (v: number) => void;
  onStockChange: (v: number) => void;
}) {
  const total = futuresCapital + stockCapital;
  const [editing, setEditing] = useState<"futures" | "stock" | null>(null);
  const [draft, setDraft] = useState("");

  function startEdit(field: "futures" | "stock") {
    setEditing(field);
    setDraft(String(field === "futures" ? futuresCapital : stockCapital));
  }

  function confirmEdit() {
    const v = parseFloat(draft) || 0;
    if (editing === "futures") onFuturesChange(v);
    else onStockChange(v);
    setEditing(null);
  }

  return (
    <div className="grid grid-cols-3 gap-4">
      {([
        { label: "期货账户本金", value: futuresCapital, key: "futures" as const },
        { label: "股票账户本金", value: stockCapital, key: "stock" as const },
        { label: "总本金", value: total, readOnly: true },
      ]).map((item) => (
        <div key={item.label} className="rounded-xl border border-gray-200 bg-white shadow-sm p-4">
          <p className="text-xs text-gray-500 mb-1">{item.label}</p>
          {item.readOnly ? (
            <p className="text-lg font-semibold text-gray-900 tabular-nums">{formatCNY(item.value)}</p>
          ) : editing === item.key ? (
            <div className="flex items-center gap-1">
              <span className="text-sm text-gray-400">¥</span>
              <input type="number" step="0.01" value={draft} autoFocus
                onChange={(e) => setDraft(e.target.value)}
                onBlur={confirmEdit}
                onKeyDown={(e) => e.key === "Enter" && confirmEdit()}
                className="w-full rounded border border-gray-300 px-2 py-1 text-lg font-semibold text-gray-900 tabular-nums focus:border-slate-400 focus:ring-2 focus:ring-slate-200/60 focus:outline-none" />
            </div>
          ) : (
            <button onClick={() => startEdit(item.key)}
              className="text-lg font-semibold text-gray-900 tabular-nums hover:text-slate-600 transition-colors cursor-text text-left w-full">
              {formatCNY(item.value)}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
```

**Step 3: Render AccountCapital between PageHeader and StatCards**

In PortfolioPage return:
```typescript
<PageHeader title="投资组合" description="股票与期货持仓监控" />
<AccountCapital futuresCapital={futuresCapital} stockCapital={stockCapital}
  onFuturesChange={setFuturesCapital} onStockChange={setStockCapital} />
<StatCards positions={positions} />
```

**Step 4: Update StatCards to use totalCapital**

Add `totalCapital` prop to StatCards:
```typescript
function StatCards({ positions, totalCapital }: { positions: Position[]; totalCapital: number }) {
```

Replace totalProfitPct calculation:
```typescript
const totalProfitPct = totalCapital > 0 ? (totalProfit / totalCapital) * 100 : null;
```

**Step 5: Pass totalCapital to StatCards**

In PortfolioPage, update StatCards render:
```typescript
<StatCards positions={positions} totalCapital={totalCapital} />
```

**Step 6: Verify build**

```bash
cd apps/personal-web-admin && npm run build
```
