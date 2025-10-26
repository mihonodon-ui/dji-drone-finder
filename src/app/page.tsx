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
          ライト診断（STEP1）で方向性を確認し、プロ診断（STEP2）でおすすめ機種と価格帯まで明確に。用途別に最適な導入プランをご提案します。
        </p>
      </div>
      <div className="flex flex-col gap-4 sm:flex-row">
        <Link
          href="/step1"
          className="rounded-full bg-primary px-8 py-3 text-white transition hover:bg-sky-500"
        >
          ライト診断を始める
        </Link>
        <Link
          href="/step2"
          className="rounded-full border border-slate-300 px-8 py-3 text-slate-700 transition hover:border-primary hover:text-primary"
        >
          プロ診断の流れを見る
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
          <h2 className="text-xl font-semibold">2段階診断</h2>
          <p className="mt-2 text-sm text-muted">
            STEP1で用途タイプを判定、STEP2で具体的な機種と価格帯を絞り込み。診断結果はブックマーク/共有可能。
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

