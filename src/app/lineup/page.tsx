"use client";

import Image from "next/image";
import Link from "next/link";
import { catalog, isMicroModel } from "@/lib/datasets";

const formattedModels = catalog.models.map((model) => {
  const priceRange = `${model.priceJPY.min.toLocaleString("ja-JP")}〜${model.priceJPY.max.toLocaleString("ja-JP")}円`;
  const typeLabels = model.typeTags
    .map((tag) => catalog.types[tag]?.label)
    .filter(Boolean)
    .join("／");
  const kindLabel = model.kind === "payload" ? "ペイロード" : "機体";

  return {
    ...model,
    priceRange,
    typeLabels,
    kindLabel,
    isPayload: model.kind === "payload"
  };
});

const primaryModelIds = new Set(
  Object.values(catalog.types).map((type) => type.primaryModelId)
);
const highlightedModels = formattedModels.filter(
  (model) => primaryModelIds.has(model.id) && !model.isPayload
);
const microModels = formattedModels.filter((model) => isMicroModel(model));
const aircraftModels = formattedModels.filter(
  (model) => !model.isPayload && !primaryModelIds.has(model.id) && !isMicroModel(model)
);
const payloadModels = formattedModels.filter((model) => model.isPayload);

function ModelCard({
  model
}: {
  model: (typeof formattedModels)[number];
}) {
  const { isPayload, kindLabel } = model;
  const primaryImage = model.images?.[0];
  const bulletItems = (model.bullets ?? []).slice(0, 3).map((bullet) =>
    bullet.length > 28 ? `${bullet.slice(0, 28)}…` : bullet
  );

  return (
    <article
      key={model.id}
      className="flex h-full flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
    >
      {primaryImage ? (
        <div className="relative h-40 w-full overflow-hidden rounded-2xl bg-slate-50">
          <Image
            src={`/images/${primaryImage}`}
            alt={model.name}
            fill
            className="object-contain p-4"
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
          />
        </div>
      ) : (
        <div className="flex h-40 w-full items-center justify-center rounded-2xl bg-slate-50 text-xs text-slate-500">
          画像準備中
        </div>
      )}
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap gap-2">
          <span
            className="badge badge-primary bg-sky-100 text-xs font-semibold text-primary"
          >
            {isPayload ? `ペイロード / ${model.typeLabels || "用途"}` : model.typeLabels || "汎用"}
          </span>
          {isPayload ? (
            <span className="badge badge-primary bg-orange-100 text-xs font-semibold text-orange-500">
              {kindLabel}
            </span>
          ) : null}
        </div>
        <h2 className="text-xl font-bold text-slate-900">{model.name}</h2>
        <p className="text-sm font-semibold text-primary">{model.priceRange}</p>
      </div>
      {bulletItems.length ? (
        <ul className="flex flex-col gap-2 text-xs text-slate-600">
          {bulletItems.map((bullet, index) => (
            <li key={`${model.id}-bullet-${index}`} className="rounded-xl bg-slate-50 px-3 py-2">
              {bullet}
            </li>
          ))}
        </ul>
      ) : null}
      {model.notes ? (
        <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-600">{model.notes}</p>
      ) : null}
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
  );
}

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
      <section className="flex flex-col gap-4">
        {highlightedModels.length ? (
          <div className="flex flex-col gap-4">
            <h2 className="text-xl font-semibold text-slate-900">注目機体（診断の代表モデル）</h2>
            <p className="text-sm text-muted">
              診断ステップで代表機種として提示されるモデルです。用途別の主力構成を先に把握したい場合にご活用ください。
            </p>
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {highlightedModels.map((model) => (
                <ModelCard key={model.id} model={model} />
              ))}
            </div>
          </div>
        ) : null}

        {microModels.length ? (
          <section id="micro" className="flex flex-col gap-4 rounded-3xl bg-sky-50/60 p-6">
            <div className="flex flex-col gap-2">
              <h2 className="text-xl font-semibold text-slate-900">100g未満マイクロドローン</h2>
              <p className="text-sm text-muted">
                市街地や屋内で許可・承認が不要な 100g 未満クラスです。旅行・室内撮影など手続き簡素な用途に向きます。
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {microModels.map((model) => (
                <ModelCard key={model.id} model={model} />
              ))}
            </div>
          </section>
        ) : null}

        <h2 className="text-xl font-semibold text-slate-900">ドローン本体</h2>
        <p className="text-sm text-muted">
          産業向けの機体ラインアップです。診断結果や用途カテゴリに連動して提案されます。
        </p>
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {aircraftModels.map((model) => (
            <ModelCard key={model.id} model={model} />
          ))}
        </div>
      </section>

      {payloadModels.length ? (
        <section className="flex flex-col gap-4">
          <h2 className="text-xl font-semibold text-slate-900">対応ペイロード / アクセサリ</h2>
          <p className="text-sm text-muted">
            カメラや照明などのペイロードです。対応機体（主に Matrice 350 / 400 シリーズ）と組み合わせて活用します。
          </p>
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {payloadModels.map((model) => (
              <ModelCard key={model.id} model={model} />
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}
