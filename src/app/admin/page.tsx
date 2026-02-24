"use client";

import { useState, useCallback, useRef, DragEvent } from "react";
import Papa from "papaparse";
import Link from "next/link";

// ─── CSV列定義 ─────────────────────────────────────────────────────────────────
const CSV_COLUMNS = [
  {
    key: "ticker_code",
    label: "銘柄コード",
    type: "文字列",
    required: true,
    example: "3001",
    note: "4桁の銘柄コード",
  },
  {
    key: "sales_year",
    label: "年",
    type: "整数",
    required: true,
    example: "2026",
    note: "西暦年",
  },
  {
    key: "sales_month",
    label: "月",
    type: "整数",
    required: true,
    example: "1",
    note: "1〜12",
  },
  {
    key: "total_sales_yoy",
    label: "全社売上YoY",
    type: "数値",
    required: true,
    example: "103.5",
    note: "100=前年同月比フラット",
  },
  {
    key: "existing_sales_yoy",
    label: "既存店売上YoY",
    type: "数値",
    required: true,
    example: "101.8",
    note: "",
  },
  {
    key: "customer_count_yoy",
    label: "客数YoY",
    type: "数値",
    required: true,
    example: "98.5",
    note: "",
  },
  {
    key: "spend_per_customer_yoy",
    label: "客単価YoY",
    type: "数値",
    required: true,
    example: "103.4",
    note: "",
  },
  {
    key: "store_count",
    label: "店舗数",
    type: "整数",
    required: false,
    example: "340",
    note: "月末店舗数（省略可）",
  },
] as const;

const REQUIRED_KEYS = CSV_COLUMNS.filter((c) => c.required).map((c) => c.key);

const SAMPLE_CSV_TEXT = [
  "ticker_code,sales_year,sales_month,total_sales_yoy,existing_sales_yoy,customer_count_yoy,spend_per_customer_yoy,store_count",
  "3001,2026,1,103.5,101.8,98.5,103.4,340",
  "3002,2026,1,102.1,99.8,95.2,104.8,608",
  "8001,2026,1,105.2,103.8,99.1,104.8,234",
  "8002,2026,1,108.3,105.9,102.1,103.7,962",
].join("\n");

// ─── 型 ───────────────────────────────────────────────────────────────────────
interface ParsedRow {
  ticker_code: string;
  sales_year: number;
  sales_month: number;
  total_sales_yoy: number | null;
  existing_sales_yoy: number | null;
  customer_count_yoy: number | null;
  spend_per_customer_yoy: number | null;
  store_count: number | null;
  _rowErrors: string[];
}

type ImportStatus = "idle" | "ready" | "importing" | "success" | "error";

// ─── ユーティリティ ──────────────────────────────────────────────────────────
function toFloat(v: string | undefined): number | null {
  if (!v || v.trim() === "" || v.trim() === "-") return null;
  const n = parseFloat(v.trim());
  return isNaN(n) ? null : n;
}

function toInt(v: string | undefined): number | null {
  if (!v || v.trim() === "") return null;
  const n = parseInt(v.trim(), 10);
  return isNaN(n) ? null : n;
}

function fmtYoY(v: number | null): string {
  if (v === null) return "—";
  const d = v - 100;
  return `${d >= 0 ? "+" : ""}${d.toFixed(1)}%`;
}

function yoyClass(v: number | null): string {
  if (v === null) return "text-gray-400";
  if (v > 100.04) return "text-emerald-600 font-medium";
  if (v < 99.96) return "text-red-600 font-medium";
  return "text-gray-500";
}

function processRawRows(
  rawRows: Record<string, string>[]
): { rows: ParsedRow[]; missingCols: string[] } {
  if (rawRows.length === 0) return { rows: [], missingCols: [] };

  const presentKeys = Object.keys(rawRows[0]);
  const missingCols = REQUIRED_KEYS.filter((k) => !presentKeys.includes(k));
  if (missingCols.length > 0) return { rows: [], missingCols };

  const rows = rawRows.map((raw) => {
    const errors: string[] = [];

    const ticker_code = raw.ticker_code?.trim() ?? "";
    if (!ticker_code) errors.push("銘柄コードが空");

    const sales_year = toInt(raw.sales_year) ?? 0;
    if (sales_year < 2000 || sales_year > 2100) errors.push("年が不正（2000〜2100）");

    const sales_month = toInt(raw.sales_month) ?? 0;
    if (sales_month < 1 || sales_month > 12) errors.push("月が1〜12の範囲外");

    const total_sales_yoy = toFloat(raw.total_sales_yoy);
    const existing_sales_yoy = toFloat(raw.existing_sales_yoy);
    const customer_count_yoy = toFloat(raw.customer_count_yoy);
    const spend_per_customer_yoy = toFloat(raw.spend_per_customer_yoy);

    if (total_sales_yoy === null) errors.push("全社売上YoYが無効");
    if (existing_sales_yoy === null) errors.push("既存店売上YoYが無効");

    return {
      ticker_code,
      sales_year,
      sales_month,
      total_sales_yoy,
      existing_sales_yoy,
      customer_count_yoy,
      spend_per_customer_yoy,
      store_count: toInt(raw.store_count),
      _rowErrors: errors,
    };
  });

  return { rows, missingCols: [] };
}

// ─── サンプルCSVダウンロード ─────────────────────────────────────────────────
function downloadSampleCsv() {
  const blob = new Blob([SAMPLE_CSV_TEXT], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "monthly_sales_sample.csv";
  a.click();
  URL.revokeObjectURL(url);
}

// ─── アイコン（SVG inline）────────────────────────────────────────────────────
function IconUpload() {
  return (
    <svg className="w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
    </svg>
  );
}

function IconCheck() {
  return (
    <svg className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
    </svg>
  );
}

function IconWarning() {
  return (
    <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
    </svg>
  );
}

function IconFile() {
  return (
    <svg className="w-4 h-4 text-blue-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
    </svg>
  );
}

// ─── ステップバッジ ──────────────────────────────────────────────────────────
function StepBadge({ n, active }: { n: number; active: boolean }) {
  return (
    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold mr-2 ${
      active ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-500"
    }`}>
      {n}
    </span>
  );
}

// ─── メインコンポーネント ─────────────────────────────────────────────────────
export default function AdminImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [missingCols, setMissingCols] = useState<string[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [status, setStatus] = useState<ImportStatus>("idle");
  const [importedCount, setImportedCount] = useState(0);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validRows = parsedRows.filter((r) => r._rowErrors.length === 0);
  const errorRows = parsedRows.filter((r) => r._rowErrors.length > 0);
  const hasPreview = parsedRows.length > 0;

  // ── ファイル処理 ────────────────────────────────────────────────────────
  const handleFile = useCallback((f: File) => {
    if (!f.name.endsWith(".csv") && f.type !== "text/csv") {
      setParseError("CSVファイル（.csv）を選択してください");
      return;
    }
    setFile(f);
    setParseError(null);
    setMissingCols([]);
    setParsedRows([]);
    setStatus("idle");

    Papa.parse<Record<string, string>>(f, {
      header: true,
      skipEmptyLines: true,
      complete(results) {
        if (results.errors.length > 0 && results.data.length === 0) {
          setParseError(`CSVパースエラー: ${results.errors[0].message}`);
          return;
        }
        const { rows, missingCols } = processRawRows(results.data);
        if (missingCols.length > 0) {
          setMissingCols(missingCols);
          setParseError(`必須列が不足しています: ${missingCols.join(", ")}`);
          return;
        }
        setParsedRows(rows);
        setStatus("ready");
      },
      error(err) {
        setParseError(`ファイル読み込み失敗: ${err.message}`);
      },
    });
  }, []);

  // ── ドラッグ＆ドロップ ────────────────────────────────────────────────
  const onDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const onDragLeave = () => setIsDragging(false);
  const onDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      const f = e.dataTransfer.files[0];
      if (f) handleFile(f);
    },
    [handleFile]
  );

  // ── インポート実行 ─────────────────────────────────────────────────
  const handleImport = useCallback(async () => {
    if (validRows.length === 0) return;
    setStatus("importing");
    setImportError(null);

    try {
      const res = await fetch("/api/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validRows),
      });
      const json = await res.json();

      if (!res.ok) {
        setImportError(json.error ?? "インポートに失敗しました");
        setStatus("error");
        return;
      }

      setImportedCount(json.count);
      setStatus("success");
    } catch (e) {
      setImportError(
        e instanceof Error ? e.message : "ネットワークエラーが発生しました"
      );
      setStatus("error");
    }
  }, [validRows]);

  // ── リセット ────────────────────────────────────────────────────────
  const handleReset = () => {
    setFile(null);
    setParsedRows([]);
    setMissingCols([]);
    setParseError(null);
    setStatus("idle");
    setImportError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div>
      {/* パンくず */}
      <nav className="flex items-center gap-1.5 text-xs text-gray-400 mb-5">
        <Link href="/" className="hover:text-gray-600 transition-colors">
          銘柄一覧
        </Link>
        <span>/</span>
        <span className="text-gray-600">管理者用インポート</span>
      </nav>

      {/* 管理者警告バナー */}
      <div className="mb-6 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 flex items-start gap-3">
        <svg className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
        </svg>
        <div className="text-sm">
          <p className="font-semibold text-amber-800">管理者専用ページ</p>
          <p className="text-amber-700 mt-0.5">
            インポートを実行すると、データベースへ直接書き込みが行われます。
            操作は慎重に行ってください。
          </p>
        </div>
      </div>

      {/* ページタイトル */}
      <h1 className="text-xl font-bold text-gray-900 mb-8">
        月次データ CSVインポート（管理者用）
      </h1>

      {/* ── メインレイアウト（左：操作エリア / 右：フォーマットガイド） ── */}
      <div className="lg:grid lg:grid-cols-[1fr_380px] gap-8 items-start">

        {/* ───────────────── 左：操作エリア ───────────────────────────── */}
        <div className="space-y-6">

          {/* STEP 1：ファイル選択 */}
          <section className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <h2 className="text-sm font-semibold text-gray-800 mb-4">
              <StepBadge n={1} active={status === "idle"} />
              CSVファイルを選択
            </h2>

            {/* ドロップゾーン */}
            <div
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-xl py-12 px-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-150 ${
                isDragging
                  ? "border-blue-400 bg-blue-50"
                  : file
                  ? "border-blue-300 bg-blue-50/50"
                  : "border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-white"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                className="sr-only"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                }}
              />

              {file ? (
                <div className="flex items-center gap-2">
                  <IconFile />
                  <span className="text-sm font-medium text-gray-700">{file.name}</span>
                  <span className="text-xs text-gray-400">
                    ({(file.size / 1024).toFixed(1)} KB)
                  </span>
                </div>
              ) : (
                <>
                  <IconUpload />
                  <p className="mt-3 text-sm font-medium text-gray-600">
                    クリックしてCSVを選択
                  </p>
                  <p className="mt-1 text-xs text-gray-400">
                    またはここにファイルをドラッグ＆ドロップ
                  </p>
                  <p className="mt-2 text-xs text-gray-300">.csv のみ対応</p>
                </>
              )}
            </div>

            {/* パースエラー */}
            {parseError && (
              <div className="mt-3 rounded-lg bg-red-50 border border-red-200 p-3 flex items-start gap-2">
                <IconWarning />
                <div className="text-sm text-red-700">
                  <p className="font-semibold">読み込みエラー</p>
                  <p className="mt-0.5">{parseError}</p>
                  {missingCols.length > 0 && (
                    <ul className="mt-1 list-disc list-inside text-xs text-red-600">
                      {missingCols.map((c) => (
                        <li key={c}>不足: <code className="font-mono bg-red-100 px-1 rounded">{c}</code></li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}

            {/* ファイル変更ボタン */}
            {file && (
              <button
                onClick={(e) => { e.stopPropagation(); handleReset(); }}
                className="mt-3 text-xs text-gray-400 hover:text-gray-600 underline"
              >
                別のファイルを選択
              </button>
            )}
          </section>

          {/* STEP 2：プレビュー */}
          {hasPreview && (
            <section className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-gray-800">
                  <StepBadge n={2} active={status === "ready"} />
                  データプレビュー
                </h2>
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-emerald-600 font-medium">
                    ✓ 取込可能 {validRows.length}件
                  </span>
                  {errorRows.length > 0 && (
                    <span className="text-red-600 font-medium">
                      ✗ エラー {errorRows.length}件
                    </span>
                  )}
                </div>
              </div>

              {/* プレビューテーブル */}
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-3 py-2.5 text-left font-semibold text-gray-500 uppercase tracking-wider w-8">#</th>
                      <th className="px-3 py-2.5 text-left font-semibold text-gray-500 uppercase tracking-wider">銘柄</th>
                      <th className="px-3 py-2.5 text-center font-semibold text-gray-500 uppercase tracking-wider">年月</th>
                      <th className="px-3 py-2.5 text-right font-semibold text-gray-500 uppercase tracking-wider">既存店売上</th>
                      <th className="px-3 py-2.5 text-right font-semibold text-gray-500 uppercase tracking-wider">全社売上</th>
                      <th className="px-3 py-2.5 text-right font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">客数</th>
                      <th className="px-3 py-2.5 text-right font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">客単価</th>
                      <th className="px-3 py-2.5 text-right font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">店舗数</th>
                      <th className="px-3 py-2.5 text-left font-semibold text-gray-500 uppercase tracking-wider">状態</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {parsedRows.map((row, i) => {
                      const hasError = row._rowErrors.length > 0;
                      return (
                        <tr
                          key={i}
                          className={hasError ? "bg-red-50" : "hover:bg-gray-50"}
                        >
                          <td className="px-3 py-2 text-gray-400 font-mono">{i + 1}</td>
                          <td className="px-3 py-2 font-mono font-medium text-gray-800">
                            {row.ticker_code || <span className="text-red-400">—</span>}
                          </td>
                          <td className="px-3 py-2 text-center text-gray-600 tabular-nums">
                            {row.sales_year}/{String(row.sales_month).padStart(2, "0")}
                          </td>
                          <td className={`px-3 py-2 text-right tabular-nums ${yoyClass(row.existing_sales_yoy)}`}>
                            {fmtYoY(row.existing_sales_yoy)}
                          </td>
                          <td className={`px-3 py-2 text-right tabular-nums ${yoyClass(row.total_sales_yoy)}`}>
                            {fmtYoY(row.total_sales_yoy)}
                          </td>
                          <td className={`px-3 py-2 text-right tabular-nums hidden sm:table-cell ${yoyClass(row.customer_count_yoy)}`}>
                            {fmtYoY(row.customer_count_yoy)}
                          </td>
                          <td className={`px-3 py-2 text-right tabular-nums hidden sm:table-cell ${yoyClass(row.spend_per_customer_yoy)}`}>
                            {fmtYoY(row.spend_per_customer_yoy)}
                          </td>
                          <td className="px-3 py-2 text-right text-gray-500 tabular-nums hidden md:table-cell">
                            {row.store_count !== null ? `${row.store_count}店` : "—"}
                          </td>
                          <td className="px-3 py-2">
                            {hasError ? (
                              <div className="group relative">
                                <span className="inline-flex items-center gap-1 text-red-600 cursor-help">
                                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-8-5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5A.75.75 0 0 1 10 5Zm0 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
                                  </svg>
                                  エラー
                                </span>
                                {/* ツールチップ */}
                                <div className="absolute bottom-full left-0 mb-1 hidden group-hover:block z-10 bg-gray-900 text-white text-xs rounded px-2 py-1.5 w-48 shadow-lg">
                                  {row._rowErrors.join(" / ")}
                                </div>
                              </div>
                            ) : (
                              <span className="text-emerald-600 text-xs">✓ OK</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* エラー行の説明 */}
              {errorRows.length > 0 && (
                <p className="mt-2 text-xs text-red-500">
                  ※ エラー行はスキップされます。エラー列にマウスをホバーすると詳細を確認できます。
                </p>
              )}
            </section>
          )}

          {/* STEP 3：インポート実行 */}
          {hasPreview && (
            <section className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
              <h2 className="text-sm font-semibold text-gray-800 mb-4">
                <StepBadge n={3} active={status === "ready" || status === "importing"} />
                インポート実行
              </h2>

              {/* 成功メッセージ */}
              {status === "success" && (
                <div className="mb-4 rounded-lg bg-emerald-50 border border-emerald-200 p-4 flex items-start gap-3">
                  <IconCheck />
                  <div>
                    <p className="font-semibold text-emerald-800">
                      インポート完了
                    </p>
                    <p className="text-sm text-emerald-700 mt-0.5">
                      {importedCount}件のデータをデータベースに保存しました
                    </p>
                  </div>
                </div>
              )}

              {/* エラーメッセージ */}
              {status === "error" && importError && (
                <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-4 flex items-start gap-3">
                  <IconWarning />
                  <div>
                    <p className="font-semibold text-red-800">インポート失敗</p>
                    <p className="text-sm text-red-700 mt-0.5">{importError}</p>
                  </div>
                </div>
              )}

              {/* インポートボタン */}
              <div className="flex items-center gap-4 flex-wrap">
                <button
                  onClick={handleImport}
                  disabled={
                    status === "importing" ||
                    status === "success" ||
                    validRows.length === 0
                  }
                  className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                    status === "importing"
                      ? "bg-blue-400 text-white cursor-wait"
                      : status === "success"
                      ? "bg-emerald-500 text-white cursor-default"
                      : validRows.length === 0
                      ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                      : status === "error"
                      ? "bg-red-600 text-white hover:bg-red-700 shadow-sm"
                      : "bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
                  }`}
                >
                  {status === "importing" ? (
                    <>
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      処理中...
                    </>
                  ) : status === "success" ? (
                    <>✓ 完了</>
                  ) : status === "error" ? (
                    `再試行（${validRows.length}件）`
                  ) : (
                    `インポート実行（${validRows.length}件）`
                  )}
                </button>

                {status === "success" && (
                  <button
                    onClick={handleReset}
                    className="text-sm text-gray-500 hover:text-gray-700 underline"
                  >
                    別のファイルをインポート
                  </button>
                )}

                {validRows.length === 0 && parsedRows.length > 0 && (
                  <p className="text-xs text-red-500">
                    有効な行が0件のためインポートできません
                  </p>
                )}
              </div>
            </section>
          )}
        </div>

        {/* ───────────────── 右：CSVフォーマットガイド ─────────────────── */}
        <aside className="mt-6 lg:mt-0 space-y-5">

          {/* フォーマット仕様テーブル */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">
              CSVフォーマット仕様
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="pb-2 text-left text-gray-500 font-semibold pr-3">列名</th>
                    <th className="pb-2 text-left text-gray-500 font-semibold pr-3">型</th>
                    <th className="pb-2 text-center text-gray-500 font-semibold pr-3">必須</th>
                    <th className="pb-2 text-left text-gray-500 font-semibold">例 / 説明</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {CSV_COLUMNS.map((col) => (
                    <tr key={col.key}>
                      <td className="py-2 pr-3">
                        <code className="font-mono text-blue-700 bg-blue-50 px-1 rounded text-[11px]">
                          {col.key}
                        </code>
                      </td>
                      <td className="py-2 pr-3 text-gray-500 whitespace-nowrap">{col.type}</td>
                      <td className="py-2 pr-3 text-center">
                        {col.required ? (
                          <span className="text-red-500 font-bold">✓</span>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                      <td className="py-2 text-gray-500">
                        <span className="font-mono text-gray-700">{col.example}</span>
                        {col.note && (
                          <span className="ml-1 text-gray-400">({col.note})</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-xs text-gray-400">
              ※ YoY値は前年同月比（%）。100 = フラット、103.5 = +3.5%
            </p>
          </div>

          {/* サンプルCSV */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-800">サンプル CSV</h3>
              <button
                onClick={downloadSampleCsv}
                className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 border border-blue-200 hover:border-blue-400 rounded px-2.5 py-1 transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
                DL
              </button>
            </div>
            <pre className="text-[11px] font-mono leading-relaxed text-gray-600 bg-gray-50 rounded-lg p-3 overflow-x-auto whitespace-pre">
              {SAMPLE_CSV_TEXT}
            </pre>
            <p className="mt-2 text-xs text-gray-400">
              1行目はヘッダー行（列名）。2行目以降がデータ。
            </p>
          </div>

          {/* 注意事項 */}
          <div className="rounded-lg bg-gray-50 border border-gray-200 p-4">
            <h4 className="text-xs font-semibold text-gray-700 mb-2">注意事項</h4>
            <ul className="text-xs text-gray-500 space-y-1.5">
              <li className="flex items-start gap-1.5">
                <span className="text-gray-400 mt-0.5">•</span>
                同一の銘柄コード＋年月が既存データと重複する場合、
                本番環境では<strong>UPSERT</strong>（上書き更新）されます
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-gray-400 mt-0.5">•</span>
                YoY 値は小数点1位まで有効（例: 103.5）
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-gray-400 mt-0.5">•</span>
                <code className="font-mono bg-gray-200 px-0.5 rounded">store_count</code> など任意列は省略可能
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-gray-400 mt-0.5">•</span>
                文字コードは UTF-8 を推奨
              </li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
