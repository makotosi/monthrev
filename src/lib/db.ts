/**
 * データ取得レイヤー（本番仕様）
 * Supabase から直接フェッチします。
 * NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY が必須です。
 */
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { Company, CompanyRankingRow, MonthlySale } from "./types";

// ─── Supabase クライアント（モジュールレベルシングルトン）────────────────────
let _client: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (_client) return _client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      [
        "Supabase 環境変数が設定されていません。",
        "プロジェクトルートに .env.local を作成し、以下を設定してください:",
        "  NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co",
        "  NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key",
        "",
        "ローカル開発の場合は `supabase start` 後に",
        "  NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321",
        "  NEXT_PUBLIC_SUPABASE_ANON_KEY=（supabase status で確認）",
      ].join("\n")
    );
  }

  _client = createClient(url, key);
  return _client;
}

// ─── ダッシュボード用：全社の直近月データをランキング順に取得 ────────────────
export async function getCompanyRanking(): Promise<CompanyRankingRow[]> {
  const supabase = getClient();

  const { data, error } = await supabase
    .from("monthly_sales")
    .select("*, companies(*)")
    .order("sales_year", { ascending: false })
    .order("sales_month", { ascending: false });

  if (error) {
    throw new Error(`月次データ取得エラー: ${error.message} (code: ${error.code})`);
  }

  // 企業ごとに最新の1件だけ残す
  const latestByCompany = new Map<string, (typeof data)[number]>();
  for (const row of data ?? []) {
    if (!latestByCompany.has(row.company_id)) {
      latestByCompany.set(row.company_id, row);
    }
  }

  return Array.from(latestByCompany.values())
    .map((row) => ({
      id: row.companies.id as string,
      ticker_code: row.companies.ticker_code as string,
      name: row.companies.name as string,
      sector: row.companies.sector as CompanyRankingRow["sector"],
      sub_sector: row.companies.sub_sector as string | null,
      sales_year: row.sales_year as number,
      sales_month: row.sales_month as number,
      total_sales_yoy: row.total_sales_yoy as number | null,
      existing_sales_yoy: row.existing_sales_yoy as number | null,
      customer_count_yoy: row.customer_count_yoy as number | null,
      spend_per_customer_yoy: row.spend_per_customer_yoy as number | null,
    }))
    .sort(
      (a, b) => (b.existing_sales_yoy ?? 0) - (a.existing_sales_yoy ?? 0)
    );
}

// ─── 企業詳細：銘柄コードから企業情報を取得 ──────────────────────────────────
export async function getCompanyByTicker(
  ticker: string
): Promise<Company | null> {
  const supabase = getClient();

  const { data, error } = await supabase
    .from("companies")
    .select("*")
    .eq("ticker_code", ticker)
    .single();

  // PGRST116 = 該当行なし（not found）は正常系
  if (error && error.code !== "PGRST116") {
    throw new Error(`企業データ取得エラー: ${error.message} (code: ${error.code})`);
  }

  return (data as Company) ?? null;
}

// ─── 企業詳細：全月次データを昇順で取得 ──────────────────────────────────────
export async function getMonthlySalesByCompanyId(
  companyId: string
): Promise<MonthlySale[]> {
  const supabase = getClient();

  const { data, error } = await supabase
    .from("monthly_sales")
    .select("*")
    .eq("company_id", companyId)
    .order("sales_year", { ascending: true })
    .order("sales_month", { ascending: true });

  if (error) {
    throw new Error(`月次データ取得エラー: ${error.message} (code: ${error.code})`);
  }

  return (data as MonthlySale[]) ?? [];
}
