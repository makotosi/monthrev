-- 本番企業データ（東証プライム上場3社）
-- initial_real_data.csv のインポート前にこのファイルを実行してください。
-- monthly_sales テーブルに CSV をインポートする際、companies.ticker_code が一致する行が必要です。

INSERT INTO companies (ticker_code, name, name_kana, sector, sub_sector, fiscal_month)
VALUES
  (
    '9983',
    'ファーストリテイリング',
    'ファーストリテイリング',
    'retail',
    'アパレル',
    8
  ),
  (
    '2702',
    '日本マクドナルドホールディングス',
    'ニッポンマクドナルドホールディングス',
    'restaurant',
    'ファストフード',
    12
  ),
  (
    '3197',
    'すかいらーくホールディングス',
    'スカイラークホールディングス',
    'restaurant',
    'ファミリーレストラン',
    12
  )
ON CONFLICT (ticker_code) DO UPDATE SET
  name        = EXCLUDED.name,
  name_kana   = EXCLUDED.name_kana,
  sector      = EXCLUDED.sector,
  sub_sector  = EXCLUDED.sub_sector,
  fiscal_month = EXCLUDED.fiscal_month;
