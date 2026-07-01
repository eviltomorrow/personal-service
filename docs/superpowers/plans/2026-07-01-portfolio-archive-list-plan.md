# Portfolio Archive List Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use subagent-driven-development or executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an archive list below the holdings list in the portfolio page, with cross-list drag-and-drop and simplified archived position detail panel.

**Architecture:** Single-page in-memory state (useState), @dnd-kit for cross-container drag-and-drop. Two SortableContext within one DndContext.

**Tech Stack:** Next.js 15, React 19, @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities, lucide-react

## Global Constraints

- All data stays in useState (no API/persistence changes)
- Must preserve all existing functionality for active positions
- Archived positions excluded from StatCards and TrendChart
- Follow existing code style: no comments, Tailwind classes, lucide icons
- Verify with `next build` (no test suite for frontend)

---

### Task 1: Extend Position Interface and Derive Filtered Lists

**Files:**
- Modify: `apps/personal-web-admin/src/app/dashboard/portfolio/page.tsx:21-42`

**Interfaces:**
- Consumes: Existing `Position`, `TradeRecord`, `ValueSnapshot` types
- Produces: `Position.archived: boolean`, `Position.closedPnl?: number`, `activePositions`, `archivedPositions`

- [ ] **Step 1: Add `archived` and `closedPnl` to Position interface**

Replace the `archived` and `closedPnl` fields:
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
  marginRatio?: number;
  trades: TradeRecord[];
  archived: boolean;
  closedPnl?: number;
}
```

- [ ] **Step 2: Derive activePositions and archivedPositions in PortfolioPage**

Add to `PortfolioPage` component, after `const selectedPosition`:
```typescript
const activePositions = useMemo(
  () => positions.filter((p) => !p.archived),
  [positions]
);

const archivedPositions = useMemo(
  () => positions.filter((p) => p.archived),
  [positions]
);
```

- [ ] **Step 3: Update StatCards and TrendChart to use activePositions**

Replace `positions` with `activePositions` in StatCards rendering:
```typescript
<StatCards positions={activePositions} totalCapital={totalCapital} onCapitalChange={setTotalCapital} />
```
And in the `totalPortfolioValue` useMemo:
```typescript
const totalPortfolioValue = useMemo(
  () => activePositions.reduce((sum, p) => sum + p.currentPrice * p.quantity, 0),
  [activePositions]
);
```

- [ ] **Step 4: Fix handleUpdatePosition and new position default archived=false**

In `handleUpdatePosition`, when checking `currentPrice` updates, reference `updatedPositions` directly (no change needed, already uses `setPositions`).

In the `AddPositionForm` `onSave` callback, add `archived: false` and `closedPnl: undefined` to the new position object:
```typescript
setPositions((prev) => [...prev, { ...data, id, quantity: qty, costPrice: data.currentPrice, trades: [], archived: false }]);
```

- [ ] **Step 5: Set archivedPositions as key for selectedId (allow selecting archived items)**

In `PortfolioPage`, update `selectedId` storage to track across both lists. No code change needed — `selectedId` is already set by `onSelect` and `positions.find` works on the full array.

Update `selectedPosition` to search both active and archived:
This is already correct since `positions` is the full array.

- [ ] **Step 6: Verify build**

```bash
next build
```
Expected: Build succeeds with no errors.

---

### Task 2: Dual-List LeftPanel

**Files:**
- Modify: `apps/personal-web-admin/src/app/dashboard/portfolio/page.tsx`

**Interfaces:**
- Consumes: `activePositions`, `archivedPositions`, `selectedId`, `onSelect`, `onAdd`
- Produces: Modified `LeftPanel` with two lists

- [ ] **Step 1: Rewrite LeftPanel to accept and render two lists**

Replace `LeftPanel` function signature and content:

```typescript
function LeftPanel({
  activePositions, archivedPositions, selectedId, onSelect, onAdd,
}: {
  activePositions: Position[];
  archivedPositions: Position[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAdd: () => void;
}) {
  return (
    <div className="w-[320px] shrink-0 self-start rounded-xl border border-gray-200 bg-white shadow-sm flex flex-col overflow-hidden">
      {/* Active positions section */}
      <div className="px-4 py-3 flex items-center gap-3 bg-slate-50/80 border-b border-gray-100">
        <div className="w-1 h-4 rounded-full bg-slate-500" />
        <span className="text-sm font-semibold text-gray-800">📋 持仓列表</span>
      </div>
      <div className="overflow-y-auto custom-scrollbar max-h-[300px]">
        {activePositions.length === 0 ? (
          <p className="px-4 py-6 text-sm text-gray-400 text-center">暂无持仓</p>
        ) : (
          <SortableContext items={activePositions.map((p) => p.id)} strategy={verticalListSortingStrategy}>
            <div className="divide-y divide-gray-100">
              {activePositions.map((p) => (
                <SortablePositionItem key={p.id} position={p} isSelected={p.id === selectedId} onSelect={onSelect} />
              ))}
            </div>
          </SortableContext>
        )}
      </div>
      <div className="px-4 py-3 border-t border-gray-100">
        <button onClick={onAdd}
          className="flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-500 transition-colors"
        >
          <Plus className="h-4 w-4" />
          新增品种
        </button>
      </div>

      {/* Archived positions section */}
      <div className="px-4 py-3 flex items-center gap-3 bg-slate-50/80 border-t border-gray-100">
        <div className="w-1 h-4 rounded-full bg-slate-400" />
        <span className="text-sm font-semibold text-gray-800">🗄️ 归档列表 ({archivedPositions.length})</span>
      </div>
      <div className="overflow-y-auto custom-scrollbar max-h-[300px]">
        {archivedPositions.length === 0 ? (
          <p className="px-4 py-6 text-sm text-gray-400 text-center">暂无归档</p>
        ) : (
          <SortableContext items={archivedPositions.map((p) => p.id)} strategy={verticalListSortingStrategy}>
            <div className="divide-y divide-gray-100">
              {archivedPositions.map((p) => (
                <SortablePositionItem key={p.id} position={p} isSelected={p.id === selectedId} onSelect={onSelect} />
              ))}
            </div>
          </SortableContext>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Update LeftPanel usage in PortfolioPage**

Replace the LeftPanel call:
```typescript
<LeftPanel
  activePositions={activePositions}
  archivedPositions={archivedPositions}
  selectedId={selectedId}
  onSelect={setSelectedId}
  onAdd={() => setModal({ type: "addPosition" })}
/>
```

- [ ] **Step 3: Verify build**

```bash
next build
```
Expected: Build succeeds.

---

### Task 3: Cross-List Drag-and-Drop

**Files:**
- Modify: `apps/personal-web-admin/src/app/dashboard/portfolio/page.tsx`

**Interfaces:**
- Consumes: `handleDragEnd` from existing code, `positions` + `setPositions`
- Produces: Cross-list drag behavior in `handleDragEnd`

- [ ] **Step 1: Update handleDragEnd for cross-list moves**

Replace the existing `handleDragEnd` function:
```typescript
function handleDragEnd(event: DragEndEvent) {
  const { active, over } = event;
  if (!over || active.id === over.id) return;

  const activeItem = positions.find((p) => p.id === active.id);
  const overItem = positions.find((p) => p.id === over.id);
  if (!activeItem || !overItem) return;

  // Cross-list drag: toggle archived status + snapshot PnL
  if (activeItem.archived !== overItem.archived) {
    setPositions((prev) =>
      prev.map((p) => {
        if (p.id !== activeItem.id) return p;
        const nextArchived = !p.archived;
        const d = calcDerived(p);
        return {
          ...p,
          archived: nextArchived,
          closedPnl: nextArchived ? d.profitAmount : undefined,
        };
      })
    );
    return;
  }

  // Same-list drag: reorder only within the same list
  const sameList = activeItem.archived === overItem.archived ? positions.filter(
    (p) => p.archived === activeItem.archived
  ) : null;
  if (!sameList) return;

  setPositions((prev) => {
    const oldIndex = sameList.findIndex((p) => p.id === active.id);
    const newIndex = sameList.findIndex((p) => p.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return prev;

    const sameListIds = sameList.map((p) => p.id);
    const movedItem = prev.find((p) => p.id === active.id);
    if (!movedItem) return prev;

    const otherItems = prev.filter((p) => p.archived !== movedItem.archived);
    const reorderedList = sameListIds.filter((id) => id !== active.id);
    reorderedList.splice(newIndex, 0, active.id as string);

    const newList = reorderedList.map((id) => prev.find((p) => p.id === id)!).filter(Boolean);
    const merged = movedItem.archived
      ? [...otherItems, ...newList]
      : [...newList, ...otherItems];
    return merged.map((p) => ({ ...p }));
  });
}
```

- [ ] **Step 2: Verify build**

```bash
next build
```
Expected: Build succeeds.

---

### Task 4: Auto-Archive on Zero Quantity

**Files:**
- Modify: `apps/personal-web-admin/src/app/dashboard/portfolio/page.tsx`

**Interfaces:**
- Consumes: `handleUpdatePosition`, `handleDeleteTrade` → auto-archive when quantity = 0
- Produces: Automated archive trigger

- [ ] **Step 1: Add auto-archive logic in handleUpdatePosition**

Find where quantity is recalculated (the `calcQuantity` call inside `handleUpdatePosition`). Currently:

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
```

Replace the last section of handleUpdatePosition — after calculating positions, add auto-archive check:

Actually this is tricky because `handleUpdatePosition` closes over `positions`. With `useState` it currently uses `positions.map`. Let me change it to use the callback form.

Replace the entire `handleUpdatePosition` function:
```typescript
function handleUpdatePosition(id: string, updates: Partial<Position>) {
  setPositions((prev) => {
    const updated = prev.map((p) => {
      if (p.id !== id) return p;
      let next = { ...p, ...updates };
      if ("initialQty" in updates || "trades" in updates) {
        next.quantity = calcQuantity(next.trades, next.initialQty);
      }
      if (next.quantity === 0 && !next.archived) {
        next.archived = true;
        next.closedPnl = calcDerived(next).profitAmount;
      }
      return next;
    });
    if ("currentPrice" in updates) {
      const today = new Date().toISOString().slice(0, 10);
      const newTotal = updated.reduce((s, p) => s + p.currentPrice * (p.archived ? 0 : p.quantity), 0);
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
    return updated;
  });
}
```

Note: `totalPortfolioValue` already uses `activePositions` (from Task 1→Step 3) so the snapshot recalculation only needs to sum active positions.

- [ ] **Step 2: Add auto-archive in trade add/delete flows**

In the trade add flow (the `setPositions` callback when adding a new trade), add the same auto-archive logic after calculating quantity:

```typescript
setPositions((prev) =>
  prev.map((p) => {
    if (p.id !== modal.positionId) return p;
    const newTrades = [...p.trades, newTrade];
    const qty = calcQuantity(newTrades, p.initialQty);
    return {
      ...p,
      trades: newTrades,
      quantity: qty,
      costPrice: recalcCostPrice(newTrades),
      archived: qty === 0 ? true : p.archived,
      closedPnl: qty === 0 ? calcDerived({ ...p, trades: newTrades, quantity: qty, costPrice: recalcCostPrice(newTrades) }).profitAmount : p.closedPnl,
    };
  })
);
```

In the trade edit flow:
```typescript
setPositions((prev) =>
  prev.map((p) => {
    if (p.id !== modal.positionId) return p;
    const newTrades = p.trades.map((t) => t.id === modal.trade.id ? { ...t, ...data } : t);
    const qty = calcQuantity(newTrades, p.initialQty);
    return {
      ...p,
      trades: newTrades,
      quantity: qty,
      costPrice: recalcCostPrice(newTrades),
      archived: qty === 0 ? true : p.archived,
      closedPnl: qty === 0 ? calcDerived({ ...p, trades: newTrades, quantity: qty, costPrice: recalcCostPrice(newTrades) }).profitAmount : p.closedPnl,
    };
  })
);
```

In `handleDeleteTrade`:
```typescript
function handleDeleteTrade(positionId: string, tradeId: string) {
  setPositions((prev) =>
    prev.map((p) => {
      if (p.id !== positionId) return p;
      const newTrades = p.trades.filter((t) => t.id !== tradeId);
      const qty = calcQuantity(newTrades, p.initialQty);
      return {
        ...p,
        trades: newTrades,
        quantity: qty,
        costPrice: recalcCostPrice(newTrades),
        archived: qty === 0 ? true : p.archived,
        closedPnl: qty === 0 ? calcDerived({ ...p, trades: newTrades, quantity: qty, costPrice: recalcCostPrice(newTrades) }).profitAmount : p.closedPnl,
      };
    })
  );
}
```

- [ ] **Step 3: Verify build**

```bash
next build
```
Expected: Build succeeds.

---

### Task 5: ArchivedRightPanel Component

**Files:**
- Modify: `apps/personal-web-admin/src/app/dashboard/portfolio/page.tsx`

**Interfaces:**
- Consumes: `Position` with `archived: true`, `closedPnl` from archive snapshot
- Produces: Archived position detail panel, conditional right panel rendering

- [ ] **Step 1: Add ArchivedRightPanel function component**

Add before the Modal component (around line 582):

```typescript
function ArchivedRightPanel({ position }: { position: Position }) {
  const sortedTrades = useMemo(
    () => [...position.trades].sort((a, b) => b.date.localeCompare(a.date)),
    [position.trades]
  );

  const pnlColor = (position.closedPnl ?? 0) >= 0 ? "text-emerald-600" : "text-red-600";
  const pnlSign = (position.closedPnl ?? 0) > 0 ? "+" : "";

  return (
    <div className="flex-1 rounded-xl border border-gray-200 bg-white shadow-sm p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-semibold text-gray-900">{position.code} {position.name}</h3>
          <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset bg-gray-100 text-gray-600 ring-gray-500/20">
            已归档
          </span>
        </div>
      </div>

      {/* Closed PnL */}
      <div className="mb-6">
        <span className="text-xs text-gray-500">清仓盈亏</span>
        <p className={`text-lg font-bold tabular-nums ${pnlColor}`}>
          {pnlSign}{(position.closedPnl ?? 0) === 0 ? "0.00" : formatCNY(Math.abs(position.closedPnl ?? 0))}
        </p>
      </div>

      {/* Trade records (read-only) */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="px-4 py-3 flex items-center gap-3 bg-slate-50/80 border-b border-gray-100">
          <div className="w-1 h-4 rounded-full bg-slate-400" />
          <span className="text-sm font-semibold text-gray-800">📝 买卖记录</span>
        </div>
        {sortedTrades.length === 0 ? (
          <p className="px-4 py-6 text-sm text-gray-400 text-center">暂无记录</p>
        ) : (
          <div className="space-y-1 max-h-[400px] overflow-y-auto custom-scrollbar p-1">
            {sortedTrades.map((t) => (
              <div key={t.id} className="flex items-center gap-4 rounded-lg border border-gray-100 bg-white px-4 py-3">
                <span className={`shrink-0 text-sm font-medium px-2 py-0.5 rounded ${
                  t.type === "买入" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                }`}>
                  {t.type}
                </span>
                <span className="text-sm text-gray-500 tabular-nums w-28 shrink-0">{t.date}</span>
                <span className="text-sm text-gray-500 tabular-nums w-24 text-right shrink-0">{formatCNY(t.price)}</span>
                <span className="text-sm text-gray-900 tabular-nums w-20 text-right shrink-0">{t.quantity}</span>
                <span className="text-sm font-semibold text-gray-900 tabular-nums w-28 text-right shrink-0">{formatCNY(t.price * t.quantity)}</span>
                {t.note ? (
                  <span className="text-sm text-gray-400 truncate flex-1 min-w-0">{t.note}</span>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Update right panel conditional rendering**

Replace the right panel section in PortfolioPage:
```typescript
{selectedPosition ? (
  selectedPosition.archived ? (
    <ArchivedRightPanel position={selectedPosition} />
  ) : (
    <RightPanel
      position={selectedPosition}
      totalValue={totalPortfolioValue}
      onUpdatePosition={handleUpdatePosition}
      onAddTrade={(posId) => setModal({ type: "addTrade", positionId: posId })}
      onEditTrade={(posId, trade) => setModal({ type: "editTrade", positionId: posId, trade })}
      onDeleteTrade={(posId, tradeId) => setModal({ type: "deleteTrade", positionId: posId, tradeId })}
      onEditPosition={(id) => setModal({ type: "editPosition", positionId: id })}
      onDeletePosition={(id) => setModal({ type: "deletePosition", positionId: id })}
    />
  )
) : (
  <div className="flex-1 rounded-xl border border-gray-200 bg-white shadow-sm p-6 flex items-center justify-center">
    <p className="text-sm text-gray-400">请从左侧选择一个品种</p>
  </div>
)}
```

- [ ] **Step 3: Verify build**

```bash
next build
```
Expected: Build succeeds.
