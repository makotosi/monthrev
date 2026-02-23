-- ============================================================
-- 月次売り上げドットコム — 初期スキーマ
-- ============================================================

-- 拡張機能
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- companies テーブル
-- ============================================================
CREATE TABLE IF NOT EXISTS companies (
    id            UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticker_code   CHAR(4)     NOT NULL UNIQUE,          -- 銘柄コード（4桁）
    name          VARCHAR(100) NOT NULL,                 -- 企業名
    name_kana     VARCHAR(100),                          -- 企業名カナ
    sector        VARCHAR(50)  NOT NULL,                 -- セクター（retail / restaurant）
    sub_sector    VARCHAR(100),                          -- サブセクター（スーパー、居酒屋 など）
    listing_market VARCHAR(20) NOT NULL DEFAULT 'prime', -- 上場市場
    fiscal_month  SMALLINT    NOT NULL DEFAULT 3        -- 決算月（3 = 3月決算）
        CHECK (fiscal_month BETWEEN 1 AND 12),
    website_url   TEXT,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE companies IS '東証プライム上場企業マスター';
COMMENT ON COLUMN companies.ticker_code   IS '銘柄コード（4桁数字）';
COMMENT ON COLUMN companies.sector        IS 'retail（小売）または restaurant（飲食）';
COMMENT ON COLUMN companies.fiscal_month  IS '決算月（1〜12）';

-- ============================================================
-- monthly_sales テーブル
-- ============================================================
CREATE TABLE IF NOT EXISTS monthly_sales (
    id                UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id        UUID        NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

    -- 対象年月
    sales_year        SMALLINT    NOT NULL CHECK (sales_year >= 2000),
    sales_month       SMALLINT    NOT NULL CHECK (sales_month BETWEEN 1 AND 12),

    -- 全社ベース（YoY %、前年同月比。NULL = 未発表）
    total_sales_yoy   NUMERIC(6,2),   -- 全社売上高 前年比（%）
    existing_sales_yoy NUMERIC(6,2),  -- 既存店売上高 前年比（%）
    customer_count_yoy NUMERIC(6,2),  -- 既存店客数 前年比（%）
    spend_per_customer_yoy NUMERIC(6,2), -- 既存店客単価 前年比（%）

    -- 補足情報
    store_count       SMALLINT,        -- 月末店舗数
    new_stores        SMALLINT DEFAULT 0, -- 当月新規出店数
    closed_stores     SMALLINT DEFAULT 0, -- 当月閉店数
    notes             TEXT,              -- 特記事項（例：閏年効果、天候影響）

    -- データソース管理
    reported_at       DATE,             -- 速報発表日
    source_url        TEXT,             -- IR資料URL

    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- 同一企業・同一年月のデータは1件のみ
    UNIQUE (company_id, sales_year, sales_month)
);

COMMENT ON TABLE monthly_sales IS '月次売上速報データ';
COMMENT ON COLUMN monthly_sales.total_sales_yoy         IS '全社売上高 前年同月比（%、例: 103.5 = +3.5%）';
COMMENT ON COLUMN monthly_sales.existing_sales_yoy      IS '既存店売上高 前年同月比（%）';
COMMENT ON COLUMN monthly_sales.customer_count_yoy      IS '既存店客数 前年同月比（%）';
COMMENT ON COLUMN monthly_sales.spend_per_customer_yoy  IS '既存店客単価 前年同月比（%）';

-- ============================================================
-- インデックス
-- ============================================================
-- 企業×年月の時系列クエリ（最頻出）
CREATE INDEX idx_monthly_sales_company_ym
    ON monthly_sales (company_id, sales_year DESC, sales_month DESC);

-- セクター別一覧
CREATE INDEX idx_companies_sector
    ON companies (sector);

-- 最新月のデータ取得（全社横断ダッシュボード）
CREATE INDEX idx_monthly_sales_ym
    ON monthly_sales (sales_year DESC, sales_month DESC);

-- ============================================================
-- updated_at 自動更新トリガー
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_companies_updated_at
    BEFORE UPDATE ON companies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_monthly_sales_updated_at
    BEFORE UPDATE ON monthly_sales
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- Row Level Security（Supabase向け）
-- ============================================================
ALTER TABLE companies     ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_sales ENABLE ROW LEVEL SECURITY;

-- 読み取りは全員に開放（公開サービス）
CREATE POLICY "companies_select_public"
    ON companies FOR SELECT USING (true);

CREATE POLICY "monthly_sales_select_public"
    ON monthly_sales FOR SELECT USING (true);

-- 書き込みはサービスロールのみ（バッチ更新用）
CREATE POLICY "companies_write_service"
    ON companies FOR ALL
    USING (auth.role() = 'service_role');

CREATE POLICY "monthly_sales_write_service"
    ON monthly_sales FOR ALL
    USING (auth.role() = 'service_role');
