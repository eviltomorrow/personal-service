"use client";

import { PageHeader } from "@/components/page-header";
import { Bell, Globe, Lock, CreditCard, Users, ChevronRight } from "lucide-react";

const sections = [
  { label: "个人信息", description: "管理您的个人信息", icon: Users },
  { label: "通知设置", description: "配置邮件和推送通知", icon: Bell },
  { label: "安全设置", description: "密码、双因素认证和会话管理", icon: Lock },
  { label: "账单管理", description: "订阅和支付方式", icon: CreditCard },
  { label: "偏好设置", description: "语言、时区和显示设置", icon: Globe },
];

export default function SettingsPage() {
  return (
    <div className="space-y-8 anim-in anim-fade anim-up" style={{ animationDuration: "500ms" }}>
      <PageHeader title="系统设置" description="管理您的账户设置和偏好。" />

      <div className="grid grid-cols-1 gap-4">
        {sections.map((s) => (
          <button
            key={s.label}
            className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition-all text-left w-full group"
          >
            <div className="rounded-lg bg-slate-100 p-2.5 group-hover:bg-slate-200 transition-colors">
              <s.icon className="h-5 w-5 text-slate-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">{s.label}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.description}</p>
            </div>
            <ChevronRight className="h-5 w-5 text-gray-300 group-hover:text-gray-500 transition-colors" />
          </button>
        ))}
      </div>
    </div>
  );
}
