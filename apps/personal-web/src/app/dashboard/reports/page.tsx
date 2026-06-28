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
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-2xl font-semibold text-white">Reports</h1>
        <p className="mt-1 text-sm text-white/50">Download and manage your platform reports.</p>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm">
        <div className="flex items-center justify-between p-6 pb-4">
          <h3 className="text-base font-semibold text-white">Available Reports</h3>
          <button className="flex items-center gap-1.5 rounded-lg bg-indigo-500/20 px-3 py-2 text-sm font-medium text-indigo-400 hover:bg-indigo-500/30 transition-colors">
            <FileText className="h-4 w-4" />
            Generate
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-t border-white/10">
                <th className="px-6 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider hidden sm:table-cell">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider hidden sm:table-cell">Size</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-white/40 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {reports.map((r) => (
                <tr key={r.name} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-white/10 p-2">
                        <r.icon className="h-4 w-4 text-white/60" />
                      </div>
                      <span className="text-sm font-medium text-white/80">{r.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-white/60 hidden sm:table-cell">{r.date}</td>
                  <td className="px-6 py-4 text-sm text-white/60 hidden sm:table-cell">{r.size}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-medium text-white/60">
                      {r.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="inline-flex items-center gap-1 text-sm font-medium text-indigo-400 hover:text-indigo-300 transition-colors">
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
