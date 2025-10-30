"use client";

import Link from "next/link";

export default function LegacyStep1Page() {
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-8 px-6 py-12">
      <span className="badge badge-primary self-start">Legacy</span>
      <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">旧ライト診断について</h1>
      <p className="text-base text-muted">
        旧来の 5 問構成によるライト診断は、現在
        <Link href="/diagnose" className="mx-1 font-semibold text-primary">
          /diagnose
        </Link>
        に統合された新しい動的フローへ移行しています。
      </p>
      <section className="rounded-3xl bg-white p-6 shadow">
        <h2 className="text-lg font-semibold text-slate-900">新フローのメリット</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-700">
          <li>ライト／プロの判定を最初の 2 問で自動化し、必要最低限の質問に絞り込み。</li>
          <li>予算レンジを必ずヒアリングし、結果の推奨機体を自動フィルタ。</li>
          <li>回答内容を共有リンクで残せるため、相談・見積もりフローと連携しやすくなりました。</li>
        </ul>
        <Link
          href="/diagnose"
          className="mt-4 inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-sky-500"
        >
          新しい診断を使う
        </Link>
      </section>
      <section className="rounded-3xl bg-slate-50 p-6 text-sm text-slate-700">
        <h2 className="text-base font-semibold text-slate-900">旧データの参照</h2>
        <p className="mt-2">
          過去のライト診断の質問セットやロジックが必要な場合は、Git 履歴で 2025-10-26
          時点の `src/app/step1/page.tsx` と `src/data/questions.step1.json` を参照してください。
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

