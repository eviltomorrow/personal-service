"use client";

import { useState, useMemo, useEffect } from "react";
import { PageHeader } from "@/components/page-header";
import { formatCNY } from "@/lib/format";
import { api } from "@/lib/api";
import {
  Plus, Pencil, Trash2, X, AlertTriangle,
  DollarSign, TrendingUp, Percent, ArrowUpDown, GripVertical,
} from "lucide-react";
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext, verticalListSortingStrategy, useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const TRADE_TYPE_MAP: Record<string, number> = { "建仓": 1, "买入": 2, "卖出": 3, "清仓": 4 };
const TRADE_TYPE_REV: Record<number, string> = { 1: "建仓", 2: "买入", 3: "卖出", 4: "清仓" };

function posToAPI(p: Position, extra?: Record<string, unknown>) {
  return {
    code: p.code,
    name: p.name,
    type: p.type === "股票" ? 1 : 2,
    direction: p.direction,
    initial_qty: p.initialQty,
    current_price: Math.round(p.currentPrice * 100),
    margin_ratio: Math.round((p.marginRatio ?? 0) * 10000),
    sort_order: p.sortOrder ?? 0,
    ...extra,
  };
}

function tradeToAPI(t: { type: string; date: string; price: number; quantity: number; fee?: number; note?: string }) {
  return {
    type: TRADE_TYPE_MAP[t.type] ?? 2,
    date: t.date,
    price: Math.round(t.price * 100),
    quantity: t.quantity,
    fee: Math.round((t.fee ?? 0) * 100),
    note: t.note ?? "",
  };
}

function posFromAPI(p: any): Position {
  return {
    id: String(p.id),
    code: p.code,
    name: p.name,
    type: p.type === 1 ? "股票" as const : "期货" as const,
    direction: p.direction as "做多" | "做空",
    initialQty: p.initial_qty,
    quantity: 0,
    currentPrice: p.current_price / 100,
    costPrice: 0,
    marginRatio: p.margin_ratio / 10000,
    trades: [],
    archived: p.archived,
    closedPnl: p.closed_pnl / 100,
    sortOrder: p.sort_order ?? 0,
  };
}

function tradeFromAPI(t: any): TradeRecord {
  return {
    id: String(t.id),
    type: (TRADE_TYPE_REV[t.type] ?? "买入") as TradeRecord["type"],
    date: (t.date || "").slice(0, 10),
    price: t.price / 100,
    quantity: t.quantity,
    fee: (t.fee ?? 0) / 100,
    note: t.note || undefined,
  };
}

interface TradeRecord {
  id: string;
  type: "建仓" | "买入" | "卖出" | "清仓";
  date: string;
  price: number;
  quantity: number;
  fee: number;
  note?: string;
}

interface Position {
  id: string;
  code: string;
  name: string;
  type: "股票" | "期货";
  direction: "做多" | "做空";
  initialQty: number;
  quantity: number;
  currentPrice: number;
  costPrice: number;
  marginRatio?: number;
  trades: TradeRecord[];
  archived: boolean;
  closedPnl?: number;
  sortOrder: number;
}

interface ValueSnapshot {
  date: string;
  totalValue: number;
}

function calcTradeTotalCost(trades: TradeRecord[], direction: "做多" | "做空"): number {
  return trades.reduce((cost, t) => {
    const q = t.price * t.quantity;
    const f = t.fee ?? 0;
    if (direction === "做空") {
      if (t.type === "建仓" || t.type === "卖出") return cost - q + f;
      return cost + q + f;
    }
    if (t.type === "买入" || t.type === "建仓") return cost + q + f;
    return cost - q + f;
  }, 0);
}

function recalcCostPrice(trades: TradeRecord[], direction: "做多" | "做空"): number {
  const totalCost = calcTradeTotalCost(trades, direction);
  const totalQty = calcQuantity(trades, 0, direction);
  if (totalQty <= 0) return 0;
  return Math.abs(totalCost / totalQty);
}

function calcQuantity(trades: TradeRecord[], initialQty: number, direction: "做多" | "做空"): number {
  return Math.max(0, trades.reduce((qty, t) => {
    if (direction === "做空") {
      if (t.type === "建仓" || t.type === "卖出") return qty + t.quantity;
      return Math.max(0, qty - t.quantity);
    }
    return t.type === "买入" || t.type === "建仓" ? qty + t.quantity : Math.max(0, qty - t.quantity);
  }, Math.max(0, initialQty)));
}

function calcDerived(p: Position) {
  const marketValue = p.currentPrice * p.quantity;
  const priceDiff = p.direction === "做多"
    ? p.currentPrice - p.costPrice
    : p.costPrice - p.currentPrice;
  const profitAmount = p.quantity > 0 ? priceDiff * p.quantity : 0;
  const profitPct = p.costPrice > 0 && p.quantity > 0
    ? (priceDiff / p.costPrice) * 100
    : 0;
  const marginUsed = p.marginRatio ? marketValue * p.marginRatio : marketValue;
  const leverage = p.marginRatio ? (1 / p.marginRatio).toFixed(1) + "x" : "-";
  return { marketValue, profitAmount, profitPct, marginUsed, leverage };
}

function StatCards({ positions, totalCapital, realizedPnl, totalFees, onCapitalChange }: {
  positions: Position[];
  totalCapital: number;
  realizedPnl: number;
  totalFees: number;
  onCapitalChange: (v: number) => void;
}) {
  const [editingCapital, setEditingCapital] = useState(false);
  const [capitalDraft, setCapitalDraft] = useState("");

  const totalValue = positions.reduce((s, p) => s + p.currentPrice * p.quantity, 0);
  const fundsUsed = positions.reduce((s, p) => {
    if (p.type === "期货") {
      const marketValue = p.currentPrice * p.quantity;
      return s + (p.marginRatio ? marketValue * p.marginRatio : marketValue);
    }
    return s + calcTradeTotalCost(p.trades, p.direction);
  }, 0);
  const availableFunds = totalCapital - fundsUsed + realizedPnl - totalFees;
  const totalProfit = positions.reduce((s, p) => {
    const d = calcDerived(p);
    return s + d.profitAmount;
  }, 0);
  const totalProfitPct = totalCapital > 0 ? (totalProfit / totalCapital) * 100 : 0;

  const profitColor = totalProfit >= 0 ? "emerald" : "red";
  const profitSign = totalProfit > 0 ? "+" : totalProfit < 0 ? "-" : "";

  const cards = [
    { icon: DollarSign, label: "总本金", value: formatCNY(totalCapital), bar: "slate", editable: true },
    { icon: DollarSign, label: "总手续费", value: formatCNY(totalFees), bar: "slate" },
    { icon: DollarSign, label: "可用资金", value: formatCNY(availableFunds), bar: "blue" },
    { icon: TrendingUp, label: "总市值", value: formatCNY(totalValue), bar: "emerald" },
    { icon: TrendingUp, label: "总盈亏", value: `${profitSign}${formatCNY(Math.abs(totalProfit))}`, bar: profitColor, text: profitColor },
    { icon: Percent, label: "总收益率", value: `${profitSign}${totalProfitPct.toFixed(2)}%`, bar: "amber", text: profitColor },
  ];

  function bar(color: string) {
    const colors: Record<string, string> = {
      slate: "bg-slate-500", blue: "bg-blue-500", emerald: "bg-emerald-500",
      red: "bg-red-500", amber: "bg-amber-500", purple: "bg-purple-500",
    };
    return colors[color] || "bg-slate-500";
  }

  function iconBg(color: string) {
    const colors: Record<string, string> = {
      slate: "bg-slate-100 text-slate-600", blue: "bg-blue-100 text-blue-600",
      emerald: "bg-emerald-100 text-emerald-600", red: "bg-red-100 text-red-600",
      amber: "bg-amber-100 text-amber-600", purple: "bg-purple-100 text-purple-600",
    };
    return colors[color] || "bg-slate-100 text-slate-600";
  }

  function textCls(color: string) {
    const colors: Record<string, string> = {
      slate: "text-slate-700", blue: "text-blue-700", emerald: "text-emerald-700",
      red: "text-red-700", amber: "text-amber-700", purple: "text-purple-700",
    };
    return colors[color] || "text-gray-900";
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {cards.map((card) => (
        <div key={card.label} className={`rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden ${card.editable ? "relative" : ""}`}>
          <div className={`h-1 ${bar(card.bar)}`} />
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className={`rounded-lg ${iconBg(card.bar)} p-2`}>
                <card.icon className="h-5 w-5" />
              </div>
              {card.editable && !editingCapital && (
                <button onClick={() => { setCapitalDraft(String(totalCapital)); setEditingCapital(true); }}
                  className="rounded p-1 text-gray-300 hover:text-gray-500 transition-colors">
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <p className={`text-lg font-bold tabular-nums ${card.text ? textCls(card.text) : textCls(card.bar)}`}>
              {card.value}
            </p>
            <p className="mt-0.5 text-sm text-gray-500">{card.label}</p>
          </div>
        </div>
      ))}
      {editingCapital && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="rounded-xl border border-gray-200 bg-white shadow-xl p-5 w-80" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">修改总本金</h3>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-sm text-gray-400">¥</span>
              <input type="number" step="0.01" value={capitalDraft} autoFocus
                onChange={(e) => setCapitalDraft(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { onCapitalChange(parseFloat(capitalDraft) || 0); setEditingCapital(false); } }}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-slate-400 focus:ring-2 focus:ring-slate-200/60 focus:outline-none" />
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setEditingCapital(false)}
                className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors">取消</button>
              <button onClick={() => { onCapitalChange(parseFloat(capitalDraft) || 0); setEditingCapital(false); }}
                className="rounded-lg px-4 py-2 text-sm font-medium text-white bg-slate-600 hover:bg-slate-500 transition-colors">确认</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SortablePositionItem({
  position, isSelected, onSelect,
}: {
  position: Position;
  isSelected: boolean;
  onSelect: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: position.id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    position: "relative",
    zIndex: isDragging ? 10 : undefined,
  };
  const d = calcDerived(position);
  const profitSign = d.profitAmount >= 0 ? "+" : "";
  const profitColor = d.profitAmount >= 0 ? "text-emerald-600" : "text-red-600";
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center w-full text-left transition-colors ${
        isDragging ? "shadow-lg rounded-lg border border-gray-200 bg-white" : ""
      } ${isSelected ? "bg-slate-100" : "hover:bg-slate-50"}`}
    >
      <button
        {...attributes}
        {...listeners}
        className="px-1.5 py-3 text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing shrink-0 transition-colors"
        tabIndex={-1}
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <button
        onClick={() => onSelect(position.id)}
        className="flex-1 text-left px-1.5 py-3 min-w-0"
      >
        <div className="flex items-center gap-1.5 min-w-0 mb-1">
          <span className="text-sm font-medium text-gray-900 truncate">
            {position.code} {position.name}
          </span>
          <span className={`shrink-0 inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium ring-1 ring-inset ${
            position.type === "股票"
              ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20"
              : "bg-blue-50 text-blue-700 ring-blue-600/20"
          }`}>
            {position.type}
          </span>
          {position.type === "期货" && position.marginRatio && (
            <span className="shrink-0 inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium ring-1 ring-inset bg-purple-50 text-purple-700 ring-purple-600/20">
              {(position.marginRatio * 100).toFixed(1)}%
            </span>
          )}
          <span className={`shrink-0 inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium ring-1 ring-inset ${
            position.direction === "做多"
              ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20"
              : "bg-orange-50 text-orange-700 ring-orange-600/20"
          }`}>
            {position.direction === "做多" ? "多" : "空"}
          </span>
          {position.archived && (
            <span className="shrink-0 inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium ring-1 ring-inset bg-gray-100 text-gray-500 ring-gray-500/20">
              归档
            </span>
          )}
        </div>
        {position.archived ? (
          <div className="flex items-center justify-between pl-0.5">
            <span className="text-xs text-gray-500 tabular-nums">盈亏</span>
            <span className={`text-xs tabular-nums ${profitColor}`}>
              {profitSign}{formatCNY(Math.abs(d.profitAmount))} ({profitSign}{d.profitPct.toFixed(2)}%)
            </span>
          </div>
        ) : (
          <div className="flex items-center justify-between pl-0.5">
            <span className="text-xs text-gray-500 tabular-nums">市值 {formatCNY(d.marketValue)}</span>
            <span className={`text-xs tabular-nums ${profitColor}`}>
              {profitSign}{formatCNY(Math.abs(d.profitAmount))} ({profitSign}{d.profitPct.toFixed(2)}%)
            </span>
          </div>
        )}
      </button>
    </div>
  );
}

function LeftPanel({
  activePositions, archivedPositions, selectedId, onSelect, onAdd,
}: {
  activePositions: Position[];
  archivedPositions: Position[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAdd: () => void;
}) {
  return (
    <div className="w-[320px] shrink-0 self-start rounded-xl border border-gray-200 bg-white shadow-sm flex flex-col overflow-hidden">
      {/* Active positions section */}
      <div className="px-4 py-3 flex items-center gap-3 bg-slate-50/80 border-b border-gray-100">
        <div className="w-1 h-4 rounded-full bg-slate-500" />
        <span className="text-sm font-semibold text-gray-800">📋 持仓列表 ({activePositions.length})</span>
        <button onClick={onAdd}
          className="ml-auto flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-slate-500 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          新增品种
        </button>
      </div>
      <div className="overflow-y-auto custom-scrollbar max-h-[300px]">
        <SortableContext items={activePositions.map((p) => p.id)} strategy={verticalListSortingStrategy}>
          {activePositions.length === 0 ? (
            <p className="px-4 py-6 text-sm text-gray-400 text-center">暂无持仓</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {activePositions.map((p) => (
                <SortablePositionItem key={p.id} position={p} isSelected={p.id === selectedId} onSelect={onSelect} />
              ))}
            </div>
          )}
        </SortableContext>
      </div>

      {/* Long/short ratio */}
      <div className="px-4 py-2 flex items-center gap-2 border-t border-gray-100 bg-white">
        <ArrowUpDown className="h-3.5 w-3.5 text-gray-400" />
        <span className="text-xs text-gray-500">多空比</span>
        <span className="text-xs font-semibold text-gray-700 ml-auto tabular-nums">
          {activePositions.filter(p => p.direction === "做多").length} : {activePositions.filter(p => p.direction === "做空").length}
        </span>
      </div>

      {/* Archived positions section */}
      <div className="px-4 py-3 flex items-center gap-3 bg-slate-50/80 border-t border-gray-100">
        <div className="w-1 h-4 rounded-full bg-slate-400" />
        <span className="text-sm font-semibold text-gray-800">🗄️ 归档列表 ({archivedPositions.length})</span>
      </div>
      <div className="overflow-y-auto custom-scrollbar max-h-[300px]">
        <SortableContext items={archivedPositions.map((p) => p.id)} strategy={verticalListSortingStrategy}>
          {archivedPositions.length === 0 ? (
            <p className="px-4 py-6 text-sm text-gray-400 text-center">暂无归档</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {archivedPositions.map((p) => (
                <SortablePositionItem key={p.id} position={p} isSelected={p.id === selectedId} onSelect={onSelect} />
              ))}
            </div>
          )}
        </SortableContext>
      </div>
    </div>
  );
}

function RightPanel({
  position, totalValue, onUpdatePosition, onAddTrade, onEditTrade, onDeleteTrade,
  onEditPosition, onDeletePosition,
}: {
  position: Position;
  totalValue: number;
  onUpdatePosition: (id: string, updates: Partial<Position>) => void;
  onAddTrade: (positionId: string) => void;
  onEditTrade: (positionId: string, trade: TradeRecord) => void;
  onDeleteTrade: (positionId: string, tradeId: string) => void;
  onEditPosition: (id: string) => void;
  onDeletePosition: (id: string) => void;
}) {
  const { marketValue, profitAmount, profitPct, marginUsed, leverage } = useMemo(
    () => calcDerived(position),
    [position]
  );
  const totalCost = calcTradeTotalCost(position.trades, position.direction);
  const positionPct = totalValue > 0 ? (position.currentPrice * position.quantity / totalValue) * 100 : 0;
  const [editingPrice, setEditingPrice] = useState(false);
  const [priceDraft, setPriceDraft] = useState(String(position.currentPrice));
  const [editingRatio, setEditingRatio] = useState(false);
  const [ratioDraft, setRatioDraft] = useState(String((position.marginRatio ?? 0.1) * 100));

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
          <h3 className="text-base font-semibold text-gray-900">{position.code} {position.name}</h3>
          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${
            position.type === "股票"
              ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20"
              : "bg-blue-50 text-blue-700 ring-blue-600/20"
          }`}>
            {position.type}
          </span>
          {position.direction === "做空" && (
            <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset bg-orange-50 text-orange-700 ring-orange-600/20">
              做空
            </span>
          )}
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
      <div className="grid grid-cols-3 gap-x-6 gap-y-4 mb-6">
        <div>
          <span className="text-xs text-gray-500">代码</span>
          <p className="text-sm font-medium text-gray-900 tabular-nums">{position.code}</p>
        </div>
        <div>
          <span className="text-xs text-gray-500">方向</span>
          <p className="text-sm font-medium text-gray-900">
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${position.direction === "做多" ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20" : "bg-orange-50 text-orange-700 ring-orange-600/20"}`}>
              {position.direction}
            </span>
          </p>
        </div>
        <div>
          <span className="text-xs text-gray-500">持仓占比</span>
          <p className="text-sm font-medium text-gray-900 tabular-nums">
            {positionPct > 0 ? (
              <span className="flex items-center gap-2">
                <span className="h-1.5 w-16 rounded-full bg-gray-200 overflow-hidden">
                  <span className="block h-full rounded-full bg-slate-600" style={{ width: `${Math.min(positionPct, 100)}%` }} />
                </span>
                <span>{positionPct.toFixed(1)}%</span>
              </span>
            ) : positionPct === 0 ? <span>0.0%</span> : "-"}
          </p>
        </div>
        <div>
          <span className="text-xs text-gray-500">持仓量</span>
          <p className="text-sm font-medium text-gray-900 tabular-nums">
            {position.quantity} {position.type === "股票" ? "股" : "手"}
          </p>
        </div>
        <div>
          <span className="text-xs text-gray-500">总成本</span>
          <p className="text-sm font-medium text-gray-900 tabular-nums">{formatCNY(totalCost)}</p>
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
          <div className="col-span-3">
            <span className="text-xs text-gray-500">盈亏</span>
            <p className={`text-sm font-semibold tabular-nums ${profitColor}`}>
              {profitSign}{formatCNY(Math.abs(profitAmount))} ({profitSign}{profitPct.toFixed(2)}%)
            </p>
          </div>
          {position.type === "期货" && (
            <>
              <div>
                <span className="text-xs text-gray-500">保证金比例</span>
                {editingRatio ? (
                  <div className="flex items-center gap-1 mt-0.5">
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      max="100"
                      value={ratioDraft}
                      onChange={(e) => setRatioDraft(e.target.value)}
                      className="w-20 rounded-md border border-gray-300 px-2 py-0.5 text-sm text-gray-900 tabular-nums focus:border-slate-400 focus:ring-2 focus:ring-slate-200/60 focus:outline-none"
                      autoFocus
                    />
                    <span className="text-xs text-gray-400">%</span>
                    <button
                      onClick={() => {
                        const v = parseFloat(ratioDraft);
                        if (!isNaN(v) && v > 0 && v <= 100) {
                          onUpdatePosition(position.id, { marginRatio: v / 100 });
                        }
                        setEditingRatio(false);
                      }}
                      className="text-xs font-medium text-slate-600 hover:text-slate-500"
                    >
                      确认
                    </button>
                    <button
                      onClick={() => setEditingRatio(false)}
                      className="text-xs text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-medium text-gray-900 tabular-nums">
                      {(position.marginRatio ?? 0.1) * 100}%
                    </p>
                    <button
                      onClick={() => { setRatioDraft(String((position.marginRatio ?? 0.1) * 100)); setEditingRatio(true); }}
                      className="text-gray-300 hover:text-gray-500 transition-colors"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>
              <div>
                <span className="text-xs text-gray-500">占用保证金</span>
                <p className="text-sm font-medium text-gray-900 tabular-nums">{formatCNY(marginUsed)}</p>
              </div>
              <div>
                <span className="text-xs text-gray-500">杠杆</span>
                <p className="text-sm font-medium text-gray-900 tabular-nums">{leverage}</p>
              </div>
            </>
          )}
        </div>

      {/* Trade records */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden mt-4">
        <div className="px-4 py-3 flex items-center gap-3 bg-slate-50/80 border-b border-gray-100">
          <div className="w-1 h-4 rounded-full bg-slate-500" />
          <span className="text-sm font-semibold text-gray-800">📝 买卖记录</span>
          <button
            onClick={() => onAddTrade(position.id)}
            className="ml-auto flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-slate-500 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            新增记录
          </button>
        </div>
        {sortedTrades.length === 0 ? (
          <button
            onClick={() => onAddTrade(position.id)}
            className="w-full flex flex-col items-center justify-center py-8 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 hover:text-gray-600 hover:border-gray-300 hover:bg-gray-50/50 transition-all cursor-pointer"
          >
            <Plus className="h-5 w-5 mb-1" />
            <span className="text-xs">点击新增第一条买卖记录</span>
          </button>
        ) : (
          <div className="space-y-1 max-h-[300px] overflow-y-auto custom-scrollbar p-1">
            {sortedTrades.map((t) => (
              <div key={t.id} className="flex items-start gap-3 rounded-lg border border-gray-100 bg-white px-4 py-3 hover:border-gray-200 hover:shadow-sm transition-all">
                <span className={`shrink-0 text-sm font-medium px-2 py-0.5 rounded mt-0.5 ${
                  t.type === "买入" || t.type === "建仓" ? "bg-emerald-50 text-emerald-700" : t.type === "清仓" ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700"
                }`}>
                  {t.type}
                </span>
                <div className="flex flex-col items-start gap-0.5 w-28 shrink-0">
                  <span className="text-[10px] text-gray-400 leading-none">日期</span>
                  <span className="text-sm text-gray-500 tabular-nums">{t.date.slice(0, 10)}</span>
                </div>
                <div className="flex flex-col items-end gap-0.5 w-24 shrink-0">
                  <span className="text-[10px] text-gray-400 leading-none">成交价</span>
                  <span className="text-sm text-gray-500 tabular-nums">{formatCNY(t.price)}</span>
                </div>
                <div className="flex flex-col items-end gap-0.5 w-20 shrink-0">
                  <span className="text-[10px] text-gray-400 leading-none">数量</span>
                  <span className="text-sm text-gray-900 tabular-nums">{t.quantity}</span>
                </div>
                <div className="flex flex-col items-end gap-0.5 w-28 shrink-0">
                  <span className="text-[10px] text-gray-400 leading-none">成交金额</span>
                  <span className="text-sm font-semibold text-gray-900 tabular-nums">{formatCNY(t.price * t.quantity)}</span>
                </div>
                <div className="flex flex-col items-end gap-0.5 flex-1 min-w-0">
                  <span className="text-[10px] text-gray-400 leading-none">手续费</span>
                  <span className="text-xs text-gray-400 whitespace-nowrap">{formatCNY(t.fee)}</span>
                  {t.note ? <span className="text-xs text-gray-400 truncate max-w-full mt-0.5">{t.note}</span> : null}
                </div>
                {!position.archived && (
                <div className="flex items-center gap-0.5 shrink-0">
                  <button onClick={() => onEditTrade(position.id, t)}
                    className="rounded p-1 text-gray-300 hover:text-gray-500 transition-colors">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button onClick={() => onDeleteTrade(position.id, t.id)}
                    className="rounded p-1 text-gray-300 hover:text-red-400 transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ArchivedRightPanel({ position }: { position: Position }) {
  const sortedTrades = useMemo(
    () => [...position.trades].sort((a, b) => b.date.localeCompare(a.date)),
    [position.trades]
  );

  const totalBuyAmount = useMemo(
    () => position.trades
      .filter((t) => t.type === "买入" || t.type === "建仓")
      .reduce((s, t) => s + t.price * t.quantity, 0),
    [position.trades]
  );

  const totalSellAmount = useMemo(
    () => position.trades
      .filter((t) => t.type === "卖出" || t.type === "清仓")
      .reduce((s, t) => s + t.price * t.quantity, 0),
    [position.trades]
  );

  const rawPnl = position.closedPnl ?? 0;
  const pnlColor = rawPnl >= 0 ? "text-emerald-600" : "text-red-600";
  const pnlSign = rawPnl > 0 ? "+" : rawPnl < 0 ? "-" : "";
  const displayPnl = rawPnl === 0 ? "0.00" : `${pnlSign}${formatCNY(Math.abs(rawPnl))}`;
  const returnRate = totalBuyAmount > 0 ? (rawPnl / totalBuyAmount) * 100 : 0;

  const dates = useMemo(
    () => position.trades.map((t) => t.date).sort(),
    [position.trades]
  );
  const openDate = dates[0] ?? "-";
  const closeDate = dates[dates.length - 1] ?? "-";
  const holdingDays = dates.length >= 2
    ? Math.max(0, Math.ceil((new Date(closeDate).getTime() - new Date(openDate).getTime()) / (1000 * 60 * 60 * 24)))
    : 0;

  return (
    <div className="flex-1 rounded-xl border border-gray-200 bg-white shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-semibold text-gray-900">{position.code} {position.name}</h3>
          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${
            position.type === "股票"
              ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20"
              : "bg-blue-50 text-blue-700 ring-blue-600/20"
          }`}>
            {position.type}
          </span>
          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${
            position.direction === "做多"
              ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20"
              : "bg-orange-50 text-orange-700 ring-orange-600/20"
          }`}>
            {position.direction === "做多" ? "多" : "空"}
          </span>
          <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset bg-gray-100 text-gray-600 ring-gray-500/20">
            已归档
          </span>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-x-6 gap-y-4 mb-6">
        <div>
          <span className="text-xs text-gray-500">清仓盈亏</span>
          <p className={`text-lg font-bold tabular-nums ${pnlColor}`}>
            {displayPnl}
          </p>
        </div>
        <div>
          <span className="text-xs text-gray-500">收益率</span>
          <p className={`text-lg font-bold tabular-nums ${rawPnl >= 0 ? "text-emerald-600" : "text-red-600"}`}>
            {returnRate >= 0 ? "+" : ""}{returnRate.toFixed(2)}%
          </p>
        </div>
        <div>
          <span className="text-xs text-gray-500">总买入</span>
          <p className="text-sm font-medium text-gray-900 tabular-nums">{formatCNY(totalBuyAmount)}</p>
        </div>
        <div>
          <span className="text-xs text-gray-500">总卖出</span>
          <p className="text-sm font-medium text-gray-900 tabular-nums">{formatCNY(totalSellAmount)}</p>
        </div>
        <div>
          <span className="text-xs text-gray-500">持仓天数</span>
          <p className="text-sm font-medium text-gray-900 tabular-nums">{holdingDays} 天</p>
        </div>
        <div>
          <span className="text-xs text-gray-500">建仓日期</span>
          <p className="text-sm font-medium text-gray-900 tabular-nums">{openDate}</p>
        </div>
        <div>
          <span className="text-xs text-gray-500">清仓日期</span>
          <p className="text-sm font-medium text-gray-900 tabular-nums">{closeDate}</p>
        </div>
        <div>
          <span className="text-xs text-gray-500">交易次数</span>
          <p className="text-sm font-medium text-gray-900 tabular-nums">{position.trades.length} 笔</p>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="px-4 py-3 flex items-center gap-3 bg-slate-50/80 border-b border-gray-100">
          <div className="w-1 h-4 rounded-full bg-slate-400" />
          <span className="text-sm font-semibold text-gray-800">📝 买卖记录</span>
        </div>
        {sortedTrades.length === 0 ? (
          <p className="px-4 py-6 text-sm text-gray-400 text-center">暂无记录</p>
        ) : (
          <div className="space-y-1 max-h-[400px] overflow-y-auto custom-scrollbar p-1">
            {sortedTrades.map((t) => (
              <div key={t.id} className="flex items-start gap-3 rounded-lg border border-gray-100 bg-white px-4 py-3">
                <span className={`shrink-0 text-sm font-medium px-2 py-0.5 rounded mt-0.5 ${
                  t.type === "买入" || t.type === "建仓" ? "bg-emerald-50 text-emerald-700" : t.type === "清仓" ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700"
                }`}>
                  {t.type}
                </span>
                <div className="flex flex-col items-start gap-0.5 w-28 shrink-0">
                  <span className="text-[10px] text-gray-400 leading-none">日期</span>
                  <span className="text-sm text-gray-500 tabular-nums">{t.date.slice(0, 10)}</span>
                </div>
                <div className="flex flex-col items-end gap-0.5 w-24 shrink-0">
                  <span className="text-[10px] text-gray-400 leading-none">成交价</span>
                  <span className="text-sm text-gray-500 tabular-nums">{formatCNY(t.price)}</span>
                </div>
                <div className="flex flex-col items-end gap-0.5 w-20 shrink-0">
                  <span className="text-[10px] text-gray-400 leading-none">数量</span>
                  <span className="text-sm text-gray-900 tabular-nums">{t.quantity}</span>
                </div>
                <div className="flex flex-col items-end gap-0.5 w-28 shrink-0">
                  <span className="text-[10px] text-gray-400 leading-none">成交金额</span>
                  <span className="text-sm font-semibold text-gray-900 tabular-nums">{formatCNY(t.price * t.quantity)}</span>
                </div>
                <div className="flex flex-col items-end gap-0.5 flex-1 min-w-0">
                  <span className="text-[10px] text-gray-400 leading-none">手续费</span>
                  <span className="text-xs text-gray-400 whitespace-nowrap">{formatCNY(t.fee)}</span>
                  {t.note ? <span className="text-xs text-gray-400 truncate max-w-full mt-0.5">{t.note}</span> : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Modal({
  title, children, onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/5"
    >
      <div
        className="w-full max-w-md rounded-xl border border-gray-200 bg-white shadow-xl anim-in anim-fade anim-down"
        style={{ animationDuration: "200ms" }}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-900">{title}</h3>
          <button onClick={onClose} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  );
}

function AddPositionForm({ initial, onSave, onClose }: {
  initial?: Position;
  onSave: (p: Omit<Position, "id" | "trades" | "costPrice" | "quantity" | "archived" | "closedPnl" | "sortOrder">) => void;
  onClose: () => void;
}) {
  const [code, setCode] = useState(initial?.code ?? "");
  const [name, setName] = useState(initial?.name ?? "");
  const [type, setType] = useState<"股票" | "期货">(initial?.type ?? "股票");
  const [direction, setDirection] = useState<"做多" | "做空">(initial?.direction ?? "做多");
  const [initialQty, setInitialQty] = useState(initial ? String(initial.initialQty) : "0");
  const [price, setPrice] = useState(initial ? String(initial.currentPrice) : "0");
  const [marginRatio, setMarginRatio] = useState(initial?.marginRatio ? String(initial.marginRatio * 100) : "10");
  const [error, setError] = useState("");

  function handleSubmit() {
    if (!code.trim()) { setError("请输入代码"); return; }
    if (!name.trim()) { setError("请输入名称"); return; }
    const iq = parseFloat(initialQty);
    const p = parseFloat(price);
    if (isNaN(iq) || iq <= 0) { setError("持仓量必须大于 0"); return; }
    if (isNaN(p) || p <= 0) { setError("现价必须大于 0"); return; }
    onSave({
      code: code.trim(),
      name: name.trim(),
      type,
      direction,
      initialQty: iq,
      currentPrice: p,
      ...(type === "期货" ? { marginRatio: (parseFloat(marginRatio) || 10) / 100 } : {}),
    });
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-4">
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">代码</label>
        <input type="text" value={code} onChange={(e) => setCode(e.target.value)} autoFocus
          className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-200/60 focus:outline-none"
          placeholder="600519.SH" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">名称</label>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)}
          className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-200/60 focus:outline-none"
          placeholder="贵州茅台" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">类型</label>
          <select value={type} onChange={(e) => setType(e.target.value as "股票" | "期货")}
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-slate-400 focus:ring-2 focus:ring-slate-200/60 focus:outline-none">
            <option value="股票">股票</option>
            <option value="期货">期货</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">方向</label>
          <select value={direction} onChange={(e) => setDirection(e.target.value as "做多" | "做空")}
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-slate-400 focus:ring-2 focus:ring-slate-200/60 focus:outline-none">
            <option value="做多">做多</option>
            <option value="做空">做空</option>
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">持仓量</label>
          <input type="number" min="1" step="1" value={initialQty} onChange={(e) => setInitialQty(e.target.value)}
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-slate-400 focus:ring-2 focus:ring-slate-200/60 focus:outline-none"
            placeholder="100" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">现价</label>
          <input type="number" min="0.01" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)}
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-slate-400 focus:ring-2 focus:ring-slate-200/60 focus:outline-none"
            placeholder="1500.00" />
        </div>
      </div>
      {type === "期货" && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">保证金比例</label>
          <div className="flex items-center gap-2">
            <input type="number" min="0.1" max="100" step="0.1" value={marginRatio} onChange={(e) => setMarginRatio(e.target.value)}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-slate-400 focus:ring-2 focus:ring-slate-200/60 focus:outline-none"
              placeholder="10" />
            <span className="text-sm text-gray-500">%</span>
          </div>
        </div>
      )}
      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors">取消</button>
        <button type="submit" className="rounded-lg px-4 py-2 text-sm font-medium text-white bg-slate-600 hover:bg-slate-500 transition-colors">确认</button>
      </div>
    </form>
  );
}

function TradeForm({
  initial, currentQty, onSave, onClose,
}: {
  initial?: TradeRecord;
  currentQty?: number;
  onSave: (t: Omit<TradeRecord, "id">) => void;
  onClose: () => void;
}) {
  const [type, setType] = useState<"建仓" | "买入" | "卖出" | "清仓">(initial?.type ?? "买入");
  const [date, setDate] = useState((initial?.date || "").slice(0, 10) || new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10));
  const [price, setPrice] = useState(initial ? String(initial.price) : "");
  const [quantity, setQuantity] = useState(initial ? String(initial.quantity) : "");
  const [fee, setFee] = useState(initial ? String(initial.fee) : "0");
  const [note, setNote] = useState(initial?.note ?? "");
  const [error, setError] = useState("");

  function handleSubmit() {
    if (!date || !price || !quantity) { setError("请填写所有必填字段"); return; }
    const p = parseFloat(price);
    const q = parseFloat(quantity);
    if (isNaN(p) || p <= 0) { setError("价格必须大于 0"); return; }
    if (isNaN(q) || q <= 0) { setError("数量必须大于 0"); return; }
    if ((type === "卖出" || type === "清仓") && currentQty !== undefined && q > currentQty) {
      setError(`卖出量不能大于当前持仓量（${currentQty}）`);
      return;
    }
    onSave({ type, date, price: p, quantity: q, fee: parseFloat(fee) || 0, note: note.trim() || undefined });
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-4">
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">方向</label>
        <select value={type} onChange={(e) => setType(e.target.value as "建仓" | "买入" | "卖出" | "清仓")}
          className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-slate-400 focus:ring-2 focus:ring-slate-200/60 focus:outline-none">
          <option value="建仓">建仓</option>
          <option value="买入">买入</option>
          <option value="卖出">卖出</option>
          <option value="清仓">清仓</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">日期</label>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} autoFocus
          className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-slate-400 focus:ring-2 focus:ring-slate-200/60 focus:outline-none" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">成交价</label>
          <input type="number" min="0.01" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)}
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-slate-400 focus:ring-2 focus:ring-slate-200/60 focus:outline-none"
            placeholder="1500.00" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">数量</label>
          <input type="number" min="0" step="1" value={quantity} onChange={(e) => setQuantity(e.target.value)}
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-slate-400 focus:ring-2 focus:ring-slate-200/60 focus:outline-none"
            placeholder="100" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">手续费</label>
          <input type="number" min="0" step="0.01" value={fee} onChange={(e) => setFee(e.target.value)}
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-slate-400 focus:ring-2 focus:ring-slate-200/60 focus:outline-none"
            placeholder="0.00" />
        </div>
        <div />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">备注（可选）</label>
        <input type="text" value={note} onChange={(e) => setNote(e.target.value)}
          className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-200/60 focus:outline-none"
          placeholder="备注信息" />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors">取消</button>
        <button type="submit" className="rounded-lg px-4 py-2 text-sm font-medium text-white bg-slate-600 hover:bg-slate-500 transition-colors">确认</button>
      </div>
    </form>
  );
}

function DeleteConfirm({
  message, onConfirm, onClose,
}: {
  message: string;
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
}) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="rounded-full bg-red-50 p-3 mb-3">
        <AlertTriangle className="h-6 w-6 text-red-500" />
      </div>
      <p className="text-sm text-gray-700 mb-1">{message}</p>
      <p className="text-xs text-gray-500 mb-4">此操作不可撤销</p>
      <div className="flex gap-2">
        <button onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors">取消</button>
        <button onClick={async () => { await onConfirm(); onClose(); }} className="rounded-lg px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-500 transition-colors">确认删除</button>
      </div>
    </div>
  );
}

function TrendChart({ snapshots }: { snapshots: ValueSnapshot[] }) {
  if (snapshots.length < 2) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-1">总市值趋势</h3>
        <p className="text-xs text-gray-500">暂无足够数据绘制趋势图</p>
      </div>
    );
  }

  const sorted = [...snapshots].sort((a, b) => a.date.localeCompare(b.date));
  const values = sorted.map((s) => s.totalValue);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const padding = range * 0.1;
  const paddedMin = min - padding;
  const paddedMax = max + padding;
  const paddedRange = paddedMax - paddedMin;

  const W = 700;
  const H = 200;
  const count = sorted.length;
  const stepX = count > 1 ? W / (count - 1) : W / 2;

  const points = sorted.map((s, i) => {
    const x = count > 1 ? i * stepX : W / 2;
    const y = H - ((s.totalValue - paddedMin) / paddedRange) * H * 0.85 - H * 0.075;
    return `${x},${y}`;
  });

  const pathD = `M ${points.join(" L ")}`;

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900">总市值趋势</h3>
        <p className="text-xs text-gray-500 tabular-nums">
          {formatCNY(sorted[sorted.length - 1].totalValue)}
        </p>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-[240px]" preserveAspectRatio="xMidYMid meet">
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
          const y = H - ratio * H * 0.85 - H * 0.075;
          return (
            <g key={ratio}>
              <line x1={0} y1={y} x2={W} y2={y} stroke="#e2e8f0" strokeWidth="1" />
              <text x={W - 4} y={y + 3} textAnchor="end" className="fill-gray-400" fontSize="10">
                {formatCNY(paddedMin + ratio * paddedRange)}
              </text>
            </g>
          );
        })}
        {/* Area fill */}
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#64748b" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#64748b" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <path d={`${pathD} L ${points[points.length - 1].split(",")[0]},${H} L ${points[0].split(",")[0]},${H} Z`} fill="url(#areaGrad)" />
        {/* Line */}
        <path d={pathD} fill="none" stroke="#64748b" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        {/* Dots */}
        {sorted.map((s, i) => {
          const [cx, cy] = points[i].split(",");
          return <circle key={s.date} cx={cx} cy={cy} r="3" fill="#64748b" className="hover:r-4" />;
        })}
        {/* X-axis labels */}
        {sorted.filter((_, i) => i === 0 || i === count - 1 || (i % Math.max(1, Math.floor(count / 5)) === 0)).map((s) => {
          const idx = sorted.indexOf(s);
          const x = count > 1 ? idx * stepX : W / 2;
          return (
            <text key={s.date} x={x} y={H - 4} textAnchor="middle" className="fill-gray-400" fontSize="10">
              {s.date.slice(5)}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

export default function PortfolioPage() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [snapshots, setSnapshots] = useState<ValueSnapshot[]>([]);
  const [totalCapital, setTotalCapital] = useState(0);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [posRes, snapRes, cfgRes] = await Promise.all([
        api("/api/v1/cash-flow/portfolio/positions"),
        api("/api/v1/cash-flow/portfolio/snapshots"),
        api("/api/v1/cash-flow/portfolio/config"),
      ]);
      const posJson = await posRes.json();
      const snapJson = await snapRes.json();
      const cfgJson = await cfgRes.json();
      if (posJson.code === 0 && posJson.data) {
        const rawPositions = (posJson.data as any[]);
        const positions = rawPositions.map(p => posFromAPI(p));
        // Load trades for each position
        setPositions(positions);
        if (positions.length > 0 && !selectedId) {
          setSelectedId(positions[0].id);
        }
        const loaded = await Promise.allSettled(
          positions.map(async (pos) => {
            const res = await api(`/api/v1/cash-flow/portfolio/positions/${pos.id}/trades`);
            const json = await res.json();
            if (json.code === 0 && json.data) {
              const trades = (json.data as any[]).map(t => tradeFromAPI(t));
              const qty = calcQuantity(trades, pos.initialQty, pos.direction);
              return { id: pos.id, trades, quantity: qty, costPrice: recalcCostPrice(trades, pos.direction) };
            }
            return null;
          })
        );
        const tradeUpdates: Record<string, any> = {};
        for (const result of loaded) {
          if (result.status === "fulfilled" && result.value) {
            tradeUpdates[result.value.id] = result.value;
          }
        }
        if (Object.keys(tradeUpdates).length > 0) {
          setPositions((prev) => prev.map(p => tradeUpdates[p.id] ? { ...p, ...tradeUpdates[p.id] } : p));
        }
      }
      if (snapJson.code === 0 && snapJson.data) {
        setSnapshots((snapJson.data as any[]).map(s => ({
          date: s.date,
          totalValue: s.total_value / 100,
        })));
      }
      if (cfgJson.code === 0 && cfgJson.data) {
        setTotalCapital(cfgJson.data.total_capital / 100);
      }
    } catch {
      setToast({ type: "error", message: "加载数据失败" });
    } finally {
      setLoading(false);
    }
  }

  const selectedPosition = useMemo(
    () => positions.find((p) => p.id === selectedId) ?? null,
    [positions, selectedId]
  );

  const activePositions = useMemo(
    () => positions.filter((p) => !p.archived),
    [positions]
  );

  const archivedPositions = useMemo(
    () => positions.filter((p) => p.archived),
    [positions]
  );

  const totalPortfolioValue = useMemo(
    () => activePositions.reduce((sum, p) => sum + p.currentPrice * p.quantity, 0),
    [activePositions]
  );

  const realizedPnl = useMemo(
    () => archivedPositions.reduce((sum, p) => sum + (p.closedPnl ?? 0), 0),
    [archivedPositions]
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
    setPositions((prev) => prev.map((p) => {
      if (p.id !== id) return p;
      let next = { ...p, ...updates };
      if ("initialQty" in updates || "trades" in updates) {
        next.quantity = calcQuantity(next.trades, next.initialQty, next.direction);
      }
      const wasArchived = next.archived;
      if (next.quantity === 0 && !next.archived) {
        next.archived = true;
        next.closedPnl = calcDerived(next).profitAmount;
      }
      // Persist to backend
      if ("currentPrice" in updates || "marginRatio" in updates || (next.archived && !wasArchived)) {
        api(`/api/v1/cash-flow/portfolio/positions/${id}`, {
          method: "PUT",
          body: JSON.stringify({
            ...posToAPI(next),
            archived: next.archived,
            closed_pnl: Math.round((next.closedPnl ?? 0) * 100),
          }),
        }).then(r => r.json()).then(j => {
          if (j.code !== 0) setToast({ type: "error", message: j.message || "保存失败" });
        });
      }
      return next;
    }));
    if ("currentPrice" in updates) {
      const today = new Date().toISOString().slice(0, 10);
      setPositions((prev) => {
        const newTotal = prev.reduce((s, p) => s + p.currentPrice * (p.archived ? 0 : p.quantity), 0);
        api("/api/v1/cash-flow/portfolio/snapshots", {
          method: "POST",
          body: JSON.stringify({ date: today, total_value: Math.round(newTotal * 100) }),
        }).then(r => r.json()).then(j => {
          if (j.code !== 0) console.warn("snapshot save failed", j);
        });
        setSnapshots((prev) => {
          const existing = prev.findIndex((s) => s.date === today);
          if (existing >= 0) {
            const next = [...prev];
            next[existing] = { ...next[existing], totalValue: newTotal };
            return next;
          }
          return [...prev, { date: today, totalValue: newTotal }];
        });
        return prev;
      });
    }
  }

  function handleDeleteTrade(positionId: string, tradeId: string) {
    setPositions((prev) =>
      prev.map((p) => {
        if (p.id !== positionId) return p;
        const newTrades = p.trades.filter((t) => t.id !== tradeId);
        const qty = calcQuantity(newTrades, p.initialQty, p.direction);
        if (qty === 0) {
          const closedPnl = calcDerived({ ...p, trades: newTrades, quantity: qty, costPrice: recalcCostPrice(newTrades, p.direction) }).profitAmount;
          api(`/api/v1/cash-flow/portfolio/positions/${positionId}`, {
            method: "PUT",
            body: JSON.stringify({ ...posToAPI(p), archived: true, closed_pnl: Math.round(closedPnl * 100) }),
          });
          return { ...p, trades: newTrades, quantity: qty, costPrice: recalcCostPrice(newTrades, p.direction), archived: true, closedPnl };
        }
        return { ...p, trades: newTrades, quantity: qty, costPrice: recalcCostPrice(newTrades, p.direction), archived: false, closedPnl: 0 };
      })
    );
  }

  function handleDeletePosition(id: string) {
    setPositions((prev) => prev.filter((p) => p.id !== id));
    setSnapshots([]);
    if (selectedId === id) setSelectedId(null);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setPositions((prev) => {
      const movedItem = prev.find((p) => p.id === active.id);
      const overItem = prev.find((p) => p.id === over.id);
      if (!movedItem || !overItem) return prev;

      const crossList = movedItem.archived !== overItem.archived;
      const targetArchived = crossList ? !movedItem.archived : movedItem.archived;

      const withoutMoved = prev.filter((p) => p.id !== active.id);
      const targetItems = withoutMoved.filter((p) => p.archived === targetArchived);
      const otherItems = withoutMoved.filter((p) => p.archived !== targetArchived);

      const insertIdx = targetItems.findIndex((p) => p.id === over.id);
      if (insertIdx === -1) return prev;

      const updatedMoved = crossList
        ? { ...movedItem, archived: targetArchived, closedPnl: targetArchived ? calcDerived(movedItem).profitAmount : 0 }
        : movedItem;

      targetItems.splice(insertIdx, 0, updatedMoved);

      const reordered = targetArchived ? [...otherItems, ...targetItems] : [...targetItems, ...otherItems];
      // Persist sort_order and archive changes
      reordered.forEach((p, i) => {
        api(`/api/v1/cash-flow/portfolio/positions/${p.id}`, {
          method: "PUT",
          body: JSON.stringify({
            ...posToAPI(p),
            sort_order: i,
            archived: p.archived,
            closed_pnl: Math.round((p.closedPnl ?? 0) * 100),
          }),
        }).then(r => r.json()).then(j => {
          if (j.code !== 0) console.warn("position save failed", p.id, j);
        });
      });
      return reordered;
    });
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  return (
    <div className="flex flex-col h-full space-y-6 anim-in anim-fade anim-up" style={{ animationDuration: "500ms" }}>
      <PageHeader title="投资组合" description="股票与期货持仓监控" />
      {toast && (
        <div className={`flex items-center gap-3 rounded-lg border px-5 py-3 text-sm anim-in anim-fade anim-down ${
          toast.type === "success"
            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
            : "border-red-200 bg-red-50 text-red-700"
        }`}>
          <span className="flex-1">{toast.message}</span>
          <button type="button" onClick={() => setToast(null)}
            className="shrink-0 rounded p-0.5 opacity-60 hover:opacity-100 transition-opacity">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
      {loading && (
        <div className="flex items-center justify-center py-12 text-sm text-gray-400">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600 mr-2" />
          加载中...
        </div>
      )}
      <StatCards positions={activePositions} totalCapital={totalCapital} realizedPnl={realizedPnl} totalFees={positions.reduce((s, p) => s + p.trades.reduce((sf, t) => sf + (t.fee ?? 0), 0), 0)} onCapitalChange={async (v) => {
        const res = await api("/api/v1/cash-flow/portfolio/config", {
          method: "PUT", body: JSON.stringify({ total_capital: Math.round(v * 100) }),
        });
        const json = await res.json();
        if (json.code === 0) {
          setTotalCapital(v);
          setToast({ type: "success", message: "总本金已更新" });
        } else {
          setToast({ type: "error", message: json.message || "更新失败" });
        }
      }} />

      <TrendChart snapshots={snapshots} />

      {/* Two-column layout */}
      <div className="flex flex-1 gap-6">
        {/* Left panel */}
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <LeftPanel
            activePositions={activePositions}
            archivedPositions={archivedPositions}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onAdd={() => setModal({ type: "addPosition" })}
          />
        </DndContext>

        {/* Right panel */}
        {selectedPosition ? (
          selectedPosition.archived ? (
            <ArchivedRightPanel position={selectedPosition} />
          ) : (
            <RightPanel
              position={selectedPosition}
              totalValue={totalPortfolioValue}
              onUpdatePosition={handleUpdatePosition}
              onAddTrade={(posId) => setModal({ type: "addTrade", positionId: posId })}
              onEditTrade={(posId, trade) => setModal({ type: "editTrade", positionId: posId, trade })}
              onDeleteTrade={(posId, tradeId) => setModal({ type: "deleteTrade", positionId: posId, tradeId })}
              onEditPosition={(id) => setModal({ type: "editPosition", positionId: id })}
              onDeletePosition={(id) => setModal({ type: "deletePosition", positionId: id })}
            />
          )
        ) : (
          <div className="flex-1 rounded-xl border border-gray-200 bg-white shadow-sm p-6 flex items-center justify-center">
            <p className="text-sm text-gray-400">请从左侧选择一个品种</p>
          </div>
        )}
      </div>

      {/* Modals */}
      {modal?.type === "addPosition" && (
        <Modal title="新增品种" onClose={() => setModal(null)}>
          <AddPositionForm
            onSave={async (data) => {
              const body = {
                code: data.code,
                name: data.name,
                type: data.type === "股票" ? 1 : 2,
                direction: data.direction,
                initial_qty: 0,
                current_price: Math.round(data.currentPrice * 100),
                margin_ratio: Math.round((data.marginRatio ?? 0) * 10000),
                sort_order: activePositions.length,
              };
              try {
                const res = await api("/api/v1/cash-flow/portfolio/positions", {
                  method: "POST", body: JSON.stringify(body),
                });
                const json = await res.json();
                if (json.code !== 0) { setToast({ type: "error", message: json.message || "创建失败" }); return; }
                const pos = posFromAPI(json.data);
                // Create initial trade if quantity > 0
                if (data.initialQty > 0 && data.currentPrice > 0) {
                  const today = new Date().toISOString().slice(0, 10);
                  await api(`/api/v1/cash-flow/portfolio/positions/${pos.id}/trades`, {
                    method: "POST",
                    body: JSON.stringify({ type: 1, date: today, price: Math.round(data.currentPrice * 100), quantity: data.initialQty, note: "" }),
                  });
                  // Reload trades
                  const tRes = await api(`/api/v1/cash-flow/portfolio/positions/${pos.id}/trades`);
                  const tJson = await tRes.json();
                  if (tJson.code === 0 && tJson.data) {
                    pos.trades = (tJson.data as any[]).map(t => tradeFromAPI(t));
                    pos.quantity = calcQuantity(pos.trades, 0, pos.direction);
                    pos.costPrice = recalcCostPrice(pos.trades, pos.direction);
                  }
                }
                setPositions((prev) => [...prev, pos]);
                setSelectedId(pos.id);
                setToast({ type: "success", message: "品种创建成功" });
                setModal(null);
              } catch { setToast({ type: "error", message: "创建失败" }); }
            }}
            onClose={() => setModal(null)}
          />
        </Modal>
      )}

      {modal?.type === "editPosition" && (() => {
        const p = positions.find((x) => x.id === modal.positionId);
        if (!p) return null;
        return (
          <Modal title="编辑品种" onClose={() => setModal(null)}>
            <AddPositionForm key={modal.positionId}
              initial={p}
              onSave={async (data) => {
                try {
                  const res = await api(`/api/v1/cash-flow/portfolio/positions/${modal.positionId}`, {
                    method: "PUT",
                    body: JSON.stringify({
                      code: data.code, name: data.name,
                      type: data.type === "股票" ? 1 : 2, direction: data.direction,
                      initial_qty: data.initialQty,
                      current_price: Math.round(data.currentPrice * 100),
                      margin_ratio: Math.round((data.marginRatio ?? 0) * 10000),
                      sort_order: p.sortOrder ?? 0,
                      archived: p.archived,
                      closed_pnl: Math.round((p.closedPnl ?? 0) * 100),
                    }),
                  });
                  const json = await res.json();
                  if (json.code !== 0) { setToast({ type: "error", message: json.message || "更新失败" }); return; }
                  setPositions((prev) => prev.map(x => x.id === modal.positionId ? { ...x, ...data } : x));
                  setToast({ type: "success", message: "品种已更新" });
                  setModal(null);
                } catch { setToast({ type: "error", message: "更新失败" }); }
              }}
              onClose={() => setModal(null)}
            />
          </Modal>
        );
      })()}

      {modal?.type === "deletePosition" && (
        <Modal title="删除品种" onClose={() => setModal(null)}>
          <DeleteConfirm
            message="删除此品种将同时清除所有关联的买卖记录和趋势数据。"
            onConfirm={async () => {
              try {
                const res = await api(`/api/v1/cash-flow/portfolio/positions/${modal.positionId}`, { method: "DELETE" });
                const json = await res.json();
                if (json.code !== 0) { setToast({ type: "error", message: json.message || "删除失败" }); return; }
                handleDeletePosition(modal.positionId);
                setToast({ type: "success", message: "品种已删除" });
              } catch { setToast({ type: "error", message: "删除失败" }); }
            }}
            onClose={() => setModal(null)}
          />
        </Modal>
      )}

      {modal?.type === "addTrade" && (() => {
        const pos = positions.find((p) => p.id === modal.positionId);
        return (
        <Modal title="新增记录" onClose={() => setModal(null)}>
          <TradeForm
            currentQty={pos?.quantity}
            onSave={async (data) => {
              const tradeType = data.type === "卖出" && pos && data.quantity >= pos.quantity ? "清仓" : data.type;
              try {
                const res = await api(`/api/v1/cash-flow/portfolio/positions/${modal.positionId}/trades`, {
                  method: "POST",
                  body: JSON.stringify(tradeToAPI({ ...data, type: tradeType })),
                });
                const json = await res.json();
                if (json.code !== 0) { setToast({ type: "error", message: json.message || "创建失败" }); return; }
                const newTrade = tradeFromAPI(json.data);
                setPositions((prev) =>
                  prev.map((p) => {
                    if (p.id !== modal.positionId) return p;
                    const newTrades = [...p.trades, newTrade];
                    const qty = calcQuantity(newTrades, p.initialQty, p.direction);
                    if (qty === 0) {
                      const closedPnl = -calcTradeTotalCost(newTrades, p.direction);
                      api(`/api/v1/cash-flow/portfolio/positions/${modal.positionId}`, {
                        method: "PUT",
                        body: JSON.stringify({ ...posToAPI(p), archived: true, closed_pnl: Math.round(closedPnl * 100) }),
                      });
                      return { ...p, trades: newTrades, quantity: qty, costPrice: recalcCostPrice(newTrades, p.direction), archived: true, closedPnl };
                    }
                    return { ...p, trades: newTrades, quantity: qty, costPrice: recalcCostPrice(newTrades, p.direction), archived: false, closedPnl: p.closedPnl };
                  })
                );
                setToast({ type: "success", message: "记录已添加" });
                setModal(null);
              } catch { setToast({ type: "error", message: "创建失败" }); }
            }}
            onClose={() => setModal(null)}
          />
        </Modal>);
      })()}

      {modal?.type === "editTrade" && (
        <Modal title="编辑记录" onClose={() => setModal(null)}>
          <TradeForm key={modal.trade.id}
            initial={modal.trade}
            onSave={async (data) => {
              try {
                const res = await api(`/api/v1/cash-flow/portfolio/trades/${modal.trade.id}`, {
                  method: "PUT",
                  body: JSON.stringify(tradeToAPI(data)),
                });
                const json = await res.json();
                if (json.code !== 0) { setToast({ type: "error", message: json.message || "更新失败" }); return; }
                const updated = tradeFromAPI(json.data);
                setPositions((prev) =>
                  prev.map((p) => {
                    if (p.id !== modal.positionId) return p;
                    const newTrades = p.trades.map((t) => t.id === modal.trade.id ? updated : t);
                    const qty = calcQuantity(newTrades, p.initialQty, p.direction);
                    if (qty === 0) {
                      const closedPnl = -calcTradeTotalCost(newTrades, p.direction);
                      api(`/api/v1/cash-flow/portfolio/positions/${modal.positionId}`, {
                        method: "PUT",
                        body: JSON.stringify({ ...posToAPI(p), archived: true, closed_pnl: Math.round(closedPnl * 100) }),
                      });
                      return { ...p, trades: newTrades, quantity: qty, costPrice: recalcCostPrice(newTrades, p.direction), archived: true, closedPnl };
                    }
                    return { ...p, trades: newTrades, quantity: qty, costPrice: recalcCostPrice(newTrades, p.direction), archived: false, closedPnl: 0 };
                  })
                );
                setToast({ type: "success", message: "记录已更新" });
                setModal(null);
              } catch { setToast({ type: "error", message: "更新失败" }); }
            }}
            onClose={() => setModal(null)}
          />
        </Modal>
      )}

      {modal?.type === "deleteTrade" && (
        <Modal title="删除记录" onClose={() => setModal(null)}>
          <DeleteConfirm
            message="确定要删除此买卖记录吗？"
            onConfirm={async () => {
              try {
                const res = await api(`/api/v1/cash-flow/portfolio/trades/${modal.tradeId}`, { method: "DELETE" });
                const json = await res.json();
                if (json.code !== 0) { setToast({ type: "error", message: json.message || "删除失败" }); return; }
                handleDeleteTrade(modal.positionId, modal.tradeId);
                setToast({ type: "success", message: "记录已删除" });
              } catch { setToast({ type: "error", message: "删除失败" }); }
            }}
            onClose={() => setModal(null)}
          />
        </Modal>
      )}
    </div>
  );
}
