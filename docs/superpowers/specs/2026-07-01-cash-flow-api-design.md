# 收入与支出页面 API 对接设计

**日期:** 2026-07-01
**项目:** personal-service (Next.js + Go)

## 1. 数据模型变化

### 前端新的接口类型

```typescript
interface CashFlowItem {
  id: number;
  name: string;
  amount: number;
  date: string;       // "YYYY-MM-DD"
  note?: string;
}

interface CashFlowCategory {
  id: number;          // 后端 category.id
  category: string;    // 后端 category.name
  items: CashFlowItem[];
}

interface MonthCashFlow {
  income: CashFlowCategory[];
  expense: CashFlowCategory[];
}
```

### 状态变量变化

- 移除 `monthData: Record<string, MonthCashFlow>`（本地 mock）
- 新增 `categories: Category[]`（后端返回的全部分类列表）
- 新增 `transactions: Transaction[]`（当月交易列表）
- 新增 `loading: boolean`

汇总卡片（收入/支出/结余）通过前端 JS `reduce` 计算，不再依赖后端接口。

## 2. 页面加载流程

```
页面挂载 → GET /finance/categories → 存入 categories 状态
         → GET /finance/transactions?year=&month= → 存入 transactions 状态

切换月份 → GET /finance/transactions?year=&month= → 更新 transactions

展示时：用 categories 按 type 分收入/支出，每个 category 下 filter 出当月 transactions
汇总：用 transactions 进行 reduce 计算
```

## 3. CRUD 映射

| 前端操作 | HTTP 请求 |
|---------|----------|
| 页面加载分类 | `GET /api/v1/cash-flow/categories` |
| 页面加载交易 | `GET /api/v1/cash-flow/transactions?year=2026&month=7` |
| 添加分类 | `POST /api/v1/cash-flow/categories` `{ name, type, sort_order }` |
| 删除分类 | `DELETE /api/v1/cash-flow/categories/:id` |
| 添加交易 | `POST /api/v1/cash-flow/transactions` `{ category_id, type, name, amount, date, note }` |
| 编辑交易 | `PUT /api/v1/cash-flow/transactions/:id` `{ category_id, type, name, amount, date, note }` |
| 删除交易 | `DELETE /api/v1/cash-flow/transactions/:id` |

## 4. UI 变化

添加/编辑交易弹窗中增加：

- 日期字段：`<input type="date">`，默认当天，必填
- 备注字段：`<input type="text" placeholder="备注信息">`，可选

## 5. 不做的事情

- 分类编辑功能（前端暂不支持编辑分类名称，仅支持添加和删除）
- 分页（默认一次加载当月所有交易）
- 汇总接口（前端自行计算）
