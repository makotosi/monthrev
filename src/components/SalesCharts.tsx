"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";
import { MonthlySale } from "@/lib/types";
import { formatYMShort, formatYoY } from "@/lib/format";

interface Props {
  sales: MonthlySale[];
}

// Recharts 用データ変換
function toChartData(sales: MonthlySale[]) {
  return sales.map((s) => ({
    label: formatYMShort(s.sales_year, s.sales_month),
    既存店売上: s.existing_sales_yoy,
    全社売上: s.total_sales_yoy,
    客数: s.customer_count_yoy,
    客単価: s.spend_per_customer_yoy,
  }));
}

// カスタムツールチップ
function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-xs">
      <p className="font-semibold text-gray-700 mb-2">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2 mb-1">
          <span
            className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-gray-500 w-20">{entry.name}</span>
          <span
            className={`font-mono font-medium ${
              entry.value > 100
                ? "text-emerald-600"
                : entry.value < 100
                ? "text-red-600"
                : "text-gray-500"
            }`}
          >
            {formatYoY(entry.value)}
          </span>
          <span className="text-gray-300">({entry.value.toFixed(1)})</span>
        </div>
      ))}
    </div>
  );
}

// Y軸フォーマッター：100 からの差分で表示
function yAxisFormatter(value: number) {
  const diff = value - 100;
  return `${diff >= 0 ? "+" : ""}${diff.toFixed(0)}%`;
}

const CHART_COMMON = {
  margin: { top: 8, right: 16, left: 8, bottom: 4 },
};

export default function SalesCharts({ sales }: Props) {
  const data = toChartData(sales);

  return (
    <div className="space-y-8">
      {/* ── グラフA：既存店売上 & 全社売上 YoY ──────────────────────────── */}
      <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-gray-800">
            グラフ A｜既存店・全社売上 前年比
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">
            基準線（±0%）は前年同月比フラットを表します
          </p>
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={data} {...CHART_COMMON}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#f0f0f0"
              vertical={false}
            />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: "#9ca3af" }}
              tickLine={false}
              axisLine={{ stroke: "#e5e7eb" }}
              interval="preserveStartEnd"
            />
            <YAxis
              tickFormatter={yAxisFormatter}
              tick={{ fontSize: 11, fill: "#9ca3af" }}
              tickLine={false}
              axisLine={false}
              width={48}
            />
            {/* 基準線 100% */}
            <ReferenceLine
              y={100}
              stroke="#d1d5db"
              strokeDasharray="4 4"
              strokeWidth={1.5}
              label={{
                value: "±0%",
                position: "insideTopRight",
                fontSize: 10,
                fill: "#9ca3af",
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
              iconType="circle"
              iconSize={8}
            />
            <Line
              type="monotone"
              dataKey="既存店売上"
              stroke="#2563eb"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0 }}
            />
            <Line
              type="monotone"
              dataKey="全社売上"
              stroke="#94a3b8"
              strokeWidth={1.5}
              strokeDasharray="5 3"
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* ── グラフB：客数 & 客単価 YoY ──────────────────────────────────── */}
      <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-gray-800">
            グラフ B｜客数・客単価 前年比（既存店）
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">
            客数×客単価＝既存店売上の要因分解
          </p>
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={data} {...CHART_COMMON}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#f0f0f0"
              vertical={false}
            />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: "#9ca3af" }}
              tickLine={false}
              axisLine={{ stroke: "#e5e7eb" }}
              interval="preserveStartEnd"
            />
            <YAxis
              tickFormatter={yAxisFormatter}
              tick={{ fontSize: 11, fill: "#9ca3af" }}
              tickLine={false}
              axisLine={false}
              width={48}
            />
            {/* 基準線 100% */}
            <ReferenceLine
              y={100}
              stroke="#d1d5db"
              strokeDasharray="4 4"
              strokeWidth={1.5}
              label={{
                value: "±0%",
                position: "insideTopRight",
                fontSize: 10,
                fill: "#9ca3af",
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
              iconType="circle"
              iconSize={8}
            />
            <Line
              type="monotone"
              dataKey="客数"
              stroke="#ea580c"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0 }}
            />
            <Line
              type="monotone"
              dataKey="客単価"
              stroke="#7c3aed"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
