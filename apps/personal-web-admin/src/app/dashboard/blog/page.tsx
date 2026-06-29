import { PageHeader } from "@/components/page-header";
import { Calendar, Clock, ArrowRight, Hash, User } from "lucide-react";

const posts = [
  {
    title: "实时数据分析面板正式上线",
    excerpt: "我们激动地宣布全新的实时数据分析面板，为您提供零延迟的平台性能、用户行为和收入趋势洞察。",
    date: "2026年6月15日",
    readTime: "5分钟阅读",
    author: "John Doe",
    tags: ["产品", "功能"],
  },
  {
    title: "安全升级：双因素认证现已可用",
    excerpt: "为您的账户增加一层额外的安全保障。全新的双因素认证系统支持认证器应用、短信验证码和硬件安全密钥。",
    date: "2026年6月10日",
    readTime: "4分钟阅读",
    author: "Sarah Chen",
    tags: ["安全", "更新"],
  },
  {
    title: "我们如何将 API 延迟降低 40%",
    excerpt: "深入解析我们的基础设施优化之旅——从连接池管理和查询优化到边缘缓存，了解我们如何让您的 API 调用更快速。",
    date: "2026年6月3日",
    readTime: "8分钟阅读",
    author: "Mike Johnson",
    tags: ["工程", "性能"],
  },
  {
    title: "2026年第二季度平台报告：增长与里程碑",
    excerpt: "我们的季度报告显示活跃用户增长 32%，收入增长 28%，并发布了 12 项新功能。看看本季度我们共同取得的成就。",
    date: "2026年5月28日",
    readTime: "6分钟阅读",
    author: "John Doe",
    tags: ["公司", "报告"],
  },
  {
    title: "构建无障碍界面：我们的设计原则",
    excerpt: "无障碍不是事后考虑——它是核心原则。了解我们的设计系统以及我们如何让平台适用于所有用户。",
    date: "2026年5月20日",
    readTime: "7分钟阅读",
    author: "Emily Davis",
    tags: ["设计", "工程"],
  },
  {
    title: "Personal API 快速入门指南",
    excerpt: "全面的 REST 和 GraphQL API 集成指南，包括认证、速率限制、代码示例以及最佳实践。",
    date: "2026年5月12日",
    readTime: "10分钟阅读",
    author: "Alex Rivera",
    tags: ["API", "指南"],
  },
];

export default function BlogPage() {
  return (
    <div className="space-y-8 anim-in anim-fade anim-up" style={{ animationDuration: "500ms" }}>
      <PageHeader title="博客" description="来自团队的最新更新、指南和故事。" />

      {/* Timeline */}
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-[19px] top-2 bottom-2 w-0.5 bg-gradient-to-b from-slate-200 via-slate-300/50 to-slate-200 hidden md:block" />

        <div className="space-y-8">
          {posts.map((post, i) => (
            <div key={i} className="relative md:pl-14 group">
              {/* Timeline dot */}
              <div className="absolute left-[15px] top-[30px] w-[10px] h-[10px] rounded-full bg-slate-400 hidden md:block group-hover:hidden" />
              <div className="absolute left-[11px] top-[26px] w-[18px] h-[18px] rounded-full bg-white border-2 border-slate-400 hidden group-hover:block group-hover:border-slate-500 group-hover:bg-slate-50 transition-colors z-10" />

              {/* Card */}
              <div className="rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-all">
                <div className="p-6">
                  {/* Meta row */}
                  <div className="flex items-center gap-4 text-xs text-gray-400 mb-3 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {post.date}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {post.readTime}
                    </span>
                    <span className="flex items-center gap-1">
                      <User className="h-3.5 w-3.5" />
                      {post.author}
                    </span>
                  </div>

                  {/* Title */}
                  <h2 className="text-lg font-semibold text-gray-900 group-hover:text-slate-600 transition-colors">
                    {post.title}
                  </h2>

                  {/* Excerpt */}
                  <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                    {post.excerpt}
                  </p>

                  {/* Footer */}
                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-wrap">
                      {post.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2.5 py-0.5 text-xs font-medium text-slate-700 ring-1 ring-slate-600/10"
                        >
                          <Hash className="h-3 w-3" />
                          {tag}
                        </span>
                      ))}
                    </div>
                    <span className="flex items-center gap-1 text-sm font-medium text-slate-600 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0">
                      阅读更多
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
