"use client";

import { useState, useMemo } from "react";
import { PageHeader } from "@/components/page-header";
import {
  Wallet, Landmark, TrendingUp, Plus, Pencil, Trash2, X, AlertTriangle,
} from "lucide-react";

interface BalanceItem {
  name: string;
  amount: number;
}

interface BalanceGroup {
  category: string;
  items: BalanceItem[];
}

function formatCNY(amount: number) {
  return `¥ ${Math.abs(amount).toLocaleString("zh-CN")}.00`;
}

function createDefaultData(): BalanceGroup[] {
  return [
    {
      category: "流动资产",
      items: [
        { name: "现金及银行存款", amount: 285000 },
        { name: "应收账款", amount: 128000 },
        { name: "存货", amount: 96000 },
        { name: "短期投资", amount: 50000 },
      ],
    },
    {
      category: "固定资产",
      items: [
        { name: "房屋及建筑物", amount: 320000 },
        { name: "机器设备", amount: 100000 },
        { name: "长期投资", amount: 180000 },
        { name: "无形资产", amount: 62500 },
        { name: "长期待摊费用", amount: 65000 },
      ],
    },
    {
      category: "流动负债",
      items: [
        { name: "应付账款", amount: 156000 },
        { name: "短期借款", amount: 100000 },
        { name: "应付职工薪酬", amount: 38400 },
      ],
    },
    {
      category: "非流动负债",
      items: [
        { name: "长期借款", amount: 180000 },
        { name: "应付债券", amount: 49000 },
      ],
    },
    {
      category: "净资产",
      items: [
        { name: "实收资本", amount: 500000 },
        { name: "资本公积", amount: 120000 },
        { name: "未分配利润", amount: 143100 },
      ],
    },
  ];
}

type ModalState =
  | { type: "add"; group: number }
  | { type: "edit"; group: number; item: number }
  | { type: "delete"; group: number; item: number }
  | null;

export default function BalanceSheetPage() {
  const [data, setData] = useState<BalanceGroup[]>(createDefaultData);
  const [modal, setModal] = useState<ModalState>(null);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");

  const totalAssets = useMemo(
    () => data.slice(0, 2).flatMap((g) => g.items).reduce((s, i) => s + i.amount, 0),
    [data],
  );
  const totalLiabilities = useMemo(
    () => data.slice(2, 4).flatMap((g) => g.items).reduce((s, i) => s + i.amount, 0),
    [data],
  );
  const totalEquity = useMemo(
    () => data.slice(4).flatMap((g) => g.items).reduce((s, i) => s + i.amount, 0),
    [data],
  );

  function openAdd(group: number) {
    setName("");
    setAmount("");
    setModal({ type: "add", group });
  }

  function openEdit(group: number, item: number) {
    setName(data[group].items[item].name);
    setAmount(String(data[group].items[item].amount));
    setModal({ type: "edit", group, item });
  }

  function handleSave() {
    if (!modal) return;
    const n = name.trim();
    const a = Number(amount);
    if (!n || isNaN(a) || a <= 0) return;

    setData((prev) => {
      const next = prev.map((g) => ({ ...g, items: [...g.items] }));
      if (modal.type === "add") {
        next[modal.group].items.push({ name: n, amount: a });
      } else {
        next[modal.group].items[modal.item] = { name: n, amount: a };
      }
      return next;
    });
    setModal(null);
  }

  function handleDelete() {
    if (!modal || modal.type !== "delete") return;
    setData((prev) => {
      const next = prev.map((g) => ({ ...g, items: [...g.items] }));
      next[modal.group].items.splice(modal.item, 1);
      return next;
    });
    setModal(null);
  }

  const labelStyle = (gi: number) => {
    if (gi <= 1) return "text-blue-700";
    if (gi <= 3) return "text-orange-700";
    return "text-emerald-700";
  };

  return (
    <div className="space-y-6">
      <PageHeader title="资产负债表" description="个人资产负债总览" />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "总资产", value: formatCNY(totalAssets), color: "text-blue-700", iconBg: "bg-blue-100", iconColor: "text-blue-600", icon: Wallet },
          { label: "总负债", value: formatCNY(totalLiabilities), color: "text-orange-700", iconBg: "bg-orange-100", iconColor: "text-orange-600", icon: Landmark },
          { label: "净资产", value: formatCNY(totalEquity), color: "text-emerald-700", iconBg: "bg-emerald-100", iconColor: "text-emerald-600", icon: TrendingUp },
        ].map((card) => (
          <div key={card.label} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className={`rounded-lg ${card.iconBg} p-2 w-fit mb-3`}>
              <card.icon className={`h-5 w-5 ${card.iconColor}`} />
            </div>
            <p className={`text-2xl font-bold ${card.color} tabular-nums`}>{card.value}</p>
            <p className="mt-1 text-sm text-gray-500">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        {data.map((group, gi) => {
          const isAsset = gi <= 1;
          const isLiability = gi >= 2 && gi <= 3;
          const isEquity = gi === 4;
          const showSubtotal = isAsset || isLiability || isEquity;

          return (
            <div key={group.category}>
              {gi > 0 && <div className="h-px bg-gray-100" />}
              <div className="px-4 py-2.5 flex items-center justify-between bg-gray-50/50">
                <span className="text-sm font-bold text-gray-800">{group.category}</span>
                <button
                  type="button"
                  onClick={() => openAdd(gi)}
                  className="rounded p-1 text-gray-400 hover:text-slate-600 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="divide-y divide-gray-50">
                {group.items.length === 0 && (
                  <p className="px-4 py-3 text-sm text-gray-400">暂无数据</p>
                )}
                {group.items.map((item, ii) => (
                  <div
                    key={`${gi}-${ii}`}
                    className="group flex items-center justify-between px-4 py-2 hover:bg-gray-50/50 transition-colors"
                  >
                    <span className="text-sm text-gray-700">{item.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900 tabular-nums">{formatCNY(item.amount)}</span>
                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={() => openEdit(gi, ii)}
                          className="rounded p-0.5 text-gray-300 hover:text-slate-500 transition-colors"
                        >
                          <Pencil className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setModal({ type: "delete", group: gi, item: ii })}
                          className="rounded p-0.5 text-gray-300 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {showSubtotal && (
                <div className={`px-4 py-2 flex items-center justify-between border-t ${isAsset ? "border-blue-200 bg-blue-50/50" : isLiability ? "border-orange-200 bg-orange-50/50" : "border-emerald-200 bg-emerald-50/50"}`}>
                  <span className={`text-xs font-semibold ${labelStyle(gi)}`}>
                    {isAsset ? "资产合计" : isLiability ? "负债合计" : "净资产合计"}
                  </span>
                  <span className={`text-xs font-semibold ${labelStyle(gi)} tabular-nums`}>
                    {formatCNY(isAsset ? totalAssets : isLiability ? totalLiabilities : totalEquity)}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add/Edit Modal */}
      {(modal?.type === "add" || modal?.type === "edit") && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/10 backdrop-blur-sm p-4" onClick={() => setModal(null)}>
          <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-base font-semibold text-gray-900">
                {modal.type === "add" ? "添加项目" : "编辑项目"}
              </h3>
              <button type="button" onClick={() => setModal(null)} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">项目名称</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="请输入项目名称" autoFocus
                  className="block w-full rounded-lg border border-gray-200 bg-white py-2.5 px-3.5 text-sm text-gray-900 placeholder-gray-400 shadow-xs focus:border-slate-400 focus:ring-2 focus:ring-slate-200/60 focus:outline-none transition-all" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">金额（元）</label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-sm text-gray-400">¥</span>
                  <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" min="0" step="0.01"
                    className="block w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-8 pr-3.5 text-sm text-gray-900 placeholder-gray-400 shadow-xs focus:border-slate-400 focus:ring-2 focus:ring-slate-200/60 focus:outline-none transition-all" />
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 pt-2">
                <button type="button" onClick={() => setModal(null)} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">取消</button>
                <button type="submit" className="rounded-lg bg-gradient-to-r from-slate-600 to-slate-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:from-slate-700 hover:to-slate-800 transition-all">保存</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {modal?.type === "delete" && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/10 backdrop-blur-sm p-4" onClick={() => setModal(null)}>
          <div className="w-full max-w-sm rounded-xl border border-gray-200 bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 mx-auto">
                <AlertTriangle className="h-6 w-6 text-red-500" />
              </div>
              <h3 className="mt-4 text-center text-base font-semibold text-gray-900">确认删除</h3>
              <p className="mt-2 text-center text-sm text-gray-500">
                确定要删除「{data[modal.group]?.items[modal.item]?.name}」吗？
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 pb-6">
              <button type="button" onClick={() => setModal(null)} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">取消</button>
              <button type="button" onClick={handleDelete} className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-600 transition-all">删除</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
