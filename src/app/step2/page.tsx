import Link from "next/link";

export default function Step2Page() {
  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-12">
      <span className="badge badge-primary self-start">STEP 2</span>
      <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">プロ診断</h1>
      <p className="text-base text-muted">
        STEP2 では 10 問の詳細な質問に回答し、業務要件に合わせた機種構成と価格帯を提示します。
        画面設計と診断ロジックはこのあと実装予定です。
      </p>
      <div className="rounded-3xl bg-white p-8 shadow">
        <p className="text-sm text-slate-700">
          現在はライト診断（STEP1）の UI を優先して構築しています。プロ診断では
          JSON で管理する 10 問の設問とスコアリングロジックを STEP1 に拡張する形で実装予定です。
        </p>
        <p className="mt-4 text-sm text-muted">
          プロトタイプの作成が完了次第、このページから診断を開始できるようになります。
        </p>
      </div>
      <Link
        href="/step1"
        className="self-start rounded-full border border-slate-300 px-6 py-3 font-semibold text-slate-700 transition hover:border-primary hover:text-primary"
      >
        ライト診断へ戻る
      </Link>
    </main>
  );
}

