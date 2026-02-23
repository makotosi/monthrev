import Link from "next/link";
import { CompanyRankingRow } from "@/lib/types";
import {
  formatYoY,
  formatYM,
  sectorLabel,
  sectorBadgeClass,
  yoyColorClass,
} from "@/lib/format";

interface Props {
  rows: CompanyRankingRow[];
}

function YoYCell({ value }: { value: number | null }) {
  return (
    <span className={yoyColorClass(value)}>
      {formatYoY(value)}
    </span>
  );
}

export default function RankingTable({ rows }: Props) {
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-10">
              #
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
              銘柄
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
              企業名
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">
              セクター
            </th>
            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">
              直近月
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
              既存店売上
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">
              全社売上
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">
              客数
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">
              客単価
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map((row, index) => (
            <tr
              key={row.id}
              className="hover:bg-gray-50 transition-colors"
            >
              {/* ランク */}
              <td className="px-4 py-3.5 text-gray-400 font-mono text-xs">
                {index + 1}
              </td>

              {/* 銘柄コード */}
              <td className="px-4 py-3.5">
                <Link
                  href={`/companies/${row.ticker_code}`}
                  className="font-mono text-blue-600 hover:text-blue-800 hover:underline font-medium"
                >
                  {row.ticker_code}
                </Link>
              </td>

              {/* 企業名 */}
              <td className="px-4 py-3.5">
                <Link
                  href={`/companies/${row.ticker_code}`}
                  className="font-medium text-gray-900 hover:text-blue-700 hover:underline"
                >
                  {row.name}
                </Link>
                {row.sub_sector && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    {row.sub_sector}
                  </p>
                )}
              </td>

              {/* セクター */}
              <td className="px-4 py-3.5 hidden sm:table-cell">
                <span
                  className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${sectorBadgeClass(
                    row.sector
                  )}`}
                >
                  {sectorLabel(row.sector)}
                </span>
              </td>

              {/* 直近月 */}
              <td className="px-4 py-3.5 text-center text-gray-500 text-xs tabular-nums hidden md:table-cell">
                {formatYM(row.sales_year, row.sales_month)}
              </td>

              {/* 既存店売上YoY（ランキング基準） */}
              <td className="px-4 py-3.5 text-right tabular-nums font-medium text-sm">
                <YoYCell value={row.existing_sales_yoy} />
              </td>

              {/* 全社売上YoY */}
              <td className="px-4 py-3.5 text-right tabular-nums hidden lg:table-cell">
                <YoYCell value={row.total_sales_yoy} />
              </td>

              {/* 客数YoY */}
              <td className="px-4 py-3.5 text-right tabular-nums hidden lg:table-cell">
                <YoYCell value={row.customer_count_yoy} />
              </td>

              {/* 客単価YoY */}
              <td className="px-4 py-3.5 text-right tabular-nums hidden sm:table-cell">
                <YoYCell value={row.spend_per_customer_yoy} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
