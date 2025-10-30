"use client";

import Link from "next/link";

export default function LegacyStep2Page() {
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-8 px-6 py-12">
      <span className="badge badge-primary self-start">Legacy</span>
      <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">旧プロ診断について</h1>
      <p className="text-base text-muted">
        こちらのページで提供していた 10 問構成のプロ診断は、現在
        <Link href="/diagnose" className="mx-1 font-semibold text-primary">
          /diagnose
        </Link>
        に統合された新しい動的診断フローへ移行しました。
      </p>
      <section className="rounded-3xl bg-white p-6 shadow">
        <h2 className="text-lg font-semibold text-slate-900">新フローのポイント</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-700">
          <li>最初の 2 問でライト / プロモードを自動判定し、必要な質問だけを出題します。</li>
          <li>ライト層は最短 3 問、産業用途でも最大 7 問で診断が完了します。</li>
          <li>予算レンジやセンサー要件を元に機体候補を自動フィルタし、共有リンクも発行できます。</li>
        </ul>
        <Link
          href="/diagnose"
          className="mt-4 inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-sky-500"
        >
          新しい診断を使う
        </Link>
      </section>
      <section className="rounded-3xl bg-slate-50 p-6 text-sm text-slate-700">
        <h2 className="text-base font-semibold text-slate-900">旧フローのアーカイブ</h2>
        <p className="mt-2">
          過去の診断結果を参照する必要がある場合は、Git 履歴から 2025-10-26
          時点の `src/app/step2/page.tsx` を確認してください。
        </p>
      </section>
      <div className="flex flex-wrap gap-3">
        <Link
          href="/diagnose"
          className="rounded-full border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-primary hover:text-primary"
        >
          診断トップへ
        </Link>
        <Link
          href="/"
          className="rounded-full border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-primary hover:text-primary"
        >
          ランディングへ戻る
        </Link>
      </div>
    </main>
  );
}

