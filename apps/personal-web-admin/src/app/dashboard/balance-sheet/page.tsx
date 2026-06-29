import { PageHeader } from "@/components/page-header";
import { Wallet, Landmark, TrendingUp, ArrowUpRight, ArrowDownRight, AlertCircle } from "lucide-react";

const summaryCards = [
  {
    label: "总资产",
    value: "¥ 1,286,500.00",
    change: "+3.2%",
    trend: "up",
    icon: Wallet,
  },
  {
    label: "总负债",
    value: "¥ 523,400.00",
    change: "-1.8%",
    trend: "down",
    icon: Landmark,
  },
  {
    label: "净资产",
    value: "¥ 763,100.00",
    change: "+6.7%",
    trend: "up",
    icon: TrendingUp,
  },
];

const balanceSheetData = [
  {
    category: "流动资产",
    items: [
      { name: "现金及银行存款", amount: 285000 },
      { name: "应收账款", amount: 128000 },
      { name: "存货", amount: 96000 },
      { name: "短期投资", amount: 50000 },
    ],
  },
  {
    category: "非流动资产",
    items: [
      { name: "固定资产", amount: 420000 },
      { name: "长期投资", amount: 180000 },
      { name: "无形资产", amount: 62500 },
      { name: "长期待摊费用", amount: 65000 },
    ],
  },
  {
    category: "流动负债",
    items: [
      { name: "应付账款", amount: 156000 },
      { name: "短期借款", amount: 100000 },
      { name: "应付职工薪酬", amount: 38400 },
    ],
  },
  {
    category: "非流动负债",
    items: [
      { name: "长期借款", amount: 180000 },
      { name: "应付债券", amount: 49000 },
    ],
  },
  {
    category: "净资产",
    items: [
      { name: "实收资本", amount: 500000 },
      { name: "资本公积", amount: 120000 },
      { name: "未分配利润", amount: 143100 },
    ],
  },
];

function formatCNY(amount: number) {
  return `¥ ${amount.toLocaleString("zh-CN")}.00`;
}

export default function BalanceSheetPage() {
  const totalAssets =
    balanceSheetData
      .slice(0, 2)
      .flatMap((g) => g.items)
      .reduce((s, i) => s + i.amount, 0);
  const totalLiabilities =
    balanceSheetData
      .slice(2, 4)
      .flatMap((g) => g.items)
      .reduce((s, i) => s + i.amount, 0);
  const totalEquity =
    balanceSheetData
      .slice(4)
      .flatMap((g) => g.items)
      .reduce((s, i) => s + i.amount, 0);

  return (
    <div className="space-y-8 anim-in anim-fade anim-up" style={{ animationDuration: "500ms" }}>
      <PageHeader title="资产负债表" description="个人资产负债总览，更新于 2026年6月29日" />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {summaryCards.map((card) => (
          <div
            key={card.label}
            className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="rounded-lg bg-indigo-50 p-2.5">
                <card.icon className="h-5 w-5 text-indigo-600" />
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

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between p-6 pb-4">
          <div>
            <h3 className="text-base font-semibold text-gray-900">资产负债表明细</h3>
            <p className="text-sm text-gray-500">按类别分类的资产与负债清单</p>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
            <AlertCircle className="h-3.5 w-3.5" />
            数据仅供参考
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-t border-gray-100 bg-gray-50/50">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/2">项目</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">金额</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {balanceSheetData.map((group) => (
                <tr key={group.category}>
                  <td
                    colSpan={2}
                    className={`px-6 py-3 text-sm font-semibold ${
                      group.category === "净资产"
                        ? "text-emerald-700 bg-emerald-50/50"
                        : group.category === "流动资产" || group.category === "非流动资产"
                          ? "text-indigo-700 bg-indigo-50/50"
                          : "text-amber-700 bg-amber-50/50"
                    }`}
                  >
                    {group.category}
                  </td>
                </tr>
              ))}
              {balanceSheetData.map((group) =>
                group.items.map((item) => (
                  <tr key={item.name} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3.5 pl-14 text-sm text-gray-700">{item.name}</td>
                    <td className="px-6 py-3.5 text-right text-sm font-medium text-gray-900 tabular-nums">
                      {formatCNY(item.amount)}
                    </td>
                  </tr>
                ))
              )}
              {/* Subtotals */}
              <tr className="border-t-2 border-gray-200 bg-gray-50/80">
                <td className="px-6 py-3.5 text-sm font-semibold text-gray-800">资产合计</td>
                <td className="px-6 py-3.5 text-right text-sm font-semibold text-gray-900 tabular-nums">
                  {formatCNY(totalAssets)}
                </td>
              </tr>
              <tr className="bg-gray-50/80">
                <td className="px-6 py-3.5 text-sm font-semibold text-gray-800">负债合计</td>
                <td className="px-6 py-3.5 text-right text-sm font-semibold text-gray-900 tabular-nums">
                  {formatCNY(totalLiabilities)}
                </td>
              </tr>
              <tr className="bg-gray-50/80 border-t-2 border-emerald-200">
                <td className="px-6 py-3.5 text-sm font-semibold text-emerald-800">净资产合计</td>
                <td className="px-6 py-3.5 text-right text-sm font-semibold text-emerald-700 tabular-nums">
                  {formatCNY(totalEquity)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
