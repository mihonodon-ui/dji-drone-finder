import Image from "next/image";
import type { ConstraintState } from "@/lib/dynamicDiagnosis";
import { isMicroModel } from "@/lib/datasets";
import type { CatalogModel } from "@/lib/types";

interface CandidatePanelProps {
  models: CatalogModel[];
  constraints: ConstraintState;
  hasAnswers: boolean;
  note?: string;
}

function formatPrice(model: CatalogModel) {
  const { min, max } = model.priceJPY;
  return `${min.toLocaleString("ja-JP")}〜${max.toLocaleString("ja-JP")}円`;
}

function formatConstraints(constraints: ConstraintState) {
  const chips: string[] = [];
  if (constraints.maxPrice) {
    chips.push(`上限予算: 〜${constraints.maxPrice.toLocaleString("ja-JP")}円`);
  }
  if (constraints.minPrice) {
    chips.push(`下限予算: ${constraints.minPrice.toLocaleString("ja-JP")}円〜`);
  }
  if (constraints.preferredWeight === "under100") {
    chips.push("100g未満希望");
  } else if (constraints.preferredWeight === "over100") {
    chips.push("100g以上でOK");
  }
  return chips;
}

export default function CandidatePanel({
  models,
  constraints,
  hasAnswers,
  note
}: CandidatePanelProps) {
  const chips = formatConstraints(constraints);
  const emptyState = !models.length;

  return (
    <aside className="sticky top-6 flex h-fit flex-col gap-4 rounded-3xl bg-white p-6 shadow-xl shadow-sky-100">
      <header className="flex flex-col gap-2">
        <span className="badge badge-primary w-fit text-xs font-semibold">候補機体</span>
        <h2 className="text-xl font-semibold text-slate-900">現在の候補ラインナップ</h2>
        <p className="text-xs text-muted">回答に合わせて候補が自動で絞られていきます。</p>
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
          まずは左の質問に答えて、用途に合う候補を表示しましょう。
        </div>
      ) : null}

      {emptyState ? (
        <div className="rounded-2xl bg-slate-50 p-4 text-xs text-slate-600">
          条件に合う候補がまだありません。質問を進めてみてください。
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {models.map((model) => (
            <article
              key={model.id}
              className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-center gap-4">
                <div className="relative h-20 w-32 overflow-hidden rounded-2xl bg-slate-50">
                  {model.images && model.images[0] ? (
                    <Image
                      src={`/images/${model.images[0]}`}
                      alt={model.name}
                      fill
                      className="object-contain p-3"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">
                      画像なし
                    </div>
                  )}
                </div>
                <div className="flex flex-col">
                  <h3 className="text-base font-semibold text-slate-900">{model.name}</h3>
                  <p className="text-xs text-muted">{formatPrice(model)}</p>
                  <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-slate-500">
                    <span className="rounded-full bg-slate-100 px-2 py-0.5">
                      {model.kind === "payload" ? "ペイロード" : "機体"}
                    </span>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5">
                      {isMicroModel(model) ? "100g未満" : "100g超"}
                    </span>
                  </div>
                </div>
              </div>
              {model.bullets?.length ? (
                <ul className="list-disc space-y-1 pl-4 text-xs text-slate-600">
                  {model.bullets.slice(0, 3).map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
              ) : null}
              {model.notes ? (
                <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-600">{model.notes}</p>
              ) : null}
            </article>
          ))}
        </div>
      )}

      {note ? <p className="text-xs text-warning">{note}</p> : null}
    </aside>
  );
}
