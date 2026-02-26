import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

interface ImportRow {
  ticker_code: string;
  sales_year: number;
  sales_month: number;
  total_sales_yoy: number | null;
  existing_sales_yoy: number | null;
  customer_count_yoy: number | null;
  spend_per_customer_yoy: number | null;
  store_count: number | null;
}

interface CompanyRecord {
  id: string;
  ticker_code: string;
}

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "環境変数 SUPABASE_SERVICE_ROLE_KEY が設定されていません。.env.local を確認してください。"
    );
  }
  return createClient(url, key, {
    auth: { persistSession: false },
  });
}

export async function POST(req: NextRequest) {
  let rows: ImportRow[];
  try {
    rows = await req.json();
  } catch {
    return NextResponse.json(
      { error: "リクエストボディが不正です" },
      { status: 400 }
    );
  }

  if (!Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json(
      { error: "インポートするデータがありません" },
      { status: 400 }
    );
  }

  let supabase: ReturnType<typeof getServiceClient>;
  try {
    supabase = getServiceClient();
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }

  // ticker_code → company_id の解決
  const tickers = Array.from(new Set(rows.map((r) => r.ticker_code)));
  const { data: companies, error: companyError } = await supabase
    .from("companies")
    .select("id, ticker_code")
    .in("ticker_code", tickers);

  if (companyError) {
    return NextResponse.json(
      { error: `企業データ取得エラー: ${companyError.message}` },
      { status: 500 }
    );
  }

  const tickerToId = new Map<string, string>(
    ((companies ?? []) as CompanyRecord[]).map((c) => [c.ticker_code.trim(), c.id])
  );

  const unknownTickers = tickers.filter((t) => !tickerToId.has(t));
  if (unknownTickers.length > 0) {
    return NextResponse.json(
      { error: `未登録の銘柄コード: ${unknownTickers.join(", ")}` },
      { status: 422 }
    );
  }

  // monthly_sales へ upsert
  const upsertRows = rows.map((r) => ({
    company_id: tickerToId.get(r.ticker_code)!,
    sales_year: r.sales_year,
    sales_month: r.sales_month,
    total_sales_yoy: r.total_sales_yoy,
    existing_sales_yoy: r.existing_sales_yoy,
    customer_count_yoy: r.customer_count_yoy,
    spend_per_customer_yoy: r.spend_per_customer_yoy,
    store_count: r.store_count,
  }));

  const { error: upsertError } = await supabase
    .from("monthly_sales")
    .upsert(upsertRows, { onConflict: "company_id,sales_year,sales_month" });

  if (upsertError) {
    return NextResponse.json(
      { error: `DB書き込みエラー: ${upsertError.message}` },
      { status: 500 }
    );
  }

  return NextResponse.json({ count: upsertRows.length });
}
