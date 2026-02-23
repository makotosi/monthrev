import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "月次売上.com | 東証プライム 月次売上速報",
    template: "%s | 月次売上.com",
  },
  description:
    "東証プライム上場の小売・飲食企業の月次売上高（前年同月比）をリアルタイムで追跡。株式投資家向けデータサービス。",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className={inter.className}>
        {/* ヘッダー */}
        <header className="sticky top-0 z-20 bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-14">
              <Link href="/" className="flex items-center gap-3">
                <span className="text-lg font-bold tracking-tight text-slate-900">
                  月次売上.com
                </span>
                <span className="hidden sm:inline-block text-xs text-gray-400 border border-gray-200 rounded px-1.5 py-0.5">
                  東証プライム
                </span>
              </Link>
              <nav className="flex items-center gap-6 text-sm text-gray-500">
                <Link href="/" className="hover:text-gray-900 transition-colors">
                  銘柄一覧
                </Link>
                <Link
                  href="/admin"
                  className="hover:text-gray-900 transition-colors flex items-center gap-1"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0 0 20.25 18V6A2.25 2.25 0 0 0 18 3.75H6A2.25 2.25 0 0 0 3.75 6v12A2.25 2.25 0 0 0 6 20.25Z" />
                  </svg>
                  <span className="hidden sm:inline">CSVインポート</span>
                </Link>
              </nav>
            </div>
          </div>
        </header>

        {/* メインコンテンツ */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>

        {/* フッター */}
        <footer className="mt-16 border-t border-gray-100 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-xs text-gray-400 text-center">
              掲載データは速報値であり、正確性を保証するものではありません。
              投資判断はご自身の責任で行ってください。
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
