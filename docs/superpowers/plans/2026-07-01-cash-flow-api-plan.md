# 收入与支出 API 对接实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 将 cash-flow 页面从本地 mock 数据改为通过 `personal-api` HTTP 接口读写后端数据。

**Architecture:** Next.js 前端 → `api()` fetch 封装 → personal-api HTTP → personal-finance gRPC → MySQL。前端用 `GET /finance/categories` 和 `GET /finance/transactions` 加载数据，所有 CRUD 操作调用对应 API。

**Tech Stack:** Next.js 15, React 19, TypeScript

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `apps/personal-web-admin/src/app/dashboard/cash-flow/page.tsx` | Modify | 全部重写：数据模型、API 调用、CRUD 逻辑 |

---

## Task 1: 重写数据模型 + 加载分类和交易

**Files:**
- Modify: `apps/personal-web-admin/src/app/dashboard/cash-flow/page.tsx`

**Changes:**
1. 替换接口定义：`CashFlowItem` 增加 `id: number`, `date: string`, `note?: string`；`CashFlowCategory` 增加 `id: number`，`category` 改为分类名称
2. 替换状态：移除 `monthData`，新增 `categories: Category[]`、`transactions: Transaction[]`、`loading: boolean`
3. 页面挂载时同时调用 `GET /finance/categories` 和 `GET /finance/transactions?year=&month=`
4. 切换月份时重新请求 transactions

- [ ] **Step 1: 替换接口定义**

```typescript
// 删除旧的 CashFlowItem, CashFlowCategory, MonthCashFlow
// 新增：
interface CashFlowItem {
  id: number;
  name: string;
  amount: number;
  date: string;
  note?: string;
}

interface CashFlowCategory {
  id: number;
  category: string;
  items: CashFlowItem[];
}
```

- [ ] **Step 2: 替换状态变量**

```typescript
// 删除:
const [monthData, setMonthData] = useState<Record<string, MonthCashFlow>>({...});
// 新增:
const [categories, setCategories] = useState<model.Category[]>([]);
const [transactions, setTransactions] = useState<model.Transaction[]>([]);
const [loading, setLoading] = useState(false);
```

顶部添加 imports:
```typescript
import { api } from "@/lib/api";
import type * as model from "@/lib/types"; // or inline the types
```

- [ ] **Step 3: 添加数据加载函数**

```typescript
async function loadData(year: number, month: number) {
  setLoading(true);
  try {
    const [catRes, txRes] = await Promise.all([
      fetch("/api/v1/finance/categories"),
      fetch(`/api/v1/finance/transactions?year=${year}&month=${month}`),
    ]);
    const catJson = await catRes.json();
    const txJson = await txRes.json();
    if (catJson.code === 0) setCategories(catJson.data);
    if (txJson.code === 0) setTransactions(txJson.data.transactions);
  } catch { /* ignore */ }
  finally { setLoading(false); }
}

// 在 useEffect 中调用
useEffect(() => { loadData(year, month); }, [year, month]);
```

- [ ] **Step 4: 替换展示层的计算逻辑**

原本 `data = monthData[monthKey] ?? createEmptyMonth()` → 改为从 categories + transactions 实时计算：

```typescript
const incomeCategories = useMemo(
  () => categories
    .filter((c) => c.type === "income")
    .map((c) => ({
      id: c.id,
      category: c.name,
      items: transactions
        .filter((t) => t.category_id === c.id)
        .map((t) => ({ id: t.id, name: t.name, amount: t.amount, date: t.date, note: t.note })),
    })),
  [categories, transactions]
);

const expenseCategories = useMemo(
  () => categories
    .filter((c) => c.type === "expense")
    .map((c) => ({
      id: c.id,
      category: c.name,
      items: transactions
        .filter((t) => t.category_id === c.id)
        .map((t) => ({ id: t.id, name: t.name, amount: t.amount, date: t.date, note: t.note })),
    })),
  [categories, transactions]
);

const totalIncome = useMemo(
  () => transactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0),
  [transactions]
);

const totalExpense = useMemo(
  () => transactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0),
  [transactions]
);
```

JSX 中所有 `data.income` → `incomeCategories`，`data.expense` → `expenseCategories`。

- [ ] **Step 5: 构建验证**

```bash
cd /home/shepard/Workspaces/space-go/open/src/github.com/eviltomorrow/personal-service/apps/personal-web-admin && npx next build 2>&1 | tail -10
```

- [ ] **Step 6: Commit**

```bash
git add apps/personal-web-admin/src/app/dashboard/cash-flow/page.tsx
git commit -m "feat(cash-flow): replace mock data with API loading"
```

---

## Task 2: 分类 CRUD（添加 + 删除）

**Files:**
- Modify: `apps/personal-web-admin/src/app/dashboard/cash-flow/page.tsx`

**Changes:** `handleSave` 中添加分类时调 `POST /finance/categories`，删除分类时调 `DELETE /finance/categories/:id`

- [ ] **Step 1: 替换添加分类逻辑**

```typescript
// handleSave 中的 add-category 分支
if (modal.type === "add-category") {
  if (!name) return;
  try {
    const res = await fetch("/api/v1/finance/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, type: modal.section === "income" ? "income" : "expense", sort_order: 0 }),
    });
    const json = await res.json();
    if (json.code === 0 && json.data) {
      setCategories((prev) => [...prev, json.data]);
    }
  } catch { /* ignore */ }
  setModal(null);
  return;
}
```

注意：`handleSave` 需要改为 `async`。

- [ ] **Step 2: 替换删除分类逻辑**

```typescript
function handleDelete() {
  if (!modal) return;
  if (modal.type === "delete-category") {
    const cat = categories.find((c) => c.id === modal.catIndex);
    // Actually, catIndex should reference category id not array index
  }
}
```

需要修改 `modal` 中的 `catIndex` 含义：因为分类列表来自后端，需要按 `category.id` 而不是数组索引。最简方案：添加 `deleteCategoryId` 状态或在 delete 时用 `category_id` 替代 `catIndex`。

改用 `modalCatId: number | null` 状态代替 `catIndex`。

- [ ] **Step 3: 构建验证 + Commit**

```bash
cd /home/shepard/Workspaces/space-go/open/src/github.com/eviltomorrow/personal-service/apps/personal-web-admin && npx next build 2>&1 | tail -10
git add apps/personal-web-admin/src/app/dashboard/cash-flow/page.tsx
git commit -m "feat(cash-flow): category add/delete via API"
```

---

## Task 3: 交易 CRUD（添加 + 编辑 + 删除）+ 日期/备注字段

**Files:**
- Modify: `apps/personal-web-admin/src/app/dashboard/cash-flow/page.tsx`

**Changes:** 所有交易操作改为调用 API，添加/编辑弹窗增加 date 和 note 输入。

- [ ] **Step 1: 修改弹窗 UI — 增加日期和备注字段**

在添加/编辑弹窗的 form 中，金额字段之后增加：

```tsx
<div>
  <label className="block text-sm font-medium text-gray-700 mb-1.5">日期</label>
  <input type="date" value={modalDate} onChange={(e) => setModalDate(e.target.value)}
    className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm ..." />
</div>
<div>
  <label className="block text-sm font-medium text-gray-700 mb-1.5">备注（可选）</label>
  <input type="text" value={modalNote} onChange={(e) => setModalNote(e.target.value)} placeholder="备注信息"
    className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm ..." />
</div>
```

新增 state: `const [modalDate, setModalDate] = useState("");` `const [modalNote, setModalNote] = useState("");`

打开添加弹窗时设默认日期：`setModalDate(new Date().toISOString().slice(0, 10))`

- [ ] **Step 2: 替换添加交易逻辑**

```typescript
if (modal.type === "add-item") {
  if (!name || isNaN(amt) || amt <= 0) return;
  try {
    const res = await fetch("/api/v1/finance/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        category_id: modalCatId,    // 当前分类的 id
        type: modal.section === "income" ? "income" : "expense",
        name,
        amount: amt,
        date: modalDate,
        note: modalNote || undefined,
      }),
    });
    const json = await res.json();
    if (json.code === 0 && json.data) {
      setTransactions((prev) => [...prev, json.data]);
    }
  } catch { /* ignore */ }
  setModal(null);
  return;
}
```

- [ ] **Step 3: 替换编辑交易逻辑**

```typescript
if (modal.type === "edit-item") {
  if (!name || isNaN(amt) || amt <= 0) return;
  try {
    const res = await fetch(`/api/v1/finance/transactions/${modalItemId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        category_id: modalCatId,
        type: modal.section === "income" ? "income" : "expense",
        name,
        amount: amt,
        date: modalDate,
        note: modalNote || undefined,
      }),
    });
    const json = await res.json();
    if (json.code === 0 && json.data) {
      setTransactions((prev) => prev.map((t) => t.id === json.data.id ? json.data : t));
    }
  } catch { /* ignore */ }
  setModal(null);
  return;
}
```

需要新增 `modalItemId` 状态。

- [ ] **Step 4: 替换删除交易逻辑**

```typescript
if (modal.type === "delete-item") {
  try {
    await fetch(`/api/v1/finance/transactions/${modalItemId}`, { method: "DELETE" });
    setTransactions((prev) => prev.filter((t) => t.id !== modalItemId));
  } catch { /* ignore */ }
  setModal(null);
  return;
}
```

- [ ] **Step 5: 构建验证 + Commit**

```bash
cd /home/shepard/Workspaces/space-go/open/src/github.com/eviltomorrow/personal-service/apps/personal-web-admin && npx next build 2>&1 | tail -10
git add apps/personal-web-admin/src/app/dashboard/cash-flow/page.tsx
git commit -m "feat(cash-flow): transaction CRUD via API with date/note fields"
```

---

## Task 4: 最终验证

- [ ] **Step 1: Go 后端编译**

```bash
cd /home/shepard/Workspaces/space-go/open/src/github.com/eviltomorrow/personal-service && go build ./...
```

- [ ] **Step 2: Next.js 前端编译**

```bash
cd /home/shepard/Workspaces/space-go/open/src/github.com/eviltomorrow/personal-service/apps/personal-web-admin && npx next build 2>&1 | tail -10
```

- [ ] **Step 3: 最终提交**

```bash
git add -A && git commit -m "chore: final verification pass"
```
