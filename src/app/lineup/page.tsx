"use client";

import Link from "next/link";
import { catalog } from "@/lib/datasets";

const formattedModels = catalog.models.map((model) => {
  const priceRange = `${model.priceJPY.min.toLocaleString("ja-JP")}〜${model.priceJPY.max.toLocaleString("ja-JP")}円`;
  const typeLabels = model.typeTags
    .map((tag) => catalog.types[tag]?.label)
    .filter(Boolean)
    .join("／");
  return {
    ...model,
    priceRange,
    typeLabels
  };
});

export default function LineupPage() {
  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-12">
      <header className="flex flex-col gap-4 text-center sm:text-left">
        <span className="badge badge-primary self-center sm:self-start">Lineup</span>
        <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">最新ラインナップ一覧</h1>
        <p className="text-base text-muted">
          `/diagnose` で使用している DJI ドローンの代表モデルです。用途・タイプ・価格帯を合わせて一覧表示しています。
          JSON データ（`src/data/catalog.models.json`）を更新するとこのページにも即時反映されます。販売終了機種は
          <Link href="/archive" className="ml-1 font-semibold text-primary hover:underline">
            アーカイブ一覧
          </Link>
          にまとめています。
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/diagnose"
            className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-sky-500"
          >
            診断を始める
          </Link>
          <Link
            href="/"
            className="rounded-full border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-primary hover:text-primary"
          >
            トップへ戻る
          </Link>
        </div>
      </header>

        <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {formattedModels.map((model) => (
            <article
              key={model.id}
              className="flex h-full flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="flex flex-col gap-2">
                <span className="badge badge-primary w-fit text-xs font-semibold">
                  {model.typeLabels || "汎用"}
                </span>
                <h2 className="text-xl font-bold text-slate-900">{model.name}</h2>
                <p className="text-sm font-semibold text-primary">{model.priceRange}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {model.bullets?.map((bullet) => (
                  <span
                    key={bullet}
                    className="badge badge-primary bg-sky-100 text-xs font-semibold text-primary"
                  >
                    {bullet}
                  </span>
                ))}
              </div>
              <div className="mt-auto flex flex-wrap gap-3 text-sm">
                <Link
                  href={`/models/${model.id}`}
                  className="rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:border-primary hover:text-primary"
                >
                  詳細を見る
                </Link>
                {model.links?.consult ? (
                  <Link
                    href={model.links.consult}
                    className="rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:border-primary hover:text-primary"
                  >
                    相談する
                  </Link>
                ) : null}
                {model.links?.demo ? (
                  <Link
                    href={model.links.demo}
                    className="rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:border-primary hover:text-primary"
                  >
                    体験会を予約
                  </Link>
                ) : null}
              </div>
            </article>
          ))}
        </section>
    </main>
  );
}
