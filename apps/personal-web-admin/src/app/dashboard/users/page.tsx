import { PageHeader } from "@/components/page-header";
import { Users, UserCheck, UserPlus, UserX, Shield } from "lucide-react";

const userStats = [
  { label: "Total Users", value: "12,847", change: "+156", icon: Users },
  { label: "Active", value: "8,423", change: "+89", icon: UserCheck },
  { label: "New (today)", value: "47", change: "+12", icon: UserPlus },
  { label: "Banned", value: "23", change: "-3", icon: UserX },
];

const users = [
  { name: "Olivia Martin", email: "olivia@example.com", role: "Admin", status: "Active" },
  { name: "Ava Johnson", email: "ava@example.com", role: "User", status: "Active" },
  { name: "Michael Chen", email: "michael@example.com", role: "Editor", status: "Active" },
  { name: "Sarah Williams", email: "sarah@example.com", role: "User", status: "Suspended" },
  { name: "James Wilson", email: "james@example.com", role: "User", status: "Active" },
  { name: "Emma Davis", email: "emma@example.com", role: "Admin", status: "Active" },
];

export default function UsersPage() {
  return (
    <div className="space-y-8 anim-in anim-fade anim-up" style={{ animationDuration: "500ms" }}>
      <PageHeader title="Users" description="Manage your user base and permissions." />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {userStats.map((s) => (
          <div key={s.label} className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <div className="rounded-lg bg-indigo-50 p-2.5">
                <s.icon className="h-5 w-5 text-indigo-600" />
              </div>
              <span className="text-xs text-gray-500">{s.change}</span>
            </div>
            <p className="mt-4 text-2xl font-semibold text-gray-900">{s.value}</p>
            <p className="mt-1 text-sm text-gray-500">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between p-6 pb-4">
          <h3 className="text-base font-semibold text-gray-900">All Users</h3>
          <button className="text-sm font-medium text-indigo-600 hover:text-indigo-500 transition-colors">Invite user</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-t border-gray-100">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((u) => (
                <tr key={u.email} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700">
                        {u.name.split(" ").map((n) => n[0]).join("")}
                      </div>
                      <span className="text-sm font-medium text-gray-900">{u.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 hidden sm:table-cell">{u.email}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
                      <Shield className="h-3 w-3" />
                      {u.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${
                      u.status === "Active" ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20" : "bg-amber-50 text-amber-700 ring-amber-600/20"
                    }`}>
                      {u.status}
                    </span>
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
