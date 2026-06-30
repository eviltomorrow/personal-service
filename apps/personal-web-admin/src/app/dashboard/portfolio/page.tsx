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

function recalcCostPrice(trades: TradeRecord[]): number {
  let totalQty = 0;
  let totalCost = 0;
  for (const t of trades) {
    if (t.type === "买入") {
      totalQty += t.quantity;
      totalCost += t.price * t.quantity;
    } else {
      totalQty -= t.quantity;
    }
    if (totalQty < 0) totalQty = 0;
  }
  if (totalQty <= 0) return 0;
  return totalCost / totalQty;
}

function calcDerived(p: Position) {
  const marketValue = p.currentPrice * p.quantity;
  const profitAmount = p.quantity > 0 ? (p.currentPrice - p.costPrice) * p.quantity : 0;
  const profitPct = p.costPrice > 0 && p.quantity > 0
    ? ((p.currentPrice - p.costPrice) / p.costPrice) * 100
    : 0;
  return { marketValue, profitAmount, profitPct };
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

function RightPanel({
  position, onUpdatePosition, onAddTrade, onEditTrade, onDeleteTrade,
  onEditPosition, onDeletePosition,
}: {
  position: Position;
  onUpdatePosition: (id: string, updates: Partial<Position>) => void;
  onAddTrade: (positionId: string) => void;
  onEditTrade: (positionId: string, trade: TradeRecord) => void;
  onDeleteTrade: (positionId: string, tradeId: string) => void;
  onEditPosition: (id: string) => void;
  onDeletePosition: (id: string) => void;
}) {
  const { marketValue, profitAmount, profitPct } = useMemo(
    () => calcDerived(position),
    [position]
  );
  const [editingPrice, setEditingPrice] = useState(false);
  const [priceDraft, setPriceDraft] = useState(String(position.currentPrice));

  const sortedTrades = useMemo(
    () => [...position.trades].sort((a, b) => b.date.localeCompare(a.date)),
    [position.trades]
  );

  const profitColor = profitAmount >= 0 ? "text-emerald-600" : "text-red-600";
  const profitSign = profitAmount >= 0 ? "+" : "";

  return (
    <div className="flex-1 rounded-xl border border-gray-200 bg-white shadow-sm p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-semibold text-gray-900">{position.name}</h3>
          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${
            position.type === "股票"
              ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20"
              : "bg-blue-50 text-blue-700 ring-blue-600/20"
          }`}>
            {position.type}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onEditPosition(position.id)}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDeletePosition(position.id)}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Detail fields */}
      <div className="grid grid-cols-2 gap-x-8 gap-y-3 mb-6">
        <div>
          <span className="text-xs text-gray-500">持仓量</span>
          <p className="text-sm font-medium text-gray-900 tabular-nums">
            {position.quantity} {position.type === "股票" ? "股" : "手"}
          </p>
        </div>
        <div>
          <span className="text-xs text-gray-500">成本均价</span>
          <p className="text-sm font-medium text-gray-900 tabular-nums">{formatCNY(position.costPrice)}</p>
        </div>
        <div>
          <span className="text-xs text-gray-500">现价</span>
          {editingPrice ? (
            <div className="flex items-center gap-1 mt-0.5">
              <span className="text-sm text-gray-400">¥</span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={priceDraft}
                onChange={(e) => setPriceDraft(e.target.value)}
                className="w-24 rounded-md border border-gray-300 px-2 py-0.5 text-sm text-gray-900 tabular-nums focus:border-slate-400 focus:ring-2 focus:ring-slate-200/60 focus:outline-none"
                autoFocus
              />
              <button
                onClick={() => {
                  const v = parseFloat(priceDraft);
                  if (!isNaN(v) && v > 0) {
                    onUpdatePosition(position.id, { currentPrice: v });
                  }
                  setEditingPrice(false);
                }}
                className="text-xs font-medium text-slate-600 hover:text-slate-500"
              >
                确认
              </button>
              <button
                onClick={() => { setEditingPrice(false); setPriceDraft(String(position.currentPrice)); }}
                className="text-xs text-gray-400 hover:text-gray-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-medium text-gray-900 tabular-nums">{formatCNY(position.currentPrice)}</p>
              <button
                onClick={() => { setEditingPrice(true); setPriceDraft(String(position.currentPrice)); }}
                className="text-gray-300 hover:text-gray-500 transition-colors"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
        <div>
          <span className="text-xs text-gray-500">当前市值</span>
          <p className="text-sm font-semibold text-gray-900 tabular-nums">{formatCNY(marketValue)}</p>
        </div>
        <div className="col-span-2">
          <span className="text-xs text-gray-500">盈亏</span>
          <p className={`text-sm font-semibold tabular-nums ${profitColor}`}>
            {profitSign}{formatCNY(Math.abs(profitAmount))} ({profitSign}{profitPct.toFixed(2)}%)
          </p>
        </div>
      </div>

      {/* Trade records */}
      <div className="border-t border-gray-100 pt-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-gray-900">买卖记录</h4>
          <button
            onClick={() => onAddTrade(position.id)}
            className="flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-slate-500 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            新增记录
          </button>
        </div>
        {sortedTrades.length === 0 ? (
          <p className="text-sm text-gray-400">暂无记录</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {sortedTrades.map((t) => (
              <div key={t.id} className="flex items-center justify-between py-2.5">
                <div className="flex items-center gap-3 min-w-0">
                  <span className={`shrink-0 text-xs font-medium px-1.5 py-0.5 rounded ${
                    t.type === "买入" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                  }`}>
                    {t.type}
                  </span>
                  <span className="text-sm text-gray-500 tabular-nums">{t.date}</span>
                  <span className="text-sm text-gray-900 tabular-nums">
                    {t.price.toFixed(2)} × {t.quantity}
                  </span>
                  {t.note && <span className="text-xs text-gray-400 truncate">{t.note}</span>}
                </div>
                <div className="flex items-center gap-0.5 shrink-0">
                  <button
                    onClick={() => onEditTrade(position.id, t)}
                    className="rounded p-1 text-gray-300 hover:text-gray-500 transition-colors"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => onDeleteTrade(position.id, t.id)}
                    className="rounded p-1 text-gray-300 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
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

  type ModalType =
    | { type: "addPosition" }
    | { type: "editPosition"; positionId: string }
    | { type: "addTrade"; positionId: string }
    | { type: "editTrade"; positionId: string; trade: TradeRecord }
    | { type: "deletePosition"; positionId: string }
    | { type: "deleteTrade"; positionId: string; tradeId: string }
    | null;

  const [modal, setModal] = useState<ModalType>(null);

  function handleUpdatePosition(id: string, updates: Partial<Position>) {
    const updatedPositions = positions.map((p) =>
      p.id === id ? { ...p, ...updates } : p
    );
    setPositions(updatedPositions);
    if ("currentPrice" in updates) {
      const today = new Date().toISOString().slice(0, 10);
      const newTotal = updatedPositions.reduce((s, p) => s + p.currentPrice * p.quantity, 0);
      setSnapshots((prev) => {
        const existing = prev.findIndex((s) => s.date === today);
        if (existing >= 0) {
          const next = [...prev];
          next[existing] = { ...next[existing], totalValue: newTotal };
          return next;
        }
        return [...prev, { date: today, totalValue: newTotal }];
      });
    }
  }

  function handleDeleteTrade(positionId: string, tradeId: string) {
    setPositions((prev) =>
      prev.map((p) =>
        p.id === positionId
          ? { ...p, trades: p.trades.filter((t) => t.id !== tradeId), costPrice: recalcCostPrice(p.trades.filter((t) => t.id !== tradeId)) }
          : p
      )
    );
  }

  function handleDeletePosition(id: string) {
    setPositions((prev) => prev.filter((p) => p.id !== id));
    setSnapshots([]);
    if (selectedId === id) setSelectedId(null);
  }

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
        {selectedPosition ? (
          <RightPanel
            position={selectedPosition}
            onUpdatePosition={handleUpdatePosition}
            onAddTrade={(posId) => setModal({ type: "addTrade", positionId: posId })}
            onEditTrade={(posId, trade) => setModal({ type: "editTrade", positionId: posId, trade })}
            onDeleteTrade={handleDeleteTrade}
            onEditPosition={(id) => setModal({ type: "editPosition", positionId: id })}
            onDeletePosition={handleDeletePosition}
          />
        ) : (
          <div className="flex-1 rounded-xl border border-gray-200 bg-white shadow-sm p-6 flex items-center justify-center">
            <p className="text-sm text-gray-400">请从左侧选择一个品种</p>
          </div>
        )}
      </div>
    </div>
  );
}
