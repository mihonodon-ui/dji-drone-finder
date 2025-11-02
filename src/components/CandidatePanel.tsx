import type { DiagnosisMode, ConstraintState } from "@/lib/dynamicDiagnosis";
import { catalog } from "@/lib/datasets";
import type { CatalogModel } from "@/lib/types";
import clsx from "clsx";

export interface CandidateEntry {
  rank: number;
  typeKey: string;
  typeLabel: string;
  score: number;
  model?: CatalogModel;
  fallback?: string;
  isPrimary: boolean;
}

interface CandidatePanelProps {
  candidates: CandidateEntry[];
  constraints: ConstraintState;
  mode: DiagnosisMode;
  hasAnswers: boolean;
}

function formatPrice(model?: CatalogModel) {
  if (!model) return "該当なし";
  const { min, max } = model.priceJPY;
  const minText = min.toLocaleString("ja-JP");
  const maxText = max.toLocaleString("ja-JP");
  return `${minText}〜${maxText}円`;
}

function formatKind(model?: CatalogModel) {
  if (!model) return "";
  return model.kind === "payload" ? "ペイロード" : "機体";
}

function formatConstraints(constraints: ConstraintState) {
  const chips: string[] = [];
  if (constraints.maxPrice) {
    chips.push(`予算: 〜${constraints.maxPrice.toLocaleString("ja-JP")}円`);
  }
  if (constraints.minPrice) {
    chips.push(`下限予算: ${constraints.minPrice.toLocaleString("ja-JP")}円〜`);
  }
  if (constraints.requiredSensors?.length) {
    chips.push(`必須センサー: ${constraints.requiredSensors.join(", ")}`);
  }
  return chips;
}

export function CandidatePanel({
  candidates,
  constraints,
  mode,
  hasAnswers
}: CandidatePanelProps) {
  const chips = formatConstraints(constraints);
  const maxScore = Math.max(0, ...candidates.map((item) => item.score));

  return (
    <aside className="sticky top-6 flex h-fit flex-col gap-4 rounded-3xl bg-white p-6 shadow-xl shadow-sky-100">
      <header className="flex flex-col gap-2">
        <span className="badge badge-primary w-fit text-xs font-semibold">候補機種</span>
        <h2 className="text-xl font-semibold text-slate-900">
          現在の推奨機体プレビュー
        </h2>
        <p className="text-xs text-muted">
          回答に応じて候補がリアルタイムで絞り込まれます。モード:
          <span className="ml-1 font-semibold text-primary">
            {mode === "light" ? "ライト" : mode === "pro" ? "プロ" : "診断中"}
          </span>
        </p>
        {chips.length ? (
          <div className="flex flex-wrap gap-2">
            {chips.map((chip) => (
              <span key={chip} className="badge badge-primary bg-sky-100 text-xs text-primary">
                {chip}
              </span>
            ))}
          </div>
        ) : null}
      </header>

      {!hasAnswers ? (
        <div className="rounded-2xl bg-slate-50 p-4 text-xs text-slate-600">
          目的と予算を選ぶと候補機種がここに表示されます。
        </div>
      ) : null}

      <div className="flex flex-col gap-4">
        {candidates.length ? (
          candidates.map((candidate) => {
            const { model, typeLabel, fallback } = candidate;
            const scoreRatio = maxScore ? Math.max(candidate.score / maxScore, 0) : 0;
            const modelTypeLabels = model?.typeTags
              ?.map((tag) => catalog.types[tag]?.label)
              .filter(Boolean)
              .join("／");
            return (
              <div
                key={`${candidate.typeKey}-${candidate.rank}`}
                className={clsx(
                  "rounded-2xl border px-4 py-4 transition",
                  candidate.isPrimary
                    ? "border-primary bg-sky-50 shadow"
                    : "border-slate-200 bg-white"
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      タイプ {candidate.rank}
                    </span>
                    <span className="text-base font-semibold text-slate-900">
                      {typeLabel}
                    </span>
                  </div>
                  <span className="badge badge-primary text-xs font-semibold">
                    スコア {candidate.score.toFixed(1)}
                  </span>
                </div>
                <div className="mt-3 h-1.5 w-full rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-300"
                    style={{ width: `${Math.round(scoreRatio * 100)}%` }}
                  />
                </div>
                <div className="mt-3 flex flex-col gap-1 text-sm text-slate-700">
                  <span className="font-semibold">
                    {model ? model.name : "該当する機種がありません"}
                  </span>
                  {model ? (
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
                      <span>{formatPrice(model)}</span>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-500">
                        {formatKind(model)}
                      </span>
                      {modelTypeLabels ? (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-500">
                          {modelTypeLabels}
                        </span>
                      ) : null}
                    </div>
                  ) : null}
                  {model?.notes ? (
                    <span className="text-xs text-amber-600">{model.notes}</span>
                  ) : null}
                  {fallback ? <span className="text-xs text-warning">{fallback}</span> : null}
                </div>
              </div>
            );
          })
        ) : (
          <div className="rounded-2xl bg-slate-50 p-4 text-xs text-slate-600">
            条件に合致する候補がまだありません。回答を追加すると絞り込まれます。
          </div>
        )}
      </div>
    </aside>
  );
}

export default CandidatePanel;
