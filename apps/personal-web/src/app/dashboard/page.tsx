import {
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  ShoppingCart,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  MoreHorizontal,
} from "lucide-react";

const stats = [
  {
    label: "Total Revenue",
    value: "$48,295",
    change: "+12.5%",
    trend: "up",
    icon: DollarSign,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
  },
  {
    label: "Active Users",
    value: "2,847",
    change: "+8.2%",
    trend: "up",
    icon: Users,
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  {
    label: "Orders",
    value: "1,423",
    change: "-3.1%",
    trend: "down",
    icon: ShoppingCart,
    color: "text-amber-600",
    bg: "bg-amber-50",
  },
  {
    label: "Conversion Rate",
    value: "3.24%",
    change: "+1.8%",
    trend: "up",
    icon: Activity,
    color: "text-violet-600",
    bg: "bg-violet-50",
  },
];

const recentOrders = [
  {
    id: "#3821",
    customer: "Olivia Martin",
    email: "olivia@example.com",
    product: "Premium Plan",
    amount: "$49.00",
    status: "Completed",
  },
  {
    id: "#3820",
    customer: "Ava Johnson",
    email: "ava@example.com",
    product: "Basic Plan",
    amount: "$19.00",
    status: "Pending",
  },
  {
    id: "#3819",
    customer: "Michael Chen",
    email: "michael@example.com",
    product: "Enterprise Plan",
    amount: "$199.00",
    status: "Completed",
  },
  {
    id: "#3818",
    customer: "Sarah Williams",
    email: "sarah@example.com",
    product: "Premium Plan",
    amount: "$49.00",
    status: "Processing",
  },
  {
    id: "#3817",
    customer: "James Wilson",
    email: "james@example.com",
    product: "Basic Plan",
    amount: "$19.00",
    status: "Completed",
  },
];

const statusStyles: Record<string, string> = {
  Completed: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  Pending: "bg-amber-50 text-amber-700 ring-amber-600/20",
  Processing: "bg-blue-50 text-blue-700 ring-blue-600/20",
};

export default function DashboardPage() {
  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Welcome back, John. Here&apos;s what&apos;s happening today.
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-gray-200 bg-white p-6 shadow-xs hover:shadow-sm transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div className={`rounded-lg ${stat.bg} p-2.5`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <span
                className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-medium ${
                  stat.trend === "up"
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-red-50 text-red-700"
                }`}
              >
                {stat.trend === "up" ? (
                  <ArrowUpRight className="h-3 w-3" />
                ) : (
                  <ArrowDownRight className="h-3 w-3" />
                )}
                {stat.change}
              </span>
            </div>
            <p className="mt-4 text-2xl font-semibold text-gray-900">
              {stat.value}
            </p>
            <p className="mt-1 text-sm text-gray-500">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Chart placeholder */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-semibold text-gray-900">
                Revenue Overview
              </h3>
              <p className="text-sm text-gray-500">Monthly revenue for 2026</p>
            </div>
            <button className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
              <MoreHorizontal className="h-5 w-5" />
            </button>
          </div>
          <div className="h-64 flex items-end justify-between gap-2">
            {[
              { label: "Jan", value: 45, color: "bg-primary-500" },
              { label: "Feb", value: 52, color: "bg-primary-500" },
              { label: "Mar", value: 48, color: "bg-primary-500" },
              { label: "Apr", value: 70, color: "bg-primary-500" },
              { label: "May", value: 55, color: "bg-primary-500" },
              { label: "Jun", value: 82, color: "bg-primary-500" },
              { label: "Jul", value: 65, color: "bg-primary-500" },
              { label: "Aug", value: 58, color: "bg-primary-500" },
              { label: "Sep", value: 75, color: "bg-primary-500" },
              { label: "Oct", value: 68, color: "bg-primary-500" },
              { label: "Nov", value: 88, color: "bg-primary-500" },
              { label: "Dec", value: 95, color: "bg-primary-600" },
            ].map((bar) => (
              <div key={bar.label} className="flex flex-col items-center gap-2 flex-1">
                <div className="w-full bg-gray-100 rounded-full relative" style={{ height: "200px" }}>
                  <div
                    className={`absolute bottom-0 left-0 right-0 ${bar.color} rounded-full transition-all duration-500`}
                    style={{ height: `${bar.value}%` }}
                  />
                </div>
                <span className="text-xs text-gray-400">{bar.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent orders */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-xs">
          <div className="flex items-center justify-between p-6 pb-4">
            <div>
              <h3 className="text-base font-semibold text-gray-900">
                Recent Orders
              </h3>
              <p className="text-sm text-gray-500">
                Latest transactions this month
              </p>
            </div>
            <button className="text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors">
              View all
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-t border-gray-100">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Order
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider hidden sm:table-cell">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {order.id}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {order.customer}
                      </div>
                      <div className="text-xs text-gray-400">{order.email}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 hidden sm:table-cell">
                      {order.product}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {order.amount}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${
                          statusStyles[order.status]
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
