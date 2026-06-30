# 仪表盘：月度预算 → 近期活动流

## 改动文件

`apps/personal-web-admin/src/app/dashboard/page.tsx`

## 改动内容

### 1. 替换 import（第 1-7 行）

**移除：** `Home, Car, Utensils, Shirt, BarChart3`

**新增：** `MessageCircle, RefreshCw`

当前：
```ts
import {
  Wallet, TrendingUp, ArrowUpRight, ArrowDownRight, Home, Car, Utensils, Shirt, BookOpen, Plus,
  ArrowRight, BarChart3, LayoutDashboard,
} from "lucide-react";
```

改为：
```ts
import {
  Wallet, TrendingUp, ArrowUpRight, ArrowDownRight, BookOpen, Plus,
  ArrowRight, LayoutDashboard, MessageCircle,
} from "lucide-react";
```

### 2. 删除 `monthlyBudget` 常量（第 27-35 行）

删除整个 `const monthlyBudget = [...]`

### 3. 添加 `recentActivity` 数据

在 `featureCards` 之后、`recentTransactions` 之前添加：

```ts
const recentActivity = [
  { type: "buy", text: "买入 贵州茅台 100股", module: "投资组合", time: "2小时前", href: "/dashboard/portfolio" },
  { type: "income", text: "工资入账 ¥28,500.00", module: "收入与支出", time: "3小时前", href: "/dashboard/cash-flow" },
  { type: "expense", text: "盒马鲜生 ¥328.50", module: "收入与支出", time: "5小时前", href: "/dashboard/cash-flow" },
  { type: "asset", text: "新增 货币资金 ¥500,000", module: "资产负债表", time: "昨天", href: "/dashboard/balance-sheet" },
  { type: "sell", text: "卖出 沪深300ETF 2手", module: "投资组合", time: "昨天", href: "/dashboard/portfolio" },
  { type: "expense", text: "物业管理费 ¥1,200.00", module: "收入与支出", time: "2天前", href: "/dashboard/cash-flow" },
];
```

### 4. 删除 `totalBudget`/`totalSpent` 计算

删除这两行：
```ts
const totalBudget = monthlyBudget.reduce((s, i) => s + i.budget, 0);
const totalSpent = monthlyBudget.reduce((s, i) => s + i.spent, 0);
```

### 5. 替换 Budget panel 为 Activity panel

**找到：**
```tsx
        {/* Budget overview */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          ... 整个 budget table 代码 ...
        </div>
```

**替换为：**
```tsx
        {/* Recent activity */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-between p-6 pb-4">
            <div>
              <h3 className="text-base font-semibold text-gray-900">近期活动</h3>
              <p className="text-sm text-gray-500">各模块的最新动态</p>
            </div>
          </div>
          <div className="divide-y divide-gray-100">
            {recentActivity.map((act, i) => {
              const iconMap: Record<string, string> = {
                buy: "text-emerald-600 bg-emerald-50",
                sell: "text-red-600 bg-red-50",
                income: "text-emerald-600 bg-emerald-50",
                expense: "text-red-600 bg-red-50",
                asset: "text-blue-600 bg-blue-50",
              };
              const dotCls = iconMap[act.type] || "text-gray-500 bg-gray-50";
              return (
                <a key={i} href={act.href}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors group">
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${dotCls}`}>
                    <MessageCircle className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 group-hover:text-slate-600 transition-colors">{act.text}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{act.time}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-gray-100 px-2.5 py-0.5 text-[10px] font-medium text-gray-600 ring-1 ring-gray-600/10">
                    {act.module}
                  </span>
                </a>
              );
            })}
          </div>
        </div>
```

### 6. 验证

```sh
cd apps/personal-web-admin && npx next build
```
