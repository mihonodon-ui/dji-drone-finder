"use client";

import Image from "next/image";
import Link from "next/link";
import {
  catalog,
  resolveAlternativeModels,
  resolvePrimaryModel
} from "@/lib/datasets";
import type { CatalogModel, CatalogType, DroneTypeKey } from "@/lib/types";

const typeEntries = Object.entries(catalog.types) as [DroneTypeKey, CatalogType][];

const typeAccents: Record<DroneTypeKey, string> = {
  hobby: "#0ea5e9",
  creative: "#8b5cf6",
  inspection: "#f97316",
  survey: "#10b981",
  agri: "#84cc16",
  logi: "#facc15",
  disaster: "#f43f5e",
  auto: "#0f766e",
  dev: "#94a3b8"
};

function formatPriceRange(model?: CatalogModel) {
  if (!model) return "価格情報なし";
  const { min, max } = model.priceJPY;
  if (min === max) {
    return `${min.toLocaleString("ja-JP")}円`;
  }
  return `${min.toLocaleString("ja-JP")} ~ ${max.toLocaleString("ja-JP")}円`;
}

function PrimaryModelCard({ model }: { model?: CatalogModel }) {
  if (!model) {
    return (
      <div className="flex flex-col gap-2 rounded-2xl border border-dashed border-slate-200 p-4 text-sm text-slate-500">
        <p>このタイプの代表機体は準備中です。ラインナップの更新をお待ちください。</p>
      </div>
    );
  }

  const heroImage = model.images?.[0];
  const bullets = (model.bullets ?? []).slice(0, 3);

  return (
    <article className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      {heroImage ? (
        <div className="relative h-44 w-full overflow-hidden rounded-xl bg-slate-50">
          <Image
            src={`/images/${heroImage}`}
            alt={model.name}
            fill
            className="object-contain p-4"
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
          />
        </div>
      ) : (
        <div className="flex h-44 items-center justify-center rounded-xl bg-slate-50 text-xs text-slate-500">
          画像準備中
        </div>
      )}
      <div className="flex flex-col gap-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">代表機体</p>
        <h3 className="text-xl font-bold text-slate-900">{model.name}</h3>
        <p className="text-sm font-semibold text-primary">{formatPriceRange(model)}</p>
      </div>
      {bullets.length ? (
        <ul className="flex flex-col gap-2 text-sm text-slate-600">
          {bullets.map((bullet) => (
            <li key={`${model.id}-${bullet}`} className="rounded-xl bg-slate-50 px-3 py-2">
              {bullet}
            </li>
          ))}
        </ul>
      ) : null}
      {model.notes ? (
        <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-700">{model.notes}</p>
      ) : null}
      <div className="mt-auto flex flex-wrap gap-3 text-sm">
        <Link
          href={`/models/${model.id}`}
          className="rounded-full border border-slate-300 px-5 py-2 text-xs font-semibold text-slate-700 transition hover:border-primary hover:text-primary"
        >
          詳細を見る
        </Link>
        <Link
          href={`/diagnose?prefType=${model.typeTags?.[0] ?? ""}`}
          className="rounded-full border border-slate-300 px-5 py-2 text-xs font-semibold text-slate-700 transition hover:border-primary hover:text-primary"
        >
          このタイプで診断
        </Link>
      </div>
    </article>
  );
}

function AlternativeList({ models }: { models: CatalogModel[] }) {
  if (!models.length) {
    return (
      <p className="text-sm text-slate-500">
        代替候補はまだ登録されていません。データ更新をお待ちください。
      </p>
    );
  }

  return (
    <ul className="grid gap-3 md:grid-cols-2">
      {models.map((model) => (
        <li key={model.id} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <div className="flex flex-col gap-1">
            <p className="text-base font-semibold text-slate-900">{model.name}</p>
            <p className="text-xs font-semibold text-primary">{formatPriceRange(model)}</p>
            <p className="text-xs text-slate-500">
              {model.kind === "payload" ? "ペイロード" : "機体"} /{" "}
              {(model.typeTags ?? [])
                .map((tag) => catalog.types[tag]?.label)
                .filter(Boolean)
                .join("・") || "用途未分類"}
            </p>
            {model.bullets?.[0] ? (
              <p className="text-xs text-slate-600">{model.bullets[0]}</p>
            ) : null}
          </div>
          <div className="mt-3 flex gap-2 text-xs">
            <Link
              href={`/models/${model.id}`}
              className="rounded-full border border-slate-300 px-3 py-1 font-semibold text-slate-700 transition hover:border-primary hover:text-primary"
            >
              詳細
            </Link>
            <Link
              href={`/diagnose?prefType=${model.typeTags?.[0] ?? ""}`}
              className="rounded-full border border-slate-200 px-3 py-1 font-semibold text-slate-600 transition hover:border-primary hover:text-primary"
            >
              この機体を診断で確認
            </Link>
          </div>
        </li>
      ))}
    </ul>
  );
}

export default function TypeLineupPage() {
  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-10 px-6 py-12">
      <header className="flex flex-col gap-4 text-center sm:text-left">
        <span className="badge badge-primary self-center sm:self-start">Type Lineup</span>
        <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">タイプ別ラインナップ一覧</h1>
        <p className="text-base text-muted">
          STEP1 の用途カードで表示している代表機体と代替候補を一覧で確認できます。診断を進める前に、用途ごとの違いを俯瞰したい際にご利用ください。
        </p>
        <div className="flex flex-wrap justify-center gap-3 sm:justify-start">
          <Link
            href="/step1"
            className="rounded-full border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-primary hover:text-primary"
          >
            STEP1 に戻る
          </Link>
          <Link
            href="/lineup"
            className="rounded-full border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-primary hover:text-primary"
          >
            全ラインナップを見る
          </Link>
        </div>
      </header>

      <section className="flex flex-col gap-8">
        {typeEntries.map(([typeKey, typeDetail]) => {
          const accent = typeAccents[typeKey] ?? "#0ea5e9";
          const primary = resolvePrimaryModel(typeKey);
          const alternatives = resolveAlternativeModels(typeKey);

          return (
            <article
              key={typeKey}
              className="flex flex-col gap-6 rounded-3xl border border-slate-200 bg-white/70 p-6 shadow-sm"
              style={{ borderTop: `6px solid ${accent}` }}
            >
              <div className="flex flex-col gap-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  用途タイプ
                </span>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <h2 className="text-2xl font-bold text-slate-900">{typeDetail.label}</h2>
                  <Link
                    href={`/diagnose?prefType=${typeKey}`}
                    className="rounded-full border border-slate-300 px-5 py-2 text-xs font-semibold text-slate-700 transition hover:border-primary hover:text-primary"
                  >
                    このタイプで診断を始める
                  </Link>
                </div>
                {typeDetail.summary ? (
                  <p className="text-sm text-slate-600">{typeDetail.summary}</p>
                ) : null}
              </div>

              <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                <PrimaryModelCard model={primary} />
                <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    その他の候補
                  </p>
                  <AlternativeList models={alternatives} />
                </div>
              </div>
            </article>
          );
        })}
      </section>
    </main>
  );
}
