import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-32 text-center">
      <p className="text-4xl font-bold text-gray-200 mb-4">404</p>
      <h2 className="text-lg font-semibold text-gray-700 mb-2">
        ページが見つかりません
      </h2>
      <p className="text-sm text-gray-400 mb-8">
        指定された銘柄コードは登録されていないか、URLが誤っている可能性があります。
      </p>
      <Link
        href="/"
        className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
      >
        ← 銘柄一覧に戻る
      </Link>
    </div>
  );
}
