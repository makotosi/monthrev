-- ============================================================
-- シード一括実行スクリプト
-- 使い方：psql $DATABASE_URL -f supabase/seed/000_run_all.sql
-- ============================================================
\echo '=== [1/3] スキーマ適用 ==='
\i supabase/migrations/20240101000000_initial_schema.sql

\echo '=== [2/3] 企業マスター投入 ==='
\i supabase/seed/001_companies.sql

\echo '=== [3/3] 月次売上データ投入 ==='
\i supabase/seed/002_monthly_sales.sql

\echo '=== 完了 ==='
SELECT
    c.ticker_code,
    c.name,
    c.sector,
    COUNT(ms.id) AS months_count
FROM companies c
LEFT JOIN monthly_sales ms ON ms.company_id = c.id
GROUP BY c.id, c.ticker_code, c.name, c.sector
ORDER BY c.ticker_code;
