import { PageHeader } from "@/components/page-header";
import { FileText, Download, FileBarChart, FileSpreadsheet, FilePieChart } from "lucide-react";

const reports = [
  { name: "Monthly Revenue Report", date: "Jun 1, 2026", type: "PDF", size: "2.4 MB", icon: FileBarChart },
  { name: "User Growth Analytics", date: "May 30, 2026", type: "CSV", size: "1.8 MB", icon: FileSpreadsheet },
  { name: "Conversion Funnel", date: "May 28, 2026", type: "PDF", size: "3.1 MB", icon: FilePieChart },
  { name: "Quarterly Summary Q2", date: "May 25, 2026", type: "PDF", size: "4.2 MB", icon: FileText },
  { name: "Security Audit Log", date: "May 20, 2026", type: "CSV", size: "0.9 MB", icon: FileBarChart },
  { name: "Customer Satisfaction", date: "May 15, 2026", type: "PDF", size: "1.5 MB", icon: FileSpreadsheet },
];

export default function ReportsPage() {
  return (
    <div className="space-y-8 anim-in anim-fade anim-up" style={{ animationDuration: "500ms" }}>
      <PageHeader title="Reports" description="Download and manage your platform reports." />

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between p-6 pb-4">
          <h3 className="text-base font-semibold text-gray-900">Available Reports</h3>
          <button className="flex items-center gap-1.5 rounded-lg bg-indigo-50 px-3 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-100 transition-colors">
            <FileText className="h-4 w-4" />
            Generate
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-t border-gray-100">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Size</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
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
                    <button className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-500 transition-colors">
                      <Download className="h-4 w-4" />
                      Download
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
