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
  },
  {
    label: "Active Users",
    value: "2,847",
    change: "+8.2%",
    trend: "up",
    icon: Users,
  },
  {
    label: "Orders",
    value: "1,423",
    change: "-3.1%",
    trend: "down",
    icon: ShoppingCart,
  },
  {
    label: "Conversion Rate",
    value: "3.24%",
    change: "+1.8%",
    trend: "up",
    icon: Activity,
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
  Processing: "bg-indigo-50 text-indigo-700 ring-indigo-600/20",
};

export default function DashboardPage() {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-semibold text-white">Dashboard</h1>
        <p className="mt-1 text-sm text-white/50">
          Welcome back, John. Here&apos;s what&apos;s happening today.
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-6 hover:bg-white/10 transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="rounded-lg bg-white/10 p-2.5">
                <stat.icon className="h-5 w-5 text-white/70" />
              </div>
              <span
                className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-medium ${
                  stat.trend === "up"
                    ? "bg-emerald-500/10 text-emerald-400"
                    : "bg-red-500/10 text-red-400"
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
            <p className="mt-4 text-2xl font-semibold text-white">
              {stat.value}
            </p>
            <p className="mt-1 text-sm text-white/50">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Chart */}
        <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-semibold text-white">
                Revenue Overview
              </h3>
              <p className="text-sm text-white/50">Monthly revenue for 2026</p>
            </div>
            <button className="rounded-lg p-1.5 text-white/40 hover:bg-white/10 hover:text-white/70 transition-colors">
              <MoreHorizontal className="h-5 w-5" />
            </button>
          </div>
          <div className="h-64 flex items-end justify-between gap-2">
            {[
              { label: "Jan", value: 45 },
              { label: "Feb", value: 52 },
              { label: "Mar", value: 48 },
              { label: "Apr", value: 70 },
              { label: "May", value: 55 },
              { label: "Jun", value: 82 },
              { label: "Jul", value: 65 },
              { label: "Aug", value: 58 },
              { label: "Sep", value: 75 },
              { label: "Oct", value: 68 },
              { label: "Nov", value: 88 },
              { label: "Dec", value: 95 },
            ].map((bar) => (
              <div key={bar.label} className="flex flex-col items-center gap-2 flex-1">
                <div className="w-full bg-white/5 rounded-full relative" style={{ height: "200px" }}>
                  <div
                    className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-indigo-500 to-indigo-400/60 rounded-full transition-all duration-500"
                    style={{ height: `${bar.value}%` }}
                  />
                </div>
                <span className="text-xs text-white/30">{bar.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent orders */}
        <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm">
          <div className="flex items-center justify-between p-6 pb-4">
            <div>
              <h3 className="text-base font-semibold text-white">
                Recent Orders
              </h3>
              <p className="text-sm text-white/50">
                Latest transactions this month
              </p>
            </div>
            <button className="text-sm font-medium text-indigo-400 hover:text-indigo-300 transition-colors">
              View all
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-t border-white/10">
                  <th className="px-6 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">
                    Order
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider hidden sm:table-cell">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-white/80">
                      {order.id}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-white/80">
                        {order.customer}
                      </div>
                      <div className="text-xs text-white/40">{order.email}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-white/60 hidden sm:table-cell">
                      {order.product}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-white/80">
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
