"use client";

import { useState, useMemo, useRef } from "react";
import { PageHeader } from "@/components/page-header";
import {
  TrendingUp, Plus, Pencil, Trash2, X, AlertTriangle,
  ChevronLeft, ChevronRight, ArrowUpRight, ArrowDownRight,
} from "lucide-react";

let nextId = 1;
function genId() { return String(nextId++); }

interface TradeRecord {
  id: string;
  type: "买入" | "卖出";
  date: string;
  price: number;
  quantity: number;
  note?: string;
}

interface Position {
  id: string;
  name: string;
  type: "股票" | "期货";
  quantity: number;
  currentPrice: number;
  costPrice: number;
  trades: TradeRecord[];
}

interface ValueSnapshot {
  date: string;
  totalValue: number;
}

function formatCNY(amount: number) {
  const prefix = amount < 0 ? "- " : "";
  return `${prefix}¥ ${Math.abs(amount).toLocaleString("zh-CN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function LeftPanel({
  positions, selectedId, onSelect, onAdd,
}: {
  positions: Position[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAdd: () => void;
}) {
  return (
    <div className="w-[320px] shrink-0 rounded-xl border border-gray-200 bg-white shadow-sm flex flex-col">
      <div className="px-4 py-3 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-900">持仓列表</h3>
      </div>
      <div className="flex-1 overflow-y-auto">
        {positions.length === 0 ? (
          <p className="px-4 py-6 text-sm text-gray-400 text-center">暂无持仓</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {positions.map((p) => {
              const mv = p.currentPrice * p.quantity;
              const isSelected = p.id === selectedId;
              return (
                <button
                  key={p.id}
                  onClick={() => onSelect(p.id)}
                  className={`w-full flex items-center justify-between px-4 py-3 text-left transition-colors hover:bg-slate-50 ${
                    isSelected ? "bg-slate-100" : ""
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-sm font-medium text-gray-900 truncate">{p.name}</span>
                    <span className={`shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${
                      p.type === "股票"
                        ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20"
                        : "bg-blue-50 text-blue-700 ring-blue-600/20"
                    }`}>
                      {p.type}
                    </span>
                  </div>
                  <span className="text-sm text-gray-700 tabular-nums ml-3">{formatCNY(mv)}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
      <div className="px-4 py-3 border-t border-gray-100">
        <button
          onClick={onAdd}
          className="flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-500 transition-colors"
        >
          <Plus className="h-4 w-4" />
          新增品种
        </button>
      </div>
    </div>
  );
}

export default function PortfolioPage() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [snapshots, setSnapshots] = useState<ValueSnapshot[]>([]);

  const selectedPosition = useMemo(
    () => positions.find((p) => p.id === selectedId) ?? null,
    [positions, selectedId]
  );

  const totalMarketValue = useMemo(
    () => positions.reduce((s, p) => s + p.currentPrice * p.quantity, 0),
    [positions]
  );

  return (
    <div className="space-y-6 anim-in anim-fade anim-up" style={{ animationDuration: "500ms" }}>
      <PageHeader title="投资组合" description="股票与期货持仓监控" />

      {/* Trend chart area — placeholder for Task 4 */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-1">总市值趋势</h3>
        <p className="text-xs text-gray-500">暂无足够数据绘制趋势图</p>
      </div>

      {/* Two-column layout */}
      <div className="flex gap-6">
        {/* Left panel */}
        <LeftPanel
          positions={positions}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onAdd={() => {}}
        />

        {/* Right panel */}
        <div className="flex-1 rounded-xl border border-gray-200 bg-white shadow-sm p-6">
          {selectedPosition ? (
            <p className="text-sm text-gray-500">{selectedPosition.name} — 详情区（待实现）</p>
          ) : (
            <p className="text-sm text-gray-500">请从左侧选择一个品种</p>
          )}
        </div>
      </div>
    </div>
  );
}
