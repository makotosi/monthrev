import { getCompanyRanking } from "@/lib/db";
import { formatYM } from "@/lib/format";
import RankingTable from "@/components/RankingTable";

// リクエストごとに Supabase から最新データを取得する（ISR不使用）
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const rows = await getCompanyRanking();

  // 直近月（ランキング先頭から取得）
  const latestYM =
    rows.length > 0
      ? formatYM(rows[0].sales_year, rows[0].sales_month)
      : null;

  return (
    <div>
      {/* ページヘッダー */}
      <div className="mb-6">
        <div className="flex items-end justify-between flex-wrap gap-2">
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              月次売上ランキング
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              東証プライム上場の飲食・小売企業の直近月次売上速報
            </p>
          </div>
          {latestYM && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">最新データ</span>
              <span className="text-sm font-semibold text-gray-700 bg-gray-100 px-2.5 py-1 rounded">
                {latestYM}
              </span>
            </div>
          )}
        </div>

        {/* 凡例 */}
        <div className="flex items-center gap-4 mt-4 text-xs text-gray-400">
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
            前年比プラス
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-red-500" />
            前年比マイナス
          </div>
          <span className="hidden sm:inline">
            「既存店売上」の高い順に並べています
          </span>
        </div>
      </div>

      {/* ランキングテーブル */}
      {rows.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          データがありません
        </div>
      ) : (
        <RankingTable rows={rows} />
      )}

      {/* 注釈 */}
      <p className="mt-4 text-xs text-gray-400">
        ※ YoY（前年同月比）は 100 を基準とし、例えば +3.5% = 103.5、-1.8% = 98.2
        を表します。数値は速報値のため後日修正される場合があります。
      </p>
    </div>
  );
}
