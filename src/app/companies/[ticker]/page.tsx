import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getCompanyByTicker, getMonthlySalesByCompanyId } from "@/lib/db";
import {
  sectorLabel,
  sectorBadgeClass,
  fiscalMonthLabel,
  formatYM,
  formatYoY,
  yoyColorClass,
} from "@/lib/format";
import SalesCharts from "@/components/SalesCharts";
import MonthlyDataTable from "@/components/MonthlyDataTable";

export const dynamic = "force-dynamic";

interface PageProps {
  params: { ticker: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const company = await getCompanyByTicker(params.ticker);
  if (!company) return { title: "企業が見つかりません" };
  return {
    title: `[${company.ticker_code}] ${company.name}`,
    description: `${company.name}（${company.ticker_code}）の月次売上速報データ。前年比推移グラフと月別詳細データ。`,
  };
}

export default async function CompanyDetailPage({ params }: PageProps) {
  const [company, sales] = await Promise.all([
    getCompanyByTicker(params.ticker),
    // ID取得前に ticker で会社を見つける必要があるため直列取得
    getCompanyByTicker(params.ticker).then((c) =>
      c ? getMonthlySalesByCompanyId(c.id) : []
    ),
  ]);

  if (!company) notFound();

  // 直近月
  const latestSale = [...sales].sort(
    (a, b) =>
      b.sales_year !== a.sales_year
        ? b.sales_year - a.sales_year
        : b.sales_month - a.sales_month
  )[0];

  return (
    <div>
      {/* パンくずリスト */}
      <nav className="flex items-center gap-1.5 text-xs text-gray-400 mb-5">
        <Link href="/" className="hover:text-gray-600 transition-colors">
          銘柄一覧
        </Link>
        <span>/</span>
        <span className="text-gray-600">{company.ticker_code}</span>
      </nav>

      {/* ── 企業ヘッダー ──────────────────────────────────────────────── */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          {/* 基本情報 */}
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="font-mono text-2xl font-bold text-gray-900">
                {company.ticker_code}
              </span>
              <span
                className={`text-xs px-2.5 py-1 rounded-full font-medium ${sectorBadgeClass(
                  company.sector
                )}`}
              >
                {sectorLabel(company.sector)}
              </span>
              {company.sub_sector && (
                <span className="text-xs text-gray-400 border border-gray-200 px-2 py-0.5 rounded">
                  {company.sub_sector}
                </span>
              )}
            </div>
            <h1 className="text-xl font-bold text-gray-900 mt-2">
              {company.name}
            </h1>
            {company.name_kana && (
              <p className="text-xs text-gray-400 mt-0.5">{company.name_kana}</p>
            )}
            <p className="text-sm text-gray-500 mt-2">
              東証プライム｜{fiscalMonthLabel(company.fiscal_month)}
            </p>
          </div>

          {/* 直近月サマリー */}
          {latestSale && (
            <div className="bg-gray-50 rounded-lg border border-gray-100 p-4 min-w-[220px]">
              <p className="text-xs text-gray-400 mb-2">
                直近月：{formatYM(latestSale.sales_year, latestSale.sales_month)}
              </p>
              <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
                {[
                  { label: "既存店売上", value: latestSale.existing_sales_yoy },
                  { label: "全社売上", value: latestSale.total_sales_yoy },
                  { label: "客数", value: latestSale.customer_count_yoy },
                  { label: "客単価", value: latestSale.spend_per_customer_yoy },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-[10px] text-gray-400">{label}</p>
                    <p className={`text-sm font-semibold tabular-nums ${yoyColorClass(value)}`}>
                      {formatYoY(value)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── グラフセクション ───────────────────────────────────────────── */}
      <div className="mb-2">
        <h2 className="text-base font-semibold text-gray-800 mb-4">
          月次推移グラフ
        </h2>
        {sales.length > 0 ? (
          <SalesCharts sales={sales} />
        ) : (
          <div className="bg-gray-50 rounded-lg border border-gray-200 p-12 text-center text-gray-400 text-sm">
            データがありません
          </div>
        )}
      </div>

      {/* ── データテーブルセクション ───────────────────────────────────── */}
      <div className="mt-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-800">
            月次データ一覧
          </h2>
          <span className="text-xs text-gray-400">
            {sales.length}件 /{" "}
            {sales.length > 0 &&
              `${formatYM(
                Math.min(...sales.map((s) => s.sales_year)),
                sales.find(
                  (s) =>
                    s.sales_year === Math.min(...sales.map((x) => x.sales_year))
                )!.sales_month
              )} 〜 ${formatYM(latestSale?.sales_year ?? 0, latestSale?.sales_month ?? 0)}`}
          </span>
        </div>
        {sales.length > 0 ? (
          <MonthlyDataTable sales={sales} />
        ) : (
          <div className="text-center py-8 text-gray-400 text-sm">
            データがありません
          </div>
        )}
      </div>

      {/* 注釈 */}
      <p className="mt-6 text-xs text-gray-400">
        ※ 数値は速報値のため後日修正される場合があります。前年比は 100 を基準とします（103.5 = +3.5%）。
      </p>
    </div>
  );
}
