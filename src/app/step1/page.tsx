"use client";

import Image from "next/image";
import clsx from "clsx";
import Link from "next/link";
import { useMemo, useState } from "react";
import { catalog, resolveAlternativeModels, resolvePrimaryModel } from "@/lib/datasets";
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

type TypeCardProps = {
  typeKey: DroneTypeKey;
  typeDetail: CatalogType;
  onSelect: (type: DroneTypeKey) => void;
};

function formatPriceRange(model?: CatalogModel) {
  if (!model) return "価格情報なし";
  const { min, max } = model.priceJPY;
  return `${min.toLocaleString("ja-JP")}〜${max.toLocaleString("ja-JP")}円`;
}

function TypeCard({ typeKey, typeDetail, onSelect }: TypeCardProps) {
  const accent = typeAccents[typeKey] ?? "#0ea5e9";
  return (
    <button
      type="button"
      onClick={() => onSelect(typeKey)}
      className={clsx(
        "flex flex-col gap-4 rounded-3xl border bg-white px-5 py-5 text-left transition focus-visible:outline-none",
        "border-slate-200 hover:shadow-lg focus-visible:ring-2 focus-visible:ring-offset-2",
        "shadow-sm"
      )}
      style={{ borderLeft: `6px solid ${accent}` }}
      aria-label={`${typeDetail.label} の詳細を開く`}
    >
      <div className="flex flex-col gap-1">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">用途タイプ</span>
        <h3 className="text-xl font-bold text-slate-900">{typeDetail.label}</h3>
      </div>
      <p className="text-sm text-slate-600 line-clamp-3">
        {typeDetail.summary ?? "タイプの概要は詳細カードからご確認いただけます。"}
      </p>
      <span className="mt-auto text-sm font-semibold text-primary">詳しく見る</span>
    </button>
  );
}

export default function Step1Page() {
  const [activeType, setActiveType] = useState<DroneTypeKey | null>(null);
  const activeDetail = activeType ? catalog.types[activeType] : null;
  const primaryModel = activeType ? resolvePrimaryModel(activeType) : null;
  const alternativeModels = useMemo(
    () => (activeType ? resolveAlternativeModels(activeType).slice(0, 4) : []),
    [activeType]
  );

  const closeDetail = () => setActiveType(null);
  const step2Link = activeType ? `/diagnose?prefType=${activeType}` : "#";

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-6xl flex-col gap-10 px-6 py-12">
      <header className="flex flex-col gap-3 text-center sm:text-left">
        <span className="badge badge-primary w-fit">STEP 1</span>
        <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">用途タイプを選びましょう</h1>
        <p className="text-base text-muted">
          気になる用途カードをタップすると、代表機種と診断への導線が表示されます。まずはタイプだけ選び、詳細の機種診断（STEP2）は後から行えます。
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {typeEntries.map(([typeKey, typeDetail]) => (
          <TypeCard key={typeKey} typeKey={typeKey} typeDetail={typeDetail} onSelect={setActiveType} />
        ))}
      </section>

      <div className="flex flex-col items-end gap-1 text-sm text-slate-500">
        <Link href="/lineup/types" className="font-semibold text-primary hover:underline">
          タイプ別ラインナップを一覧で見る
        </Link>
        <Link href="/lineup" className="font-semibold text-primary hover:underline">
          全ラインナップを見る
        </Link>
      </div>

      {activeDetail ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 px-4 py-6">
          <div className="relative flex h-[90vh] w-full max-w-3xl flex-col gap-6 overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
            <button
              type="button"
              onClick={closeDetail}
              className="absolute right-4 top-4 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-primary hover:text-primary"
            >
              閉じる
            </button>

            <div className="mt-6 flex flex-col gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-primary">用途タイプ</span>
              <h2 className="text-2xl font-bold text-slate-900">{activeDetail.label}</h2>
              {activeDetail.summary ? (
                <p className="text-sm text-slate-600">{activeDetail.summary}</p>
              ) : null}
            </div>

            {primaryModel ? (
              <div className="rounded-2xl border border-slate-200 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-primary">代表推奨機体</p>
                <h3 className="mt-1 text-xl font-bold text-slate-900">{primaryModel.name}</h3>
                <p className="text-sm text-slate-500">{formatPriceRange(primaryModel)}</p>
                {primaryModel.images?.[0] ? (
                  <div className="relative mt-4 h-48 w-full overflow-hidden rounded-2xl bg-slate-50">
                    <Image
                      src={`/images/${primaryModel.images[0]}`}
                      alt={primaryModel.name}
                      fill
                      className="object-contain p-4"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  </div>
                ) : (
                  <div className="mt-4 flex h-48 items-center justify-center rounded-2xl bg-slate-50 text-xs text-slate-500">
                    画像準備中
                  </div>
                )}
                {primaryModel.bullets?.length ? (
                  <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-600">
                    {primaryModel.bullets.slice(0, 3).map((bullet) => (
                      <li key={bullet}>{bullet}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 p-4 text-sm text-slate-600">
                代表機体は準備中です。ラインナップページから詳細をご確認ください。
              </div>
            )}

            {alternativeModels.length ? (
              <div className="rounded-2xl border border-slate-200 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">そのほかの候補</p>
                <ul className="mt-2 grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
                  {alternativeModels.map((model) => (
                    <li key={model.id} className="rounded-xl bg-slate-50 px-3 py-2">
                      <p className="font-semibold">{model.name}</p>
                      <p className="text-xs text-slate-500">{formatPriceRange(model)}</p>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href={step2Link}
                className={clsx(
                  "flex-1 rounded-full px-6 py-3 text-center text-sm font-semibold text-white transition",
                  activeType ? "bg-primary hover:bg-sky-500" : "pointer-events-none bg-slate-300"
                )}
              >
                STEP2 詳細診断へ進む
              </Link>
              <Link
                href={`/result/${activeType ?? ""}`}
                className={clsx(
                  "flex-1 rounded-full border px-6 py-3 text-center text-sm font-semibold transition",
                  activeType
                    ? "border-slate-300 text-slate-700 hover:border-primary hover:text-primary"
                    : "pointer-events-none border-slate-200 text-slate-300"
                )}
              >
                タイプの概要を読む
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
