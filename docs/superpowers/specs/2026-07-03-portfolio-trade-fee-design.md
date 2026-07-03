# Portfolio Trade Fee Design

Date: 2026-07-03
Status: Draft

## Overview

Add a commission/fee field to individual trade records in the portfolio module.
The fee affects cost price, profit calculation, and available funds.

## Data Flow

```
User fills fee in TradeForm (元)
  → tradeToAPI converts to cents (*100)
  → HTTP → gRPC → MySQL stores DECIMAL(15,2)
  → gRPC returns Trade with fee
  → tradeFromAPI converts to yuan (/100)
  → calcTradeTotalCost uses fee for cost/profit
  → StatCards displays sum of all fees
```

## Changes by Layer

### 1. Database

File: `apps/personal-core/scripts/init-sql/05_trades.sql`

Add column:
```sql
fee DECIMAL(15,2) NOT NULL DEFAULT 0 COMMENT '手续费，单位元'
```

### 2. Core Model

File: `apps/personal-core/pkg/model/portfolio_trade.go`

- Add `FieldTradeFee = "fee"` constant
- Add `Fee int64` to `Trade` struct
- Update `TradeColumns` to include fee
- Update `scanTrade`/`scanTrades` to scan fee (DECIMAL → int64 cents)
- Update `InsertTrade` to write fee (int64 → DECIMAL /100)
- `UpdateTradeByID` uses dynamic map, no change needed

### 3. Protobuf

File: `apps/personal-core/adapter/portfolio.proto`

- `Trade`: add `int64 fee = 11;`
- `CreateTradeRequest`: add `int64 fee = 7;`
- `UpdateTradeRequest`: add `int64 fee = 7;`

Run `make compile` to regenerate.

### 4. Core Service

File: `apps/personal-core/pkg/service/portfolio.go`

- `tradeToProto`: add `Fee: t.Fee`

No changes to `ListTrades`, `CreateTrade`, `UpdateTrade` — they pass through protobuf fields automatically.

### 5. API Model

File: `apps/personal-api/pkg/model/portfolio.go`

- `Trade`: add `Fee int64 \`json:"fee"\``
- `CreateTradeRequest`: add `Fee int64 \`json:"fee"\``
- `UpdateTradeRequest`: add `Fee int64 \`json:"fee"\``

### 6. API Service

File: `apps/personal-api/pkg/service/portfolio.go`

- `tradeFromProto`: add `Fee: t.Fee`
- No other changes needed

### 7. API Handler

File: `apps/personal-api/pkg/handler/portfolio.go`

No changes needed — `c.Bind(&req)` will automatically parse the `fee` field from JSON.

### 8. Frontend Types

File: `apps/personal-web-admin/src/app/dashboard/portfolio/page.tsx`

```typescript
interface TradeRecord {
  id: string;
  type: "建仓" | "买入" | "卖出" | "清仓";
  date: string;
  price: number;
  quantity: number;
  fee: number;       // ← new, in yuan
  note?: string;
}
```

### 9. Frontend Helpers

**`tradeFromAPI`**: `fee: (t.fee ?? 0) / 100`

**`tradeToAPI`**: `fee: Math.round((t.fee ?? 0) * 100)`

### 10. Frontend calcTradeTotalCost

Update the cost calculation to include fees:

```
For 做多:
  建仓/买入: cost += price * quantity + fee
  卖出/清仓: cost -= price * quantity - fee

For 做空:
  建仓/卖出: cost -= price * quantity - fee
  买入/清仓: cost += price * quantity + fee
```

### 11. Frontend TradeForm

Add fee input field after the quantity input, before the note field:

```tsx
<div>
  <label>手续费</label>
  <div className="flex items-center gap-2">
    <span>¥</span>
    <input type="number" step="0.01" min="0" value={fee} ... />
  </div>
</div>
```

State: `const [fee, setFee] = useState(initial ? String(initial.fee) : "0");`

`onSave` includes `fee: parseFloat(fee) || 0`.

### 12. Frontend StatCards

Add read-only card after "总市值":

```typescript
{ icon: DollarSign, label: "总手续费", value: formatCNY(totalFees), bar: "slate" }
```

Where `totalFees` is calculated as:

```typescript
const totalFees = positions.reduce((s, p) =>
  s + p.trades.reduce((sf, t) => sf + (t.fee ?? 0), 0), 0);
```

Available funds updated to:
```typescript
const availableFunds = totalCapital - fundsUsed + realizedPnl - totalFees;
```

## Files Changed

| Layer | File |
|-------|------|
| DB schema | `apps/personal-core/scripts/init-sql/05_trades.sql` |
| Core model | `apps/personal-core/pkg/model/portfolio_trade.go` |
| Proto | `apps/personal-core/adapter/portfolio.proto` |
| Core service | `apps/personal-core/pkg/service/portfolio.go` |
| API model | `apps/personal-api/pkg/model/portfolio.go` |
| API service | `apps/personal-api/pkg/service/portfolio.go` |
| Frontend | `apps/personal-web-admin/src/app/dashboard/portfolio/page.tsx` |

## Not Changed

- `calcQuantity` — fee doesn't affect quantity
- `calcDerived` — uses costPrice which is already derived from trades via recalcCostPrice
- `posToAPI` — fee is on trades, not positions
- `handleUpdatePosition` — fee changes don't trigger position-level updates
- `handleDragEnd` — fee doesn't affect sorting/archiving
