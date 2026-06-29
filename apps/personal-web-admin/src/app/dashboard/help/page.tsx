import { PageHeader } from "@/components/page-header";
import { HelpCircle, BookOpen, MessageCircle, FileText, LifeBuoy, Mail } from "lucide-react";

const resources = [
  { label: "使用文档", description: "全面的使用指南和 API 参考", icon: BookOpen },
  { label: "常见问题", description: "常见问题解答", icon: HelpCircle },
  { label: "社区论坛", description: "与其他用户交流讨论", icon: MessageCircle },
  { label: "API 参考", description: "接口文档和代码示例", icon: FileText },
  { label: "技术支持", description: "联系技术支持团队", icon: LifeBuoy },
  { label: "联系我们", description: "通过邮件与我们取得联系", icon: Mail },
];

export default function HelpPage() {
  return (
    <div className="space-y-8 anim-in anim-fade anim-up" style={{ animationDuration: "500ms" }}>
      <PageHeader title="帮助中心" description="查找答案和获取支持。" />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
        {resources.map((r) => (
          <button
            key={r.label}
            className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all text-left group"
          >
            <div className="rounded-lg bg-slate-100 p-2.5 w-fit group-hover:bg-slate-200 transition-colors">
              <r.icon className="h-5 w-5 text-slate-600" />
            </div>
            <p className="mt-4 text-sm font-medium text-gray-900">{r.label}</p>
            <p className="mt-1 text-xs text-gray-500">{r.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
