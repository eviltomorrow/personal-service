import { PageHeader } from "@/components/page-header";
import { UserPlus, ShoppingCart, Settings, Shield, LogIn, FileText } from "lucide-react";

const activities = [
  { action: "新用户注册", detail: "Emma Davis 创建了账户", time: "2分钟前", icon: UserPlus, color: "text-emerald-600" },
  { action: "订单完成", detail: "订单 #3821 已完成", time: "15分钟前", icon: ShoppingCart, color: "text-slate-600" },
  { action: "设置更新", detail: "API 速率限制已修改", time: "1小时前", icon: Settings, color: "text-amber-600" },
  { action: "安全警报", detail: "来自未知设备的新登录", time: "2小时前", icon: Shield, color: "text-red-600" },
  { action: "用户登录", detail: "John Doe 登录了系统", time: "3小时前", icon: LogIn, color: "text-emerald-600" },
  { action: "报表生成", detail: "6月月度报表已生成", time: "5小时前", icon: FileText, color: "text-slate-600" },
  { action: "新用户注册", detail: "James Wilson 创建了账户", time: "6小时前", icon: UserPlus, color: "text-emerald-600" },
  { action: "订单退款", detail: "订单 #3810 已退款", time: "8小时前", icon: ShoppingCart, color: "text-red-600" },
];

export default function ActivityPage() {
  return (
    <div className="space-y-8 anim-in anim-fade anim-up" style={{ animationDuration: "500ms" }}>
      <PageHeader title="活动记录" description="平台实时活动日志。" />

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="p-6 pb-4">
          <h3 className="text-base font-semibold text-gray-900">实时动态</h3>
          <p className="text-sm text-gray-500 mt-1">平台近期操作记录。</p>
        </div>

        <div className="space-y-0">
          {activities.map((a, i) => (
            <div key={i} className="flex items-start gap-4 px-6 py-4 border-t border-gray-100 first:border-t-0 hover:bg-gray-50/50 transition-colors">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 shrink-0">
                <a.icon className={`h-4 w-4 ${a.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">{a.action}</p>
                <p className="text-xs text-gray-500 mt-0.5">{a.detail}</p>
              </div>
              <span className="text-xs text-gray-400 shrink-0">{a.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
