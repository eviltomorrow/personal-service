# Portfolio Archive List

**Date:** 2026-07-01
**Status:** Draft

## Problem

投资组合页面需要支持清仓品种管理。用户在"持仓列表"下需要一个"归档列表"来存放已清仓的品种，持仓和归档之间可以自由拖动，右侧详情面板根据列表类型展示不同内容。

## Requirements

1. 左面板"持仓列表"下方新增"归档列表"，存放已清仓品种
2. 品种可自由拖拽在持仓列表和归档列表之间移动
3. 右侧选中品种展示对应的详情面板：
   - 持仓品种：现有完整面板（价格、市值、盈亏、买卖记录等）
   - 归档品种：简化面板（仅代码/名称/清仓盈亏/只读买卖记录）
4. 自动归档：当品种持仓量 `quantity` 变为 0 时自动移入归档列表
5. 手动拖入/拖出不受限

## Data Model

在 `Position` 接口新增两个字段：

```typescript
interface Position {
  // ... 现有字段
  archived: boolean;   // 是否已归档
  closedPnl?: number;  // 清仓时盈亏快照
}
```

- `archived` 默认 `false`
- `closedPnl` 在自动/手动归档时根据当前 `profitAmount` 快照写入

## Architecture

### Left Panel Layout

```
┌──────────────────────────┐
│  📋 持仓列表              │  ← 灰色标题栏
│  持仓项（SortableContext） │
│  + 新增品种               │
├──────────────────────────┤
│  🗄️ 归档列表 (N)         │  ← 灰色标题栏 + 计数
│  归档项（SortableContext） │
│  空状态提示               │
└──────────────────────────┘
```

### Drag-and-Drop

- 同一 `DndContext` 内两个 `SortableContext`（持仓 items、归档 items）
- `handleDragEnd` 根据目标位置判断操作：
  - 持仓→归档：`archived = true`，快照 `closedPnl`
  - 归档→持仓：`archived = false`，清除 `closedPnl`
  - 同列表内：仅排序

### Auto-Archive

在 `handleUpdatePosition` 和 `handleAddTrade` 中，当 `quantity` 计算后为 0 时自动设 `archived = true` 并快照 `closedPnl`。

### Right Panel

- 持仓品种：`RightPanel`（现有，不变）
- 归档品种：`ArchivedRightPanel`（新增，简化版）

```typescript
// ArchivedRightPanel 展示内容：
// - 代码 + 名称 + "已归档" 标签
// - 清仓盈亏（closedPnl，绿色/红色数字）
// - 买卖记录（只读，无增删改按钮）
// - 不展示：现价/市值/成本/持仓量/保证金/杠杆/持仓占比
```

### StatCards & TrendChart

归档品种不参与 StatCards 和 TrendChart 的计算。`positions` 计算时过滤掉 `archived === true` 的条目。TrendChart 保持现有逻辑不变。

## Components Changed

| File | Change |
|------|--------|
| `apps/personal-web-admin/src/app/dashboard/portfolio/page.tsx` | 新增 `archived`/`closedPnl` 字段；新增 `ArchivedRightPanel`；改造 `LeftPanel` 为双列表；修改 `handleDragEnd` 支持跨列表；修改 StatCards 过滤归档；修改自动归档逻辑 |

## Out of Scope

- 无后端持久化（仍为 useState 内存状态）
- 无批量操作
- 无排序/过滤/搜索功能
