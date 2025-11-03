import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-5xl flex-col items-center justify-center gap-12 px-6 py-16 text-center">
      <div className="flex flex-col gap-6">
        <span className="badge badge-primary self-center">30秒で診断</span>
        <h1 className="text-4xl font-bold sm:text-5xl">
          用途にぴったりの <span className="text-primary">DJI ドローン</span>{" "}
          を見つけましょう
        </h1>
        <p className="mx-auto max-w-2xl text-base text-muted sm:text-lg">
          STEP1 の簡易診断で用途を素早く把握し、STEP2 の詳細診断で 1 機体まで絞り込み。
          最新の DJI ラインアップから用途と予算に最適な機体をご案内します。
        </p>
      </div>
      <div className="flex w-full flex-col items-center gap-6 sm:flex-col sm:items-center">
        <Link
          href="/step1"
          className="flex w-full max-w-xs items-center justify-center gap-3 rounded-full bg-primary px-10 py-4 text-lg font-semibold text-white shadow-lg transition hover:-translate-y-1 hover:bg-sky-500 hover:shadow-xl sm:max-w-none sm:px-12"
        >
          STEP1 かんたん診断を始める
        </Link>
        <Link
          href="/diagnose"
          className="text-sm font-semibold text-slate-600 underline-offset-4 transition hover:text-primary"
        >
          直接 STEP2 詳細診断へ進む
        </Link>
        <Link
          href="/lineup"
          className="text-sm font-semibold text-slate-600 underline-offset-4 transition hover:text-primary"
        >
          ラインナップを確認する
        </Link>
      </div>
      <section className="grid w-full gap-6 rounded-3xl bg-white/70 p-8 shadow-2xl shadow-sky-100 sm:grid-cols-3">
        <div>
          <h2 className="text-xl font-semibold">最新ラインアップ</h2>
          <p className="mt-2 text-sm text-muted">
            Mini 5 Pro から Dock 3 まで、2025年時点の代表機種をカバー。
            JSON カタログ差し替えで最新化も簡単です。
          </p>
        </div>
        <div>
          <h2 className="text-xl font-semibold">動的診断フロー</h2>
          <p className="mt-2 text-sm text-muted">
            STEP1 でタイプを判定し、STEP2 では用途別の詳細質問に自動分岐。必要な質問だけを出題します。
          </p>
        </div>
        <div>
          <h2 className="text-xl font-semibold">導線カスタマイズ</h2>
          <p className="mt-2 text-sm text-muted">
            結果ページの CTA はフォームや体験会予約へ紐付け。GA4
            イベント計測にも対応した設計です。
          </p>
        </div>
      </section>
    </main>
  );
}
