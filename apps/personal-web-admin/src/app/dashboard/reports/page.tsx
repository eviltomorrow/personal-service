import { PageHeader } from "@/components/page-header";
import { FileText, Download, FileBarChart, FileSpreadsheet, FilePieChart } from "lucide-react";

const reports = [
  { name: "月度收入报表", date: "2026年6月1日", type: "PDF", size: "2.4 MB", icon: FileBarChart },
  { name: "用户增长分析", date: "2026年5月30日", type: "CSV", size: "1.8 MB", icon: FileSpreadsheet },
  { name: "转化漏斗分析", date: "2026年5月28日", type: "PDF", size: "3.1 MB", icon: FilePieChart },
  { name: "第二季度总结", date: "2026年5月25日", type: "PDF", size: "4.2 MB", icon: FileText },
  { name: "安全审计日志", date: "2026年5月20日", type: "CSV", size: "0.9 MB", icon: FileBarChart },
  { name: "客户满意度报告", date: "2026年5月15日", type: "PDF", size: "1.5 MB", icon: FileSpreadsheet },
];

export default function ReportsPage() {
  return (
    <div className="space-y-8 anim-in anim-fade anim-up" style={{ animationDuration: "500ms" }}>
      <PageHeader
        title="报表"
        description="下载和管理平台报表。"
        actions={
          <button className="flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 transition-colors">
            <FileText className="h-4 w-4" />
            生成报表
          </button>
        }
      />

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">名称</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">日期</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">大小</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">类型</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {reports.map((r) => (
                <tr key={r.name} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-gray-100 p-2">
                        <r.icon className="h-4 w-4 text-gray-600" />
                      </div>
                      <span className="text-sm font-medium text-gray-900">{r.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 hidden sm:table-cell">{r.date}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 hidden sm:table-cell">{r.size}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">{r.type}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="inline-flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-slate-500 transition-colors">
                      <Download className="h-4 w-4" />
                      下载
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
