"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const isEnvError =
    error.message.includes("環境変数") ||
    error.message.includes("SUPABASE");

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-lg w-full">
        <div className="rounded-lg border border-red-200 bg-red-50 p-6">
          <div className="flex items-start gap-3">
            <svg
              className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
              />
            </svg>
            <div className="flex-1">
              <h2 className="font-semibold text-red-800 text-base">
                {isEnvError ? "Supabase 接続設定が必要です" : "エラーが発生しました"}
              </h2>

              {isEnvError ? (
                <div className="mt-3 space-y-3">
                  <p className="text-sm text-red-700">
                    データベースへの接続情報が設定されていません。
                    以下の手順で設定してください。
                  </p>
                  <div className="bg-white rounded border border-red-200 p-3">
                    <p className="text-xs font-semibold text-gray-700 mb-2">
                      .env.local を作成し、以下を追記:
                    </p>
                    <pre className="text-xs font-mono text-gray-600 whitespace-pre-wrap leading-relaxed">
                      {`NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321\nNEXT_PUBLIC_SUPABASE_ANON_KEY=<supabase status で確認>`}
                    </pre>
                  </div>
                  <p className="text-xs text-red-600">
                    ローカル開発の場合は <code className="bg-red-100 px-1 rounded">supabase start</code> を先に実行してください。
                  </p>
                </div>
              ) : (
                <p className="mt-2 text-sm text-red-700 font-mono break-all">
                  {error.message}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-4">
          <button
            onClick={reset}
            className="text-sm bg-white border border-gray-300 rounded-lg px-4 py-2 hover:bg-gray-50 transition-colors"
          >
            再試行
          </button>
          <Link href="/" className="text-sm text-blue-600 hover:underline">
            ← トップに戻る
          </Link>
        </div>
      </div>
    </div>
  );
}
