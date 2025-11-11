import Image from "next/image";
import { catalog, isMicroModel } from "@/lib/datasets";
import type { CatalogModel, ResultTemplate } from "@/lib/types";

interface ResultCardProps {
  typeLabel: string;
  template?: ResultTemplate;
  primaryModel?: CatalogModel;
  alternativeModels?: CatalogModel[];
  score?: number;
  resultSummary?: string[];
}

export function ResultCard(props: ResultCardProps) {
  const {
    typeLabel,
    template,
    primaryModel,
    alternativeModels = [],
    score,
    resultSummary = []
  } = props;

  const kindLabel = (model?: CatalogModel) => {
    if (!model) return "";
    return model.kind === "payload" ? "ペイロード" : "機体";
  };
  const formatPrice = (model: CatalogModel) =>
    `${model.priceJPY.min.toLocaleString("ja-JP")}〜${model.priceJPY.max.toLocaleString("ja-JP")}円`;
  const priceMid = (model: CatalogModel) =>
    (model.priceJPY.min + model.priceJPY.max) / 2;
  const weightBadge = (model: CatalogModel) =>
    isMicroModel(model) ? "100g未満" : "100g超";

  const payloadAlternatives: CatalogModel[] = [];
  const upperAlternatives: CatalogModel[] = [];
  const lowerAlternatives: CatalogModel[] = [];

  const benchmark = primaryModel ? priceMid(primaryModel) : undefined;
  alternativeModels.forEach((model) => {
    if (model.kind === "payload") {
      payloadAlternatives.push(model);
      return;
    }
    if (benchmark === undefined) {
      lowerAlternatives.push(model);
      return;
    }
    if (priceMid(model) >= benchmark) {
      upperAlternatives.push(model);
    } else {
      lowerAlternatives.push(model);
    }
  });

  const heading = primaryModel
    ? `今回の推奨機体：${primaryModel.name}`
    : template?.title ?? typeLabel;
  const secondaryHeading = primaryModel ? template?.title ?? typeLabel : undefined;

  const renderAlternativeList = (
    title: string,
    models: CatalogModel[],
    accent: "upper" | "lower" | "payload"
  ) => {
    if (!models.length) return null;
    const accentClass =
      accent === "upper"
        ? "border-slate-200 bg-sky-50"
        : accent === "payload"
        ? "border-amber-200 bg-amber-50"
        : "border-slate-200 bg-white";
    return (
      <div className={`rounded-2xl border p-4 ${accentClass} shadow-sm transition`}>
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          {title}
        </p>
        <ul className="mt-3 space-y-3 text-sm text-slate-700">
          {models.map((model) => (
            <li key={model.id} className="flex flex-col gap-1">
              <span className="font-semibold text-slate-900">{model.name}</span>
              <span className="flex flex-wrap gap-2 text-xs text-muted">
                {formatPrice(model)}
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-500">
                  {kindLabel(model)}
                </span>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-500">
                  {weightBadge(model)}
                </span>
                {model.typeTags?.length ? (
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-500">
                    {model.typeTags
                      .map((tag) => catalog.types[tag]?.label)
                      .filter(Boolean)
                      .join("／")}
                  </span>
                ) : null}
              </span>
              {model.bullets?.length ? (
                <ul className="ml-4 list-disc text-xs text-slate-600">
                  {model.bullets.slice(0, 3).map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
              ) : null}
              {model.notes ? (
                <span className="text-xs text-amber-600">{model.notes}</span>
              ) : null}
            </li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <div className="w-full rounded-3xl bg-white p-8 shadow-2xl shadow-sky-100">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-baseline justify-between">
            <h2 className="text-2xl font-bold text-slate-900">{heading}</h2>
            {typeof score === "number" ? (
              <span className="badge badge-primary text-xs font-semibold">
                スコア {score.toFixed(1)}
              </span>
            ) : null}
          </div>
          {secondaryHeading ? (
            <p className="text-sm font-semibold text-slate-500">{secondaryHeading}</p>
          ) : null}
          {resultSummary.length ? (
            <div className="flex flex-wrap gap-2">
              {resultSummary.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-primary"
                >
                  {tag}
                </span>
              ))}
            </div>
          ) : null}
        </div>

        {primaryModel ? (
          <div className="mt-4 rounded-2xl border border-slate-200 p-4">
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">
              メイン推奨機体
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
              <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">
                {weightBadge(primaryModel)}
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
            <p className="text-sm text-muted">{formatPrice(primaryModel)}（税込目安）</p>
            <p className="text-xs text-slate-500">
              {isMicroModel(primaryModel)
                ? "100g未満のマイクロドローンです。室内練習や許可不要の用途に適しています。"
                : "100gを超えるため、飛行には航空法上の許可・承認や管理体制の整備が必要です。"}
            </p>
            {primaryModel.bullets?.length ? (
              <ul className="mt-3 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
                {primaryModel.bullets.map((point) => (
                  <li key={point} className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700">
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
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 p-4 text-sm text-slate-600">
            条件に合致する推奨機体が見つかりませんでした。回答を見直すか別タイプもご検討ください。
          </div>
        )}

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {renderAlternativeList("上位候補（性能アップ）", upperAlternatives, "upper")}
          {renderAlternativeList("下位候補（コスト・軽量）", lowerAlternatives, "lower")}
          {renderAlternativeList("対応ペイロード / オプション", payloadAlternatives, "payload")}
        </div>

        {template?.mainMessage ? (
          <div className="mt-6 rounded-2xl bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-700">{template.title ?? typeLabel}</p>
            <p className="mt-2 text-sm text-slate-600">{template.mainMessage}</p>
            {template.priceNote ? (
              <p className="mt-1 text-xs font-semibold text-primary">{template.priceNote}</p>
            ) : null}
            {template.tips?.length ? (
              <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-slate-600">
                {template.tips.map((tip) => (
                  <li key={tip}>{tip}</li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default ResultCard;
