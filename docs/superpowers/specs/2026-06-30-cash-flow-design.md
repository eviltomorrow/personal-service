# 现金流量表（收入与支出）设计文档

**日期:** 2026-06-30
**项目:** personal-web-admin (Next.js 15)
**版本:** 1.0

## 1. 概述

在 admin dashboard 中新增现金流量表独立页面，用于按月记录和查看收入与支出的明细数据，功能与现有资产负债表页面一致：月维度 CRUD、汇总统计、内存存储。

## 2. 路由与导航

- **路由:** `/dashboard/cash-flow`
- **导航栏:** 在左侧 sidebar 中「资产负债表」之后增加「现金流量表」菜单项
- **页面类型:** `"use client"` 客户端组件
- **文件位置:** `src/app/dashboard/cash-flow/page.tsx`

## 3. 页面布局

### 3.1 月份切换器

复用 balance-sheet 的 month picker 模式：
- 左右箭头导航月份
- 点击月份文字弹出月份选择器（年切换 + 12 月网格）
- 切换月份时，若目标月份无数据，初始化为空数据（`{ income: [], expense: [] }`），因为收支数据按月度独立

### 3.2 汇总卡片（3 张）

| 卡片 | 颜色 | 说明 |
|------|------|------|
| 总收入 | 绿色（emerald） | 当前月份所有收入条目之和 |
| 总支出 | 红色（red） | 当前月份所有支出条目之和 |
| 净结余 | 蓝色（blue） | 总收入 - 总支出，负值显示红色 |

每张卡片显示金额 + 环比变化百分比（与上个月比较）。

### 3.3 收入区（上）

- 标题栏：「💰 收入」+ 添加按钮（+）
- 分类列表（可配置，默认）：
  - 工资
  - 理财收益
  - 兼职
  - 其他
- 每行：分类名 + 金额（绿色） + 编辑/删除按钮（hover 显示）
- 底部小计行（浅绿背景，粗体）

### 3.4 支出区（下）

- 标题栏：「💸 支出」+ 添加按钮（+）
- 分类列表（可配置，默认）：
  - 住房
  - 餐饮
  - 交通
  - 购物
  - 学习
  - 医疗
  - 娱乐
  - 其他
- 每行：分类名 + 金额（红色） + 编辑/删除按钮（hover 显示）
- 底部小计行（浅红背景，粗体）

## 4. 数据模型

```typescript
interface CashFlowItem {
  category: string;   // 分类名
  amount: number;     // 金额（正数）
}

interface MonthCashFlow {
  income: CashFlowItem[];
  expense: CashFlowItem[];
}
```

数据按月份存储：
```typescript
type MonthData = Record<string, MonthCashFlow>;  // key: "YYYY-MM"
const INCOME_CATEGORIES = ["工资", "理财收益", "兼职", "其他"];
const EXPENSE_CATEGORIES = ["住房", "餐饮", "交通", "购物", "学习", "医疗", "娱乐", "其他"];
```

## 5. 交互

| 操作 | 行为 |
|------|------|
| 点击「+」 | 弹出添加 Modal，选择分类 + 输入金额 |
| 点击编辑图标 | 弹出编辑 Modal，预填当前值 |
| 点击删除图标 | 弹出确认删除 Modal |
| 保存 | 更新当前月份的数据（React state） |
| 月份切换 | 切换 monthData key，目标月份无数据则初始化为空数据 |

## 6. 组件复用

- 不提取独立组件（与 balance-sheet 同级别，直接内联实现）
- 月份选择器逻辑与 balance-sheet 一致但独立实现（不共享）
- Modal 样式与 balance-sheet 保持一致

## 7. 数据存储

- 当前: React useState 内存存储（刷新丢失）
- 与 balance-sheet 存储方式完全一致
- 后续可接入 localStorage 或 API 持久化

## 8. 边界情况

- 空数据: 收入/支出区显示「暂无数据」占位文字
- 净结余为负: 金额标红
- 金额输入: 仅允许正数，带 ¥ 前缀输入框
- 分类不允许自定义（固定分类列表）
- 环比变化: 若上月无数据则显示「-」

## 9. 文件清单

```
src/app/dashboard/cash-flow/
└── page.tsx              # 现金流量表页面（新增）
src/app/dashboard/layout.tsx  # 导航栏添加菜单项（修改）
```
