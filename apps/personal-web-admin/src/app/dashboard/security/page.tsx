import { PageHeader } from "@/components/page-header";
import { Shield, Key, Smartphone, History, CheckCircle } from "lucide-react";

const items = [
  { label: "双因素认证", description: "为您的账户添加额外安全层", status: "已启用", icon: Key },
  { label: "活跃会话", description: "管理设备和会话", status: "3个活跃", icon: Smartphone },
  { label: "登录历史", description: "查看最近的登录活动", status: "查看", icon: History },
  { label: "密码强度", description: "上次修改于30天前", status: "强", icon: Shield },
];

export default function SecurityPage() {
  return (
    <div className="space-y-8 anim-in anim-fade anim-up" style={{ animationDuration: "500ms" }}>
      <PageHeader title="安全设置" description="保护您的账户并查看安全设置。" />

      <div className="grid grid-cols-1 gap-4">
        {items.map((item) => (
          <button
            key={item.label}
            className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition-all text-left w-full group"
          >
            <div className="rounded-lg bg-slate-100 p-2.5 group-hover:bg-slate-200 transition-colors">
              <item.icon className="h-5 w-5 text-slate-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">{item.label}</p>
              <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
            </div>
            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
              item.status === "已启用" || item.status === "强"
                ? "bg-emerald-50 text-emerald-700"
                : "bg-gray-100 text-gray-700"
            }`}>
              {(item.status === "已启用" || item.status === "强") && (
                <CheckCircle className="h-3 w-3" />
              )}
              {item.status}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
