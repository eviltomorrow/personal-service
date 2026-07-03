import { PageHeader } from "@/components/page-header";
import { LayoutDashboard, BookOpen, TrendingUp, Wallet, Settings } from "lucide-react";

const features = [
  {
    label: "仪表盘",
    description: "查看总资产趋势、本月收入与支出概览。",
    icon: LayoutDashboard,
  },
  {
    label: "资产负债表",
    description: "管理资产、负债和权益项目，按年月分类汇总。",
    icon: BookOpen,
  },
  {
    label: "投资组合",
    description: "管理投资品种、交易记录、市值快照和本金配置。",
    icon: TrendingUp,
  },
  {
    label: "收入与支出",
    description: "记录日常收支，管理分类，跟踪资金流动。",
    icon: Wallet,
  },
  {
    label: "系统设置",
    description: "修改昵称、邮箱、简介和个人头像。",
    icon: Settings,
  },
];

export default function HelpPage() {
  return (
    <div className="space-y-8 anim-in anim-fade anim-up" style={{ animationDuration: "500ms" }}>
      <PageHeader title="帮助中心" description="功能介绍和使用说明。" />

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-900">功能介绍</h3>
        </div>
        <div className="divide-y divide-gray-100">
          {features.map((f) => (
            <div key={f.label} className="flex items-start gap-4 px-6 py-4">
              <div className="rounded-lg bg-slate-100 p-2.5 shrink-0">
                <f.icon className="h-5 w-5 text-slate-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{f.label}</p>
                <p className="mt-0.5 text-sm text-gray-500">{f.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
