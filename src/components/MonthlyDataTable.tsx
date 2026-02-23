import { MonthlySale } from "@/lib/types";
import { formatYM, formatYoY, yoyColorClass } from "@/lib/format";

interface Props {
  sales: MonthlySale[];
}

function YoYTd({ value }: { value: number | null }) {
  return (
    <td className={`px-4 py-2.5 text-right tabular-nums text-sm ${yoyColorClass(value)}`}>
      {formatYoY(value)}
    </td>
  );
}

export default function MonthlyDataTable({ sales }: Props) {
  // 降順（新しい月が上）で表示
  const sorted = [...sales].sort(
    (a, b) =>
      b.sales_year !== a.sales_year
        ? b.sales_year - a.sales_year
        : b.sales_month - a.sales_month
  );

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
              年月
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
              既存店売上
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
              全社売上
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
              客数
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
              客単価
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">
              店舗数
            </th>
            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">
              発表日
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {sorted.map((sale) => (
            <tr key={sale.id} className="hover:bg-gray-50 transition-colors">
              {/* 年月 */}
              <td className="px-4 py-2.5 font-mono text-gray-700 font-medium text-sm">
                {formatYM(sale.sales_year, sale.sales_month)}
              </td>

              {/* YoY 各列 */}
              <YoYTd value={sale.existing_sales_yoy} />
              <YoYTd value={sale.total_sales_yoy} />
              <YoYTd value={sale.customer_count_yoy} />
              <YoYTd value={sale.spend_per_customer_yoy} />

              {/* 店舗数 */}
              <td className="px-4 py-2.5 text-right text-gray-500 tabular-nums hidden sm:table-cell">
                {sale.store_count !== null
                  ? `${sale.store_count.toLocaleString()}店`
                  : "—"}
              </td>

              {/* 発表日 */}
              <td className="px-4 py-2.5 text-center text-gray-400 text-xs hidden md:table-cell">
                {sale.reported_at ?? "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
