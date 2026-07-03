# Dashboard 仪表盘对接真实数据

**Date:** 2026-07-03
**Version:** 1.0
**Status:** Approved

## 1. 概述

将仪表盘页面 (`apps/personal-web-admin/src/app/dashboard/page.tsx`) 的静态 Mock 数据替换为从后端 API 获取的真实数据。同时将"近期活动"区块替换为"分类支出占比" donut 图。

## 2. 布局变更

| 区块 | 变更 |
|------|------|
| 汇总卡片（本月收入/本月支出/投资总市值） | Mock → API 真实数据 |
| 功能入口（4 个导航卡片） | 不变 |
| ~~近期活动~~ | **移除** |
| 分类支出占比图 | **新增**（替换近期活动） |
| 总资产走势图 | Mock → API 真实数据 |

## 3. 数据获取策略

### 3.1 请求清单

页面初始化时并行发起 4 个请求：

| 请求 | 端点 | 用途 |
|------|------|------|
| `fetchTransactions` | `GET /api/v1/cash-flow/transactions?year=&month=` | 收入/支出汇总 + 分类占比 |
| `fetchPositions` | `GET /api/v1/cash-flow/portfolio/positions` | 投资总市值 |
| `fetchSnapshots` | `GET /api/v1/cash-flow/portfolio/snapshots` | 总资产走势图 |
| `fetchCategories` | `GET /api/v1/cash-flow/categories?year=&month=` | 分类名称映射 |

### 3.2 实现模式

```typescript
const [transactions, setTransactions] = useState<Transaction[]>([]);
const [positions, setPositions] = useState<Position[]>([]);
const [snapshots, setSnapshots] = useState<ValueSnapshot[]>([]);
const [categories, setCategories] = useState<Category[]>([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth() + 1;
  Promise.all([
    api(`/api/v1/cash-flow/transactions?year=${y}&month=${m}`).then(r => r.json()),
    api("/api/v1/cash-flow/portfolio/positions").then(r => r.json()),
    api("/api/v1/cash-flow/portfolio/snapshots").then(r => r.json()),
    api(`/api/v1/cash-flow/categories?year=${y}&month=${m}`).then(r => r.json()),
  ]).then(([txRes, posRes, snapRes, catRes]) => {
    if (txRes.code === 0) setTransactions(txRes.data.transactions);
    if (posRes.code === 0) setPositions(posRes.data);
    if (snapRes.code === 0) setSnapshots(snapRes.data);
    if (catRes.code === 0) setCategories(catRes.data);
  }).finally(() => setLoading(false));
}, []);
```

遵循现有页面 (`cash-flow`, `balance-sheet`, `portfolio`) 的 `api()` + `useEffect` + `useState` 模式。

## 4. 汇总卡片

### 4.1 本月收入
- 从 `transactions` 筛选 `type === "income"`，累加 `amount`
- `amount` 单位为分，显示时除以 100
- 格式：`¥ 28,500.00`

### 4.2 本月支出
- 从 `transactions` 筛选 `type === "expense"`，累加 `amount`
- 格式同上

### 4.3 投资总市值
- 遍历 `positions`（仅活跃持仓），计算 `currentPrice * initialQty` 总和
- `currentPrice` 单位为分，除以 100 显示

### 4.4 变动百分比
- 收入/支出：环比上月（若无上月数据则隐藏百分比）
- 投资总市值：取 snapshots 中上月末值计算。若无则隐藏

## 5. 分类支出占比图

### 5.1 数据聚合
1. 从 `transactions` 筛出 `type === "expense"` 的当月记录
2. 按 `category_id` 分组，累加 `amount`
3. 通过 `categories` 建立 `id → name` 映射
4. 按金额降序排列，取前 5 项，其余归入"其他"

### 5.2 视觉
- 使用 `recharts` 的 `<PieChart>` + `<Cell>` 渲染 donut 图
- 预置 5 色循环：`#3b82f6` `#10b981` `#f59e0b` `#ef4444` `#8b5cf6`
- 左侧 donut 图 + 右侧图例（分类名 + 百分比）

### 5.3 占比计算
```
百分比 = 分类金额 / 总支出金额 * 100
```
保留整数百分比显示。

### 5.4 Loading/空状态
- 加载中：显示骨架屏占位
- 无支出数据：显示"本月暂无支出记录"

## 6. 总资产走势图

- 复用现有 `recharts` `BarChart` 组件和样式
- 数据源从静态 `assetData` 改为 `snapshots` API
- 按 `date` 排序，取最近 6~12 条
- 字段映射：`date` → 月份标签，`total_value` → 柱状图数据点
- 月度变动 = 本月值 - 上月值（已有逻辑复用）
- `ChartTooltip` 组件、`formatCNY`、`toWan` 函数复用

## 7. 变动百分比计算

- 收入/支出：环比上月增长率 = (本月值 - 上月值) / 上月值 * 100%
- 总市值：环比上月末变动 = (本月市值 - 上月末市值) / 上月末市值 * 100%
- 仅显示整数百分比，正数绿色 + 箭头向上，负数红色 + 箭头向下
- 缺少上月/上月末数据时不显示百分比区域

## 8. 边际问题

- **Loading 态**：页面初次加载时显示骨架屏，`loading` state 控制
- **空数据**：每个区块独立处理空数据展示，而非整个页面报错
- **API 错误**：单个接口失败不影响其他区块渲染。`Promise.all` 添加 `.catch` 兜底
- **日期切换**：目前仅显示当月数据，不提供月份切换（仪表盘定位为当前概览）
