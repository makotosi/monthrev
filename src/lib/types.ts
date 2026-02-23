export type Sector = "retail" | "restaurant";

export interface Company {
  id: string;
  ticker_code: string;
  name: string;
  name_kana: string | null;
  sector: Sector;
  sub_sector: string | null;
  listing_market: string;
  fiscal_month: number;
  website_url: string | null;
}

export interface MonthlySale {
  id: string;
  company_id: string;
  sales_year: number;
  sales_month: number;
  total_sales_yoy: number | null;
  existing_sales_yoy: number | null;
  customer_count_yoy: number | null;
  spend_per_customer_yoy: number | null;
  store_count: number | null;
  new_stores: number | null;
  closed_stores: number | null;
  notes: string | null;
  reported_at: string | null;
}

// ダッシュボード用（直近月データ付き）
export interface CompanyRankingRow {
  id: string;
  ticker_code: string;
  name: string;
  sector: Sector;
  sub_sector: string | null;
  sales_year: number;
  sales_month: number;
  total_sales_yoy: number | null;
  existing_sales_yoy: number | null;
  customer_count_yoy: number | null;
  spend_per_customer_yoy: number | null;
}
