import Image from "next/image";
import { catalog } from "@/lib/datasets";
import type { CatalogModel, ResultTemplate } from "@/lib/types";

interface ResultCardProps {
  typeLabel: string;
  template?: ResultTemplate;
  primaryModel?: CatalogModel;
  alternativeModels?: CatalogModel[];
  score?: number;
}

export function ResultCard(props: ResultCardProps) {
  const {
    typeLabel,
    template,
    primaryModel,
    alternativeModels = [],
    score
  } = props;
  const kindLabel = (model?: CatalogModel) => {
    if (!model) return "";
    return model.kind === "payload" ? "ペイロード" : "機体";
  };
  return (
    <div className="w-full rounded-3xl bg-white p-8 shadow-2xl shadow-sky-100">
      <div className="flex flex-col gap-4">
        <div className="flex items-baseline justify-between">
          <h2 className="text-2xl font-bold text-slate-900">{template?.title ?? typeLabel}</h2>
          {typeof score === "number" ? (
            <span className="badge badge-primary text-xs font-semibold">
              スコア {score.toFixed(1)}
            </span>
          ) : null}
        </div>
        {template?.mainMessage ? (
          <p className="text-base text-slate-700">{template.mainMessage}</p>
        ) : null}
        {template?.priceNote ? (
          <p className="text-sm font-semibold text-primary">{template.priceNote}</p>
        ) : null}
        {primaryModel ? (
          <div className="mt-4 rounded-2xl border border-slate-200 p-4">
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">
              メイン推奨機種
            </p>
            <h3 className="mt-1 text-xl font-bold">{primaryModel.name}</h3>
            {primaryModel.images?.[0] ? (
              <div className="relative mt-3 h-48 w-full overflow-hidden rounded-2xl bg-slate-50">
                <Image
                  src={`/images/${primaryModel.images[0]}`}
                  alt={primaryModel.name}
                  fill
                  className="object-contain p-4"
                  sizes="(max-width: 640px) 100vw, 50vw"
                />
              </div>
            ) : null}
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
              <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">
                {kindLabel(primaryModel)}
              </span>
              {primaryModel.typeTags?.length ? (
                <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">
                  {primaryModel.typeTags
                    .map((tag) => catalog.types[tag]?.label)
                    .filter(Boolean)
                    .join("／")}
                </span>
              ) : null}
            </div>
            <p className="text-sm text-muted">
              {primaryModel.priceJPY.min.toLocaleString("ja-JP")}〜
              {primaryModel.priceJPY.max.toLocaleString("ja-JP")}円（税込目安）
            </p>
            {primaryModel.bullets?.length ? (
              <ul className="mt-3 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
                {primaryModel.bullets.map((point) => (
                  <li
                    key={point}
                    className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700"
                  >
                    {point}
                  </li>
                ))}
              </ul>
            ) : null}
            {primaryModel.notes ? (
              <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-600">
                {primaryModel.notes}
              </p>
            ) : null}
          </div>
        ) : null}
        {alternativeModels.length ? (
          <div className="mt-4 rounded-2xl border border-dashed border-slate-200 p-4">
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              上位 / 代替候補
            </p>
            <ul className="mt-2 space-y-2 text-sm text-slate-700">
              {alternativeModels.map((model) => (
                <li key={model.id} className="flex flex-col">
                  <span className="font-medium">{model.name}</span>
                  <span className="flex flex-wrap gap-2 text-xs text-muted">
                    {model.priceJPY.min.toLocaleString("ja-JP")}〜
                    {model.priceJPY.max.toLocaleString("ja-JP")}円
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-500">
                      {kindLabel(model)}
                    </span>
                  </span>
                  {model.notes ? (
                    <span className="text-xs text-amber-600">{model.notes}</span>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        {template?.tips?.length ? (
          <div className="mt-4 rounded-2xl bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-600">導入のヒント</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">
              {template.tips.map((tip) => (
                <li key={tip}>{tip}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default ResultCard;
