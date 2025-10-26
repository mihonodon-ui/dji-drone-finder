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
                  <span className="text-xs text-muted">
                    {model.priceJPY.min.toLocaleString("ja-JP")}〜
                    {model.priceJPY.max.toLocaleString("ja-JP")}円
                  </span>
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
