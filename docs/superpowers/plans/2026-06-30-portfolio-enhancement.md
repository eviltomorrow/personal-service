# Portfolio Enhancement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add trading code, position direction (做多/做空), and auto-calculated quantity from trades to the portfolio page.

**Architecture:** Single-file modification of `portfolio/page.tsx`. TypeScript interfaces updated, new helper function added, form/display components updated, state handlers wired for auto-quantity.

**Tech Stack:** Next.js 15, React 19, TypeScript, lucide-react

## Global Constraints

- Single file modified: `apps/personal-web-admin/src/app/dashboard/portfolio/page.tsx`
- No new dependencies
- No persistence changes (React state only)
- Data model: `initialQty` stored separately; `quantity` = `initialQty + Σ买入 - Σ卖出`
- Profit: 做多 = (现价-成本)×数量, 做空 = (成本-现价)×数量
- Verify with `npm run dev` and manual testing in browser

---

### Task 1: Data Model + Helper Functions

**Files:**
- Modify: `apps/personal-web-admin/src/app/dashboard/portfolio/page.tsx:12-70`

**Interfaces:**
- Consumes: existing `Position` and `TradeRecord` interfaces
- Produces: `Position` (updated with code, direction, initialQty), `calcQuantity()` function, `calcDerived()` (updated)

- [ ] **Step 1: Update Position interface**

Replace lines 21-29 in `portfolio/page.tsx`:

```typescript
interface Position {
  id: string;
  code: string;
  name: string;
  type: "股票" | "期货";
  direction: "做多" | "做空";
  initialQty: number;
  quantity: number;
  currentPrice: number;
  costPrice: number;
  trades: TradeRecord[];
}
```

- [ ] **Step 2: Add calcQuantity helper**

Insert after `recalcCostPrice` (after line 61):

```typescript
function calcQuantity(trades: TradeRecord[], initialQty: number): number {
  return trades.reduce((qty, t) => {
    return t.type === "买入" ? qty + t.quantity : qty - t.quantity;
  }, Math.max(0, initialQty));
}
```

- [ ] **Step 3: Update calcDerived for direction**

Replace lines 63-70:

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

- [ ] **Step 4: Verify build**

Run: `npm run build` (from `apps/personal-web-admin/`) or check for obvious type errors

---

### Task 2: Update AddPositionForm

**Files:**
- Modify: `apps/personal-web-admin/src/app/dashboard/portfolio/page.tsx:340-397`

**Interfaces:**
- Consumes: `Position` (updated), `onSave: (p: Omit<Position, "id" | "trades" | "costPrice" | "quantity">)`
- Produces: add position form with code input, direction select, renamed label, optional quantity/price

- [ ] **Step 1: Update form state and fields**

Replace the entire `AddPositionForm` component (lines 340-397):

```typescript
function AddPositionForm({ initial, onSave, onClose }: {
  initial?: Position;
  onSave: (p: Omit<Position, "id" | "trades" | "costPrice" | "quantity">) => void;
  onClose: () => void;
}) {
  const [code, setCode] = useState(initial?.code ?? "");
  const [name, setName] = useState(initial?.name ?? "");
  const [type, setType] = useState<"股票" | "期货">(initial?.type ?? "股票");
  const [direction, setDirection] = useState<"做多" | "做空">(initial?.direction ?? "做多");
  const [initialQty, setInitialQty] = useState(initial ? String(initial.initialQty) : "0");
  const [price, setPrice] = useState(initial ? String(initial.currentPrice) : "0");
  const [error, setError] = useState("");

  function handleSubmit() {
    if (!code.trim()) { setError("请输入代码"); return; }
    if (!name.trim()) { setError("请输入名称"); return; }
    const iq = parseFloat(initialQty) || 0;
    const p = parseFloat(price) || 0;
    if (iq < 0) { setError("持仓量不能为负数"); return; }
    if (p < 0) { setError("价格不能为负数"); return; }
    onSave({
      code: code.trim(),
      name: name.trim(),
      type,
      direction,
      initialQty: iq,
      currentPrice: p,
    });
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-4">
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">代码</label>
        <input type="text" value={code} onChange={(e) => setCode(e.target.value)} autoFocus
          className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-200/60 focus:outline-none"
          placeholder="600519.SH" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">名称</label>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)}
          className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-200/60 focus:outline-none"
          placeholder="贵州茅台" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">类型</label>
          <select value={type} onChange={(e) => setType(e.target.value as "股票" | "期货")}
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-slate-400 focus:ring-2 focus:ring-slate-200/60 focus:outline-none">
            <option value="股票">股票</option>
            <option value="期货">期货</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">方向</label>
          <select value={direction} onChange={(e) => setDirection(e.target.value as "做多" | "做空")}
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-slate-400 focus:ring-2 focus:ring-slate-200/60 focus:outline-none">
            <option value="做多">做多</option>
            <option value="做空">做空</option>
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">持仓量（可选）</label>
          <input type="number" min="0" step="1" value={initialQty} onChange={(e) => setInitialQty(e.target.value)}
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-slate-400 focus:ring-2 focus:ring-slate-200/60 focus:outline-none"
            placeholder="0" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">现价（可选）</label>
          <input type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)}
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-slate-400 focus:ring-2 focus:ring-slate-200/60 focus:outline-none"
            placeholder="0.00" />
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors">取消</button>
        <button type="submit" className="rounded-lg px-4 py-2 text-sm font-medium text-white bg-slate-600 hover:bg-slate-500 transition-colors">确认</button>
      </div>
    </form>
  );
}
```

- [ ] **Step 2: Verify build**

---

### Task 3: Update LeftPanel Display

**Files:**
- Modify: `apps/personal-web-admin/src/app/dashboard/portfolio/page.tsx:72-129`

**Interfaces:**
- Consumes: `Position[]`, direction badge logic
- Produces: Left panel with code display and 做空 badge

- [ ] **Step 1: Update position row in LeftPanel**

Replace the position row rendering inside LeftPanel (lines 90-114). The key changes:
- Show `{code}` before `{name}` in the row
- Show "空" badge when direction is "做空"

Modified lines 101-112:

```typescript
<div className="flex items-center gap-2 min-w-0">
  <span className="text-sm font-medium text-gray-900 truncate">
    {p.code} {p.name}
  </span>
  <span className={`shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${
    p.type === "股票"
      ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20"
      : "bg-blue-50 text-blue-700 ring-blue-600/20"
  }`}>
    {p.type}
  </span>
  {p.direction === "做空" && (
    <span className="shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset bg-orange-50 text-orange-700 ring-orange-600/20">
      空
    </span>
  )}
</div>
```

---

### Task 4: Update RightPanel Display

**Files:**
- Modify: `apps/personal-web-admin/src/app/dashboard/portfolio/page.tsx:131-308`

**Interfaces:**
- Consumes: `Position` with code, direction, initialQty
- Produces: Right panel with code, direction, read-only quantity display

- [ ] **Step 1: Update RightPanel header**

Replace lines 161-171:

```typescript
<div className="flex items-center justify-between mb-4">
  <div className="flex items-center gap-2">
    <h3 className="text-base font-semibold text-gray-900">{position.code} {position.name}</h3>
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${
      position.type === "股票"
        ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20"
        : "bg-blue-50 text-blue-700 ring-blue-600/20"
    }`}>
      {position.type}
    </span>
    {position.direction === "做空" && (
      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset bg-orange-50 text-orange-700 ring-orange-600/20">
        做空
      </span>
    )}
  </div>
  ...
```

- [ ] **Step 2: Update detail grid**

Replace the detail grid section (lines 189-255). Changes:
- Add 代码 row
- Add 方向 row
- Change 持仓量 to read-only display (remove edit capability — it's auto-calculated)
- Keep 成本均价 and 现价 as-is

```typescript
<div className="grid grid-cols-2 gap-x-8 gap-y-3 mb-6">
  <div>
    <span className="text-xs text-gray-500">代码</span>
    <p className="text-sm font-medium text-gray-900 tabular-nums">{position.code}</p>
  </div>
  <div>
    <span className="text-xs text-gray-500">方向</span>
    <p className="text-sm font-medium text-gray-900">
      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${
        position.direction === "做多"
          ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20"
          : "bg-orange-50 text-orange-700 ring-orange-600/20"
      }`}>
        {position.direction}
      </span>
    </p>
  </div>
  <div>
    <span className="text-xs text-gray-500">持仓量</span>
    <p className="text-sm font-medium text-gray-900 tabular-nums">
      {position.quantity} {position.type === "股票" ? "股" : "手"}
    </p>
  </div>
  <div>
    <span className="text-xs text-gray-500">成本均价</span>
    <p className="text-sm font-medium text-gray-900 tabular-nums">{formatCNY(position.costPrice)}</p>
  </div>
  <div>
    <span className="text-xs text-gray-500">现价</span>
    {/* Inline editing — unchanged from current code, keep lines 202-243 */}
  </div>
  <div>
    <span className="text-xs text-gray-500">当前市值</span>
    <p className="text-sm font-semibold text-gray-900 tabular-nums">{formatCNY(marketValue)}</p>
  </div>
  <div className="col-span-2">
    <span className="text-xs text-gray-500">盈亏</span>
    <p className={`text-sm font-semibold tabular-nums ${profitColor}`}>
      {profitSign}{formatCNY(Math.abs(profitAmount))} ({profitSign}{profitPct.toFixed(2)}%)
    </p>
  </div>
</div>
```

---

### Task 5: Wire Quantity Auto-Calculation into PortfolioPage

**Files:**
- Modify: `apps/personal-web-admin/src/app/dashboard/portfolio/page.tsx:572-765`

**Interfaces:**
- Consumes: `calcQuantity()`, `setPositions()`, existing handler functions
- Produces: All trade CRUD handlers recalculate position quantity

- [ ] **Step 1: Update add position handler**

In the `addPosition` modal handler (lines 666-686), update to include code, direction, initialQty and set quantity from calc:

```typescript
onSave={(data) => {
  const id = genId();
  const newPos: Position = {
    ...data,
    id,
    quantity: calcQuantity([], data.initialQty),
    costPrice: data.currentPrice,
    trades: [],
  };
  setPositions((prev) => [...prev, newPos]);
  setSnapshots((prev) => {
    const today = new Date().toISOString().slice(0, 10);
    const newTotal = positions.reduce((s, p) => s + p.currentPrice * p.quantity, 0) + data.currentPrice * data.quantity;
    const existing = prev.findIndex((s) => s.date === today);
    if (existing >= 0) {
      const next = [...prev];
      next[existing] = { ...next[existing], totalValue: newTotal };
      return next;
    }
    return [...prev, { date: today, totalValue: newTotal }];
  });
  setSelectedId(id);
  setModal(null);
}}
```

- [ ] **Step 2: Update add trade handler**

Modify the add trade handler (lines 716-732) to recalculate quantity:

```typescript
onSave={(data) => {
  const newTrade = { id: genId(), ...data };
  setPositions((prev) =>
    prev.map((p) => {
      if (p.id !== modal.positionId) return p;
      const newTrades = [...p.trades, newTrade];
      return {
        ...p,
        trades: newTrades,
        quantity: calcQuantity(newTrades, p.initialQty),
        costPrice: recalcCostPrice(newTrades),
      };
    })
  );
  setModal(null);
}}
```

- [ ] **Step 3: Update edit trade handler**

Modify the edit trade handler (lines 735-750) to recalculate quantity:

```typescript
onSave={(data) => {
  setPositions((prev) =>
    prev.map((p) => {
      if (p.id !== modal.positionId) return p;
      const newTrades = p.trades.map((t) => t.id === modal.trade.id ? { ...t, ...data } : t);
      return {
        ...p,
        trades: newTrades,
        quantity: calcQuantity(newTrades, p.initialQty),
        costPrice: recalcCostPrice(newTrades),
      };
    })
  );
  setModal(null);
}}
```

- [ ] **Step 4: Update delete trade handler**

Replace `handleDeleteTrade` (lines 613-621) to recalculate quantity:

```typescript
function handleDeleteTrade(positionId: string, tradeId: string) {
  setPositions((prev) =>
    prev.map((p) => {
      if (p.id !== positionId) return p;
      const newTrades = p.trades.filter((t) => t.id !== tradeId);
      return {
        ...p,
        trades: newTrades,
        quantity: calcQuantity(newTrades, p.initialQty),
        costPrice: recalcCostPrice(newTrades),
      };
    })
  );
}
```

- [ ] **Step 5: Update handleUpdatePosition**

Replace `handleUpdatePosition` (lines 593-611) — add support for updating `initialQty`, preserve snapshot recording on price change:

```typescript
function handleUpdatePosition(id: string, updates: Partial<Position>) {
  const updatedPositions = positions.map((p) => {
    if (p.id !== id) return p;
    const next = { ...p, ...updates };
    if ("initialQty" in updates) {
      next.quantity = calcQuantity(next.trades, next.initialQty);
    }
    return next;
  });
  setPositions(updatedPositions);
  if ("currentPrice" in updates) {
    const today = new Date().toISOString().slice(0, 10);
    const newTotal = updatedPositions.reduce((s, p) => s + p.currentPrice * p.quantity, 0);
    setSnapshots((prev) => {
      const existing = prev.findIndex((s) => s.date === today);
      if (existing >= 0) {
        const next = [...prev];
        next[existing] = { ...next[existing], totalValue: newTotal };
        return next;
      }
      return [...prev, { date: today, totalValue: newTotal }];
    });
  }
}
```

---

### Task 6: Manual Verification

- [ ] **Step 1: Add new position**
  - Open `/dashboard/portfolio`
  - Click 新增品种
  - Verify form shows: 代码, 名称, 类型, 方向, 持仓量(可选), 现价(可选)
  - Fill in: code="600519.SH", name="贵州茅台", direction=做多, initialQty=0, price=150.00
  - Submit → verify position appears in left panel as "600519.SH 贵州茅台"

- [ ] **Step 2: Verify trade auto-quantity**
  - Select position → click 新增记录
  - Add buy trade: qty=100, price=150
  - Verify quantity in detail grid shows "100 股"
  - Add another buy trade: qty=50, price=160
  - Verify quantity shows "150 股"
  - Add sell trade: qty=30, price=170
  - Verify quantity shows "120 股"

- [ ] **Step 3: Verify 做空 profit**
  - Create a new position with direction=做空
  - Add a buy trade at price 100, qty=10
  - Set current price to 80
  - Verify profit is positive (做空, price dropped → profit)

- [ ] **Step 4: Verify 做多 profit**
  - Create a new position with direction=做多
  - Add a buy trade at price 100, qty=10
  - Set current price to 120
  - Verify profit is positive (做多, price rose → profit)

- [ ] **Step 5: Verify 做空 badge**
  - Create a position with direction=做空
  - Verify "空" badge appears in left panel
  - Verify "做空" badge appears in right panel header

- [ ] **Step 6: Verify edit/delete trade quantity**
  - Edit a trade quantity → verify position quantity recalculates
  - Delete a trade → verify position quantity recalculates

---

### Task 7: Commit

```bash
git add apps/personal-web-admin/src/app/dashboard/portfolio/page.tsx docs/superpowers/specs/2026-06-30-portfolio-enhancement-design.md docs/superpowers/plans/2026-06-30-portfolio-enhancement.md
git commit -m "feat: add code, direction, auto-quantity to portfolio page"
```
