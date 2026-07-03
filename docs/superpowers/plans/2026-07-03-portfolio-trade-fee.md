# Portfolio Trade Fee Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a commission/fee field to individual trade records

**Architecture:** Single field `fee` added to the `trades` table (DECIMAL), `Trade` Go model (int64 cents), proto, and all layers. Frontend adds fee input to TradeForm, updates cost calculation, displays total fees in StatCards.

**Tech Stack:** MySQL, Go 1.26, gRPC/Protobuf, Next.js 15 / React 19 / TypeScript

## Global Constraints

- All monetary values use cents (int64) in Go, DECIMAL(15,2) in MySQL, yuan (number) in frontend
- Follow existing patterns in each file (scanTrade, InsertTrade, tradeFromProto, etc.)
- Existing proto field numbers: Trade uses 1-10, CreateTradeRequest uses 1-6, UpdateTradeRequest uses 1-6. New field gets next number (11, 7, 7)
- `make compile` to regenerate pb files
- No changes to `calcQuantity`, `calcDerived`, `posToAPI`, or position-level handlers

---
`

### Task 1: DB Schema + Core Model

**Files:**
- Modify: `apps/personal-core/scripts/init-sql/05_trades.sql`
- Modify: `apps/personal-core/pkg/model/portfolio_trade.go`

- [ ] **Step 1: Add fee column to trades table**

In `05_trades.sql`, add `fee DECIMAL(15,2) NOT NULL DEFAULT 0 COMMENT '手续费，单位元'` after `quantity` line.

- [ ] **Step 2: Add field constant and Fee field to Trade struct**

In `portfolio_trade.go`:
```go
const (
    FieldTradeFee = "fee"
    // ... existing fields
)

type Trade struct {
    // ... existing fields
    Fee      int64
    // ... existing fields
}
```

- [ ] **Step 3: Update TradeColumns**

Add `FieldTradeFee` to `TradeColumns` slice after `FieldTradeQuantity`.

- [ ] **Step 4: Update scanTrade/scanTrades**

Read `&t.Fee` after `&t.Quantity`, with corresponding `feeDec float64` variable and conversion:
```go
var feeDec float64
err := row.Scan(&t.ID, &t.AccountID, &t.PositionID, &t.Type, &t.Date,
    &priceDec, &t.Quantity, &feeDec, &t.Note, &t.DeletedAt, &t.CreatedAt, &t.UpdatedAt)
if err != nil { return nil, err }
t.Price = int64(math.Round(priceDec * 100))
t.Fee = int64(math.Round(feeDec * 100))
```

Same pattern in `scanTrades`.

- [ ] **Step 5: Update InsertTrade**

Add `FieldTradeFee: float64(t.Fee) / 100.0,` after `FieldTradeQuantity`.

### Task 2: Proto + Recompile

**Files:**
- Modify: `apps/personal-core/adapter/portfolio.proto`
- Generated: `apps/personal-core/adapter/pb/portfolio.pb.go`
- Generated: `apps/personal-core/adapter/pb/portfolio_grpc.pb.go`

- [ ] **Step 1: Add fee field to proto messages**

```protobuf
message Trade {
  // ... existing fields 1-10
  int64 fee = 11;
}

message CreateTradeRequest {
  // ... existing fields 1-6
  int64 fee = 7;
}

message UpdateTradeRequest {
  // ... existing fields 1-6
  int64 fee = 7;
}
```

- [ ] **Step 2: Recompile**

Run: `make compile`

### Task 3: Core Service

**Files:**
- Modify: `apps/personal-core/pkg/service/portfolio.go`

- [ ] **Step 1: Update tradeToProto**

Add `Fee: t.Fee,` to the `tradeToProto` function.

### Task 4: API Layer

**Files:**
- Modify: `apps/personal-api/pkg/model/portfolio.go`
- Modify: `apps/personal-api/pkg/service/portfolio.go`

- [ ] **Step 1: Add Fee to API model structs**

In `model/portfolio.go`:
```go
type Trade struct {
    // ... existing
    Fee      int64  `json:"fee"`
}

type CreateTradeRequest struct {
    // ... existing
    Fee      int64  `json:"fee"`
}

type UpdateTradeRequest struct {
    // ... existing
    Fee      int64  `json:"fee"`
}
```

- [ ] **Step 2: Update tradeFromProto**

Add `Fee: t.Fee,` to the `tradeFromProto` function in `service/portfolio.go`.

### Task 5: Frontend

**Files:**
- Modify: `apps/personal-web-admin/src/app/dashboard/portfolio/page.tsx`

- [ ] **Step 1: Add fee to TradeRecord interface**

```typescript
interface TradeRecord {
  // ... existing
  fee: number;
}
```

- [ ] **Step 2: Update tradeFromAPI**

```typescript
fee: (t.fee ?? 0) / 100,
```

- [ ] **Step 3: Update tradeToAPI**

```typescript
fee: Math.round((t.fee ?? 0) * 100),
```

- [ ] **Step 4: Add fee input to TradeForm**

After the quantity field, add:
```tsx
<div>
  <label className="block text-sm font-medium text-gray-700 mb-1">手续费</label>
  <div className="flex items-center gap-2">
    <span className="text-sm text-gray-400">¥</span>
    <input type="number" min="0" step="0.01" value={fee} onChange={(e) => setFee(e.target.value)}
      className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-slate-400 focus:ring-2 focus:ring-slate-200/60 focus:outline-none"
      placeholder="0.00" />
  </div>
</div>
```

State: `const [fee, setFee] = useState(initial ? String(initial.fee) : "0");`
HandleSubmit: include `fee: parseFloat(fee) || 0` in the `onSave` data.

- [ ] **Step 5: Update calcTradeTotalCost to include fee**

The fee is always added to cost regardless of direction, because:
- Paying (buy/cover): `cost + price*qty + fee`
- Receiving (sell/short): `cost - (price*qty - fee)` = `cost - price*qty + fee`

```typescript
function calcTradeTotalCost(trades: TradeRecord[], direction: "做多" | "做空"): number {
  return trades.reduce((cost, t) => {
    const q = t.price * t.quantity;
    const f = t.fee ?? 0;
    if (direction === "做空") {
      if (t.type === "建仓" || t.type === "卖出") return cost - q + f;
      return cost + q + f;
    }
    if (t.type === "买入" || t.type === "建仓") return cost + q + f;
    return cost - q + f;
  }, 0);
}
```

Let me fix the code block.

- [ ] **Step 6: Add totalFees and StatCards card**

In the `StatCards` component:
```typescript
const totalFees = positions.reduce((s, p) =>
  s + p.trades.reduce((sf, t) => sf + (t.fee ?? 0), 0), 0);
```

Add card after 总市值:
```typescript
{ icon: DollarSign, label: "总手续费", value: formatCNY(totalFees), bar: "slate" },
```

- [ ] **Step 7: Update availableFunds**

```typescript
const availableFunds = totalCapital - fundsUsed + realizedPnl - totalFees;
```

- [ ] **Step 8: Build check**

```bash
npx tsc --noEmit
```

### Task 6: Backend Build + Format

- [ ] **Step 1: Go build**

```bash
go build ./apps/personal-core/... && go build ./apps/personal-api/...
```

- [ ] **Step 2: Format**

```bash
make fmt
```
