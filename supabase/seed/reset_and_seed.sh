#!/usr/bin/env bash
# ============================================================
# ローカル開発用：DBリセット＆シード投入スクリプト
# ============================================================
set -euo pipefail

# --- 接続先の設定（環境変数または引数で上書き可能）---
DB_URL="${DATABASE_URL:-postgresql://postgres:postgres@localhost:54322/postgres}"

echo "接続先: $DB_URL"
echo ""

# --- スキーマ適用 ---
echo ">>> [1/3] スキーマ適用中..."
psql "$DB_URL" -f "$(dirname "$0")/../migrations/20240101000000_initial_schema.sql"

# --- 企業マスター ---
echo ">>> [2/3] 企業マスター投入中..."
psql "$DB_URL" -f "$(dirname "$0")/001_companies.sql"

# --- 月次売上データ ---
echo ">>> [3/3] 月次売上データ投入中..."
psql "$DB_URL" -f "$(dirname "$0")/002_monthly_sales.sql"

# --- 確認クエリ ---
echo ""
echo "=== 投入結果確認 ==="
psql "$DB_URL" -c "
SELECT
    c.ticker_code AS 銘柄,
    c.name        AS 企業名,
    c.sector      AS セクター,
    COUNT(ms.id)  AS 月次データ件数
FROM companies c
LEFT JOIN monthly_sales ms ON ms.company_id = c.id
GROUP BY c.id, c.ticker_code, c.name, c.sector
ORDER BY c.ticker_code;
"

echo ""
echo "完了！"
