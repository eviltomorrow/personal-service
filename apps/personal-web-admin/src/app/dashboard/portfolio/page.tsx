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
      <p className="text-sm text-gray-500">暂无持仓数据，请添加品种。</p>
    </div>
  );
}
