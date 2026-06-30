import { PageHeader } from "@/components/page-header";
import { Wallet, TrendingUp, ArrowUpRight, ArrowDownRight, Home, Car, Utensils, Shirt, BookOpen, Plus, Feather } from "lucide-react";

const summaryCards = [
  {
    label: "本月收入",
    value: "¥ 28,500.00",
    change: "+8.3%",
    trend: "up" as const,
    icon: TrendingUp,
  },
  {
    label: "本月支出",
    value: "¥ 16,230.00",
    change: "-2.1%",
    trend: "down" as const,
    icon: Wallet,
  },
  {
    label: "净结余",
    value: "¥ 12,270.00",
    change: "+15.6%",
    trend: "up" as const,
    icon: TrendingUp,
  },
];

const quickActionCards = [
  { label: "发布博客", icon: Feather, href: "/dashboard/blog", color: "from-slate-600 to-slate-700" },
];

const monthlyBudget = [
  { category: "住房", budget: 5000, spent: 4800, icon: Home, color: "text-slate-600" },
  { category: "交通", budget: 2000, spent: 1650, icon: Car, color: "text-amber-600" },
  { category: "餐饮", budget: 3000, spent: 2850, icon: Utensils, color: "text-emerald-600" },
  { category: "购物", budget: 2500, spent: 1900, icon: Shirt, color: "text-rose-600" },
  { category: "学习", budget: 1500, spent: 980, icon: BookOpen, color: "text-cyan-600" },
  { category: "其他", budget: 2000, spent: 1050, icon: Plus, color: "text-gray-600" },
];

const recentTransactions = [
  { date: "06-28", description: "盒马鲜生 - 超市购物", category: "餐饮", amount: -328.50, type: "expense" as const },
  { date: "06-28", description: "工资入账 - 6月", category: "收入", amount: 28500.00, type: "income" as const },
  { date: "06-27", description: "滴滴出行 - 打车", category: "交通", amount: -45.00, type: "expense" as const },
  { date: "06-27", description: "星巴克 - 咖啡", category: "餐饮", amount: -36.00, type: "expense" as const },
  { date: "06-26", description: "物业管理费", category: "住房", amount: -1200.00, type: "expense" as const },
  { date: "06-25", description: "京东 - 日用品", category: "购物", amount: -256.80, type: "expense" as const },
  { date: "06-24", description: "理财收益", category: "收入", amount: 356.20, type: "income" as const },
];

function formatCNY(amount: number) {
  const prefix = amount < 0 ? "- " : "";
  return `${prefix}¥ ${Math.abs(amount).toLocaleString("zh-CN")}.00`;
}

export default function DashboardPage() {
  const totalBudget = monthlyBudget.reduce((s, i) => s + i.budget, 0);
  const totalSpent = monthlyBudget.reduce((s, i) => s + i.spent, 0);

  return (
    <div className="space-y-8 anim-in anim-fade anim-up" style={{ animationDuration: "500ms" }}>
      <PageHeader title="仪表盘" description="欢迎回来，这是本月的财务概况。" />

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {quickActionCards.map((action) => (
          <a
            key={action.label}
            href={action.href}
            className="group flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5"
          >
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br ${action.color} shadow-sm transition-all group-hover:shadow-md group-hover:scale-105`}>
              <action.icon className="h-5 w-5 text-white" />
            </div>
            <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors">
              {action.label}
            </span>
          </a>
        ))}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {summaryCards.map((card) => (
          <div
            key={card.label}
            className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="rounded-lg bg-slate-100 p-2.5">
                <card.icon className="h-5 w-5 text-slate-600" />
              </div>
              <span
                className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-medium ${
                  card.trend === "up"
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-red-50 text-red-700"
                }`}
              >
                {card.trend === "up" ? (
                  <ArrowUpRight className="h-3 w-3" />
                ) : (
                  <ArrowDownRight className="h-3 w-3" />
                )}
                {card.change}
              </span>
            </div>
            <p className="mt-4 text-2xl font-semibold text-gray-900">{card.value}</p>
            <p className="mt-1 text-sm text-gray-500">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Budget overview */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-between p-6 pb-4">
            <div>
              <h3 className="text-base font-semibold text-gray-900">月度预算</h3>
              <p className="text-sm text-gray-500">本月各项预算使用情况</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-t border-gray-100 bg-gray-50/50">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">项目</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">预算</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">已用</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">进度</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {monthlyBudget.map((item) => {
                  const pct = Math.round((item.spent / item.budget) * 100);
                  return (
                    <tr key={item.category} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="rounded-lg bg-gray-100 p-1.5">
                            <item.icon className={`h-4 w-4 ${item.color}`} />
                          </div>
                          <span className="text-sm font-medium text-gray-900">{item.category}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right text-sm text-gray-700 tabular-nums">
                        ¥{item.budget.toLocaleString("zh-CN")}
                      </td>
                      <td className="px-6 py-4 text-right text-sm text-gray-700 tabular-nums">
                        ¥{item.spent.toLocaleString("zh-CN")}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-20 bg-gray-100 rounded-full h-2 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-700 bg-gradient-to-r ${
                                pct > 90 ? "from-red-400 to-red-500" : pct > 75 ? "from-amber-400 to-amber-500" : "from-slate-400 to-slate-500"
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-500 w-8 text-right tabular-nums">{pct}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-200 bg-gray-50/80">
                  <td className="px-6 py-3.5 text-sm font-semibold text-gray-800">合计</td>
                  <td className="px-6 py-3.5 text-right text-sm font-semibold text-gray-900 tabular-nums">
                    ¥{totalBudget.toLocaleString("zh-CN")}
                  </td>
                  <td className="px-6 py-3.5 text-right text-sm font-semibold text-gray-900 tabular-nums">
                    ¥{totalSpent.toLocaleString("zh-CN")}
                  </td>
                  <td className="px-6 py-3.5 text-right text-sm font-semibold text-gray-900 tabular-nums">
                    {Math.round((totalSpent / totalBudget) * 100)}%
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Recent transactions */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-between p-6 pb-4">
            <div>
              <h3 className="text-base font-semibold text-gray-900">最近交易</h3>
              <p className="text-sm text-gray-500">近期的收支记录</p>
            </div>
            <button className="text-sm font-medium text-slate-600 hover:text-slate-500 transition-colors">查看全部</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-t border-gray-100 bg-gray-50/50">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">日期</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">描述</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">分类</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">金额</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentTransactions.map((tx, i) => (
                  <tr key={i} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-500 tabular-nums">{tx.date}</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{tx.description}</td>
                    <td className="px-6 py-4 hidden sm:table-cell">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${
                        tx.type === "income"
                          ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20"
                          : "bg-gray-50 text-gray-600 ring-gray-600/20"
                      }`}>
                        {tx.category}
                      </span>
                    </td>
                    <td className={`px-6 py-4 text-right text-sm font-medium tabular-nums ${
                      tx.type === "income" ? "text-emerald-600" : "text-gray-900"
                    }`}>
                      {tx.type === "income" ? "+ " : "- "}
                      ¥ {Math.abs(tx.amount).toLocaleString("zh-CN")}.00
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
