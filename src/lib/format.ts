/** 前年比(%) → 差分文字列。例: 103.5 → "+3.5%" */
export function formatYoY(value: number | null): string {
  if (value === null || value === undefined) return "—";
  const diff = value - 100;
  const sign = diff >= 0 ? "+" : "";
  return `${sign}${diff.toFixed(1)}%`;
}

/** 前年比の値に応じた Tailwind テキストカラークラス */
export function yoyColorClass(value: number | null): string {
  if (value === null) return "text-gray-400";
  if (value > 100.04) return "text-emerald-600";
  if (value < 99.96) return "text-red-600";
  return "text-gray-500";
}

/** YYYY/MM 形式 */
export function formatYM(year: number, month: number): string {
  return `${year}/${String(month).padStart(2, "0")}`;
}

/** グラフ軸用の短縮形。例: 2024/01 → "24/01" */
export function formatYMShort(year: number, month: number): string {
  return `${String(year).slice(2)}/${String(month).padStart(2, "0")}`;
}

export function sectorLabel(sector: string): string {
  return sector === "restaurant" ? "飲食" : "小売";
}

export function sectorBadgeClass(sector: string): string {
  return sector === "restaurant"
    ? "bg-orange-100 text-orange-700 border border-orange-200"
    : "bg-sky-100 text-sky-700 border border-sky-200";
}

export function fiscalMonthLabel(month: number): string {
  return `${month}月決算`;
}
