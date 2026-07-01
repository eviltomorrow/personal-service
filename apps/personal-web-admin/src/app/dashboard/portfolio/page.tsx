"use client";

import { useState, useMemo, useRef } from "react";
import { PageHeader } from "@/components/page-header";
import { formatCNY } from "@/lib/format";
import {
  Plus, Pencil, Trash2, X, AlertTriangle,
  Layers, DollarSign, TrendingUp, Percent, ArrowUpDown, GripVertical,
} from "lucide-react";
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext, verticalListSortingStrategy, useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

function genId() { return crypto.randomUUID(); }

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
}

interface ValueSnapshot {
  date: string;
  totalValue: number;
}

function recalcCostPrice(trades: TradeRecord[]): number {
  let totalQty = 0;
  let totalCost = 0;
  for (const t of trades) {
    if (t.type === "买入") {
      totalQty += t.quantity;
      totalCost += t.price * t.quantity;
    } else {
      if (totalQty > 0) {
        totalCost -= (totalCost / totalQty) * t.quantity;
      }
      totalQty -= t.quantity;
    }
    if (totalQty < 0) totalQty = 0;
  }
  if (totalQty <= 0) return 0;
  return totalCost / totalQty;
}

function calcQuantity(trades: TradeRecord[], initialQty: number): number {
  return Math.max(0, trades.reduce((qty, t) => {
    return t.type === "买入" ? qty + t.quantity : qty - t.quantity;
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

function StatCards({ positions, totalCapital, onCapitalChange }: {
  positions: Position[];
  totalCapital: number;
  onCapitalChange: (v: number) => void;
}) {
  const [editingCapital, setEditingCapital] = useState(false);
  const [capitalDraft, setCapitalDraft] = useState("");

  const count = positions.length;
  const totalValue = positions.reduce((s, p) => s + p.currentPrice * p.quantity, 0);
  const totalProfit = positions.reduce((s, p) => {
    const d = calcDerived(p);
    return s + d.profitAmount;
  }, 0);
  const totalProfitPct = totalCapital > 0 ? (totalProfit / totalCapital) * 100 : 0;
  const longCount = positions.filter((p) => p.direction === "做多").length;
  const shortCount = positions.filter((p) => p.direction === "做空").length;

  const profitColor = totalProfit >= 0 ? "emerald" : "red";
  const profitSign = totalProfit > 0 ? "+" : totalProfit < 0 ? "-" : "";

  const cards = [
    { icon: DollarSign, label: "总本金", value: formatCNY(totalCapital), bar: "slate", editable: true },
    { icon: Layers, label: "总品种数", value: String(count), bar: "blue" },
    { icon: TrendingUp, label: "总市值", value: formatCNY(totalValue), bar: "emerald" },
    { icon: TrendingUp, label: "总盈亏", value: `${profitSign}${formatCNY(Math.abs(totalProfit))}`, bar: profitColor, text: profitColor },
    { icon: Percent, label: "总收益率", value: `${profitSign}${totalProfitPct.toFixed(2)}%`, bar: "amber", text: profitColor },
    { icon: ArrowUpDown, label: "多空比", value: `${longCount} : ${shortCount}`, bar: "purple" },
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
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => setEditingCapital(false)}>
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
  const mv = position.currentPrice * position.quantity;
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
        <div className="flex items-center gap-1.5 min-w-0 mb-0.5">
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
          {position.direction === "做空" && (
            <span className="shrink-0 inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium ring-1 ring-inset bg-orange-50 text-orange-700 ring-orange-600/20">
              空
            </span>
          )}
        </div>
        <p className="text-xs text-gray-500 tabular-nums pl-0.5">{formatCNY(mv)}</p>
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
        <span className="text-sm font-semibold text-gray-800">📋 持仓列表</span>
      </div>
      <div className="overflow-y-auto custom-scrollbar max-h-[300px]">
        {activePositions.length === 0 ? (
          <p className="px-4 py-6 text-sm text-gray-400 text-center">暂无持仓</p>
        ) : (
          <SortableContext items={activePositions.map((p) => p.id)} strategy={verticalListSortingStrategy}>
            <div className="divide-y divide-gray-100">
              {activePositions.map((p) => (
                <SortablePositionItem key={p.id} position={p} isSelected={p.id === selectedId} onSelect={onSelect} />
              ))}
            </div>
          </SortableContext>
        )}
      </div>
      <div className="px-4 py-3 border-t border-gray-100">
        <button onClick={onAdd}
          className="flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-500 transition-colors"
        >
          <Plus className="h-4 w-4" />
          新增品种
        </button>
      </div>

      {/* Archived positions section */}
      <div className="px-4 py-3 flex items-center gap-3 bg-slate-50/80 border-t border-gray-100">
        <div className="w-1 h-4 rounded-full bg-slate-400" />
        <span className="text-sm font-semibold text-gray-800">🗄️ 归档列表 ({archivedPositions.length})</span>
      </div>
      <div className="overflow-y-auto custom-scrollbar max-h-[300px]">
        {archivedPositions.length === 0 ? (
          <p className="px-4 py-6 text-sm text-gray-400 text-center">暂无归档</p>
        ) : (
          <SortableContext items={archivedPositions.map((p) => p.id)} strategy={verticalListSortingStrategy}>
            <div className="divide-y divide-gray-100">
              {archivedPositions.map((p) => (
                <SortablePositionItem key={p.id} position={p} isSelected={p.id === selectedId} onSelect={onSelect} />
              ))}
            </div>
          </SortableContext>
        )}
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
  const totalCost = position.costPrice * position.quantity;
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
              <div key={t.id} className="flex items-center gap-4 rounded-lg border border-gray-100 bg-white px-4 py-3 hover:border-gray-200 hover:shadow-sm transition-all">
                <span className={`shrink-0 text-sm font-medium px-2 py-0.5 rounded ${
                  t.type === "买入" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                }`}>
                  {t.type}
                </span>
                <span className="text-sm text-gray-500 tabular-nums w-28 shrink-0">{t.date}</span>
                <span className="text-sm text-gray-500 tabular-nums w-24 text-right shrink-0">{formatCNY(t.price)}</span>
                <span className="text-sm text-gray-900 tabular-nums w-20 text-right shrink-0">{t.quantity}</span>
                <span className="text-sm font-semibold text-gray-900 tabular-nums w-28 text-right shrink-0">{formatCNY(t.price * t.quantity)}</span>
                {t.note ? (
                  <span className="text-sm text-gray-400 truncate flex-1 min-w-0">{t.note}</span>
                ) : (
                  <span className="flex-1 min-w-0" />
                )}
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
  const overlayRef = useRef<HTMLDivElement>(null);
  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/5"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
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
  onSave: (p: Omit<Position, "id" | "trades" | "costPrice" | "quantity" | "archived" | "closedPnl">) => void;
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
    const iq = parseFloat(initialQty) || 0;
    const p = parseFloat(price) || 0;
    if (iq < 0) { setError("持仓量不能为负数"); return; }
    if (p < 0) { setError("价格不能为负数"); return; }
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
          <label className="block text-sm font-medium text-gray-700 mb-1">持仓量（可选）</label>
          <input type="number" min="0" step="1" value={initialQty} onChange={(e) => setInitialQty(e.target.value)}
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-slate-400 focus:ring-2 focus:ring-slate-200/60 focus:outline-none"
            placeholder="0" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">现价（可选）</label>
          <input type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)}
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-slate-400 focus:ring-2 focus:ring-slate-200/60 focus:outline-none"
            placeholder="0.00" />
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
  initial, onSave, onClose,
}: {
  initial?: TradeRecord;
  onSave: (t: Omit<TradeRecord, "id">) => void;
  onClose: () => void;
}) {
  const [type, setType] = useState<"买入" | "卖出">(initial?.type ?? "买入");
  const [date, setDate] = useState(initial?.date ?? new Date().toISOString().slice(0, 10));
  const [price, setPrice] = useState(initial ? String(initial.price) : "");
  const [quantity, setQuantity] = useState(initial ? String(initial.quantity) : "");
  const [note, setNote] = useState(initial?.note ?? "");
  const [error, setError] = useState("");

  function handleSubmit() {
    if (!date || !price || !quantity) { setError("请填写所有必填字段"); return; }
    const p = parseFloat(price);
    const q = parseFloat(quantity);
    if (isNaN(p) || p <= 0) { setError("价格必须大于 0"); return; }
    if (isNaN(q) || q <= 0) { setError("数量必须大于 0"); return; }
    onSave({ type, date, price: p, quantity: q, note: note.trim() || undefined });
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-4">
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">方向</label>
        <select value={type} onChange={(e) => setType(e.target.value as "买入" | "卖出")}
          className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-slate-400 focus:ring-2 focus:ring-slate-200/60 focus:outline-none">
          <option value="买入">买入</option>
          <option value="卖出">卖出</option>
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
  onConfirm: () => void;
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
        <button onClick={() => { onConfirm(); onClose(); }} className="rounded-lg px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-500 transition-colors">确认删除</button>
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
    setPositions((prev) => {
      const updated = prev.map((p) => {
        if (p.id !== id) return p;
        let next = { ...p, ...updates };
        if ("initialQty" in updates || "trades" in updates) {
          next.quantity = calcQuantity(next.trades, next.initialQty);
        }
        if (next.quantity === 0 && !next.archived) {
          next.archived = true;
          next.closedPnl = calcDerived(next).profitAmount;
        }
        return next;
      });
      if ("currentPrice" in updates) {
        const today = new Date().toISOString().slice(0, 10);
        const newTotal = updated.reduce((s, p) => s + p.currentPrice * (p.archived ? 0 : p.quantity), 0);
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
      return updated;
    });
  }

  function handleDeleteTrade(positionId: string, tradeId: string) {
    setPositions((prev) =>
      prev.map((p) => {
        if (p.id !== positionId) return p;
        const newTrades = p.trades.filter((t) => t.id !== tradeId);
        const qty = calcQuantity(newTrades, p.initialQty);
        return {
          ...p,
          trades: newTrades,
          quantity: qty,
          costPrice: recalcCostPrice(newTrades),
          archived: qty === 0 ? true : p.archived,
          closedPnl: qty === 0 ? calcDerived({ ...p, trades: newTrades, quantity: qty, costPrice: recalcCostPrice(newTrades) }).profitAmount : p.closedPnl,
        };
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

    const activeItem = positions.find((p) => p.id === active.id);
    const overItem = positions.find((p) => p.id === over.id);
    if (!activeItem || !overItem) return;

    // Cross-list drag: toggle archived status + snapshot PnL
    if (activeItem.archived !== overItem.archived) {
      setPositions((prev) =>
        prev.map((p) => {
          if (p.id !== activeItem.id) return p;
          const nextArchived = !p.archived;
          const d = calcDerived(p);
          return {
            ...p,
            archived: nextArchived,
            closedPnl: nextArchived ? d.profitAmount : undefined,
          };
        })
      );
      return;
    }

    // Same-list drag: reorder only within the same list
    setPositions((prev) => {
      const sameList = prev.filter(
        (p) => p.archived === activeItem.archived
      );

      const oldIndex = sameList.findIndex((p) => p.id === active.id);
      const newIndex = sameList.findIndex((p) => p.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return prev;

      const sameListIds = sameList.map((p) => p.id);
      const movedItem = prev.find((p) => p.id === active.id);
      if (!movedItem) return prev;

      const otherItems = prev.filter((p) => p.archived !== movedItem.archived);
      const reorderedList = sameListIds.filter((id) => id !== active.id);
      reorderedList.splice(newIndex, 0, String(active.id));

      const newList = reorderedList.map((id) => prev.find((p) => p.id === id)).filter((x): x is Position => x != null);
      const merged = movedItem.archived
        ? [...otherItems, ...newList]
        : [...newList, ...otherItems];
      return merged.map((p) => ({ ...p }));
    });
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  return (
    <div className="flex flex-col h-full space-y-6 anim-in anim-fade anim-up" style={{ animationDuration: "500ms" }}>
      <PageHeader title="投资组合" description="股票与期货持仓监控" />
      <StatCards positions={activePositions} totalCapital={totalCapital} onCapitalChange={setTotalCapital} />

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
            onSave={(data) => {
              const id = genId();
              const qty = calcQuantity([], data.initialQty);
              setPositions((prev) => [...prev, { ...data, id, quantity: qty, costPrice: data.currentPrice, trades: [], archived: false }]);
              setSnapshots((prev) => {
                const today = new Date().toISOString().slice(0, 10);
                const newTotal = positions.reduce((s, p) => s + p.currentPrice * p.quantity, 0) + data.currentPrice * qty;
                const existing = prev.findIndex((s) => s.date === today);
                if (existing >= 0) {
                  const next = [...prev];
                  next[existing] = { ...next[existing], totalValue: newTotal };
                  return next;
                }
                return [...prev, { date: today, totalValue: newTotal }];
              });
              setSelectedId(id);
              setModal(null);
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
            <AddPositionForm
              initial={p}
              onSave={(data) => {
                handleUpdatePosition(modal.positionId, data);
                setModal(null);
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
            onConfirm={() => { handleDeletePosition(modal.positionId); }}
            onClose={() => setModal(null)}
          />
        </Modal>
      )}

      {modal?.type === "addTrade" && (
        <Modal title="新增记录" onClose={() => setModal(null)}>
          <TradeForm
            onSave={(data) => {
              const newTrade = { id: genId(), ...data };
              setPositions((prev) =>
                prev.map((p) => {
                  if (p.id !== modal.positionId) return p;
                  const newTrades = [...p.trades, newTrade];
                  const qty = calcQuantity(newTrades, p.initialQty);
                  return {
                    ...p,
                    trades: newTrades,
                    quantity: qty,
                    costPrice: recalcCostPrice(newTrades),
                    archived: qty === 0 ? true : p.archived,
                    closedPnl: qty === 0 ? calcDerived({ ...p, trades: newTrades, quantity: qty, costPrice: recalcCostPrice(newTrades) }).profitAmount : p.closedPnl,
                  };
                })
              );
              setModal(null);
            }}
            onClose={() => setModal(null)}
          />
        </Modal>
      )}

      {modal?.type === "editTrade" && (
        <Modal title="编辑记录" onClose={() => setModal(null)}>
          <TradeForm
            initial={modal.trade}
            onSave={(data) => {
              setPositions((prev) =>
                prev.map((p) => {
                  if (p.id !== modal.positionId) return p;
                  const newTrades = p.trades.map((t) => t.id === modal.trade.id ? { ...t, ...data } : t);
                  const qty = calcQuantity(newTrades, p.initialQty);
                  return {
                    ...p,
                    trades: newTrades,
                    quantity: qty,
                    costPrice: recalcCostPrice(newTrades),
                    archived: qty === 0 ? true : p.archived,
                    closedPnl: qty === 0 ? calcDerived({ ...p, trades: newTrades, quantity: qty, costPrice: recalcCostPrice(newTrades) }).profitAmount : p.closedPnl,
                  };
                })
              );
              setModal(null);
            }}
            onClose={() => setModal(null)}
          />
        </Modal>
      )}

      {modal?.type === "deleteTrade" && (
        <Modal title="删除记录" onClose={() => setModal(null)}>
          <DeleteConfirm
            message="确定要删除此买卖记录吗？"
            onConfirm={() => { handleDeleteTrade(modal.positionId, modal.tradeId); }}
            onClose={() => setModal(null)}
          />
        </Modal>
      )}
    </div>
  );
}
