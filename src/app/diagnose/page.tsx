"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import CandidatePanel, { type CandidateEntry } from "@/components/CandidatePanel";
import CTAButtons from "@/components/CTAButtons";
import ProgressBar from "@/components/ProgressBar";
import QuestionCard from "@/components/QuestionCard";
import ResultCard from "@/components/ResultCard";
import {
  catalog,
  dynamicQuestionSet,
  isMicroModel,
  resolveAlternativeModels,
  resolvePrimaryModel,
  resolveResultTemplate
} from "@/lib/datasets";
import {
  buildActiveQuestions,
  createInitialDiagnosisState,
  findNextQuestionId,
  findQuestionById,
  isDiagnosisComplete,
  registerAnswer,
  type ConstraintState,
  type DiagnosisMode,
  type DiagnosisState
} from "@/lib/dynamicDiagnosis";
import { evaluateQuestionSet } from "@/lib/scoring";
import type { CatalogModel, DroneTypeKey, Question, QuestionOption } from "@/lib/types";

function formatPriceRange(min?: number, max?: number) {
  if (!min && !max) return null;
  if (min && max) {
    return `${min.toLocaleString("ja-JP")}〜${max.toLocaleString("ja-JP")}円`;
  }
  if (min) return `${min.toLocaleString("ja-JP")}円以上`;
  if (max) return `${max.toLocaleString("ja-JP")}円以下`;
  return null;
}

function selectModelsWithBudget(
  type: DroneTypeKey,
  constraints: ConstraintState
) {
  const typeDetail = catalog.types[type];
  if (!typeDetail) {
    return {
      primary: undefined,
      alternatives: [] as ReturnType<typeof resolveAlternativeModels>,
      note: undefined
    };
  }

  const primary = resolvePrimaryModel(type);
  const alternatives = resolveAlternativeModels(type);
  const uniqueCandidates = new Map(
    [primary, ...alternatives]
      .filter((model): model is NonNullable<typeof model> => Boolean(model))
      .map((model) => [model.id, model])
  );

  const orderedCandidates = Array.from(uniqueCandidates.values());
  if (!orderedCandidates.length) {
    return {
      primary: undefined,
      alternatives: [] as ReturnType<typeof resolveAlternativeModels>,
      note: constraints.maxPrice
        ? "予算条件に一致する機種が見つかりませんでした。"
        : undefined
    };
  }

  const fitsBudget = (model: CatalogModel) => {
    const { min, max } = model.priceJPY;
    if (typeof constraints.maxPrice === "number" && min > constraints.maxPrice) {
      return false;
    }
    if (typeof constraints.minPrice === "number" && max < constraints.minPrice) {
      return false;
    }
    return true;
  };

  const notes: string[] = [];
  const weightPreference = constraints.preferredWeight;
  const microCandidates = orderedCandidates.filter((model) => isMicroModel(model));
  const standardCandidates = orderedCandidates.filter((model) => !isMicroModel(model));

  let prioritizedCandidates: CatalogModel[] = orderedCandidates;
  let secondaryCandidates: CatalogModel[] = [];

  if (weightPreference === "under100") {
    if (microCandidates.length) {
      prioritizedCandidates = microCandidates;
      secondaryCandidates = standardCandidates;
    } else {
      notes.push("100g未満で要件に合う機体がないため、通常機を提示しています。");
    }
  } else if (weightPreference === "over100") {
    if (standardCandidates.length) {
      prioritizedCandidates = standardCandidates;
      secondaryCandidates = microCandidates;
    } else if (microCandidates.length) {
      notes.push("100g超の候補が見つからないため、マイクロ機を提示しています。");
      prioritizedCandidates = microCandidates;
    }
  }

  const selectedPrimary =
    prioritizedCandidates[0] ?? orderedCandidates[0]!;

  const seen = new Set<string>([selectedPrimary.id]);
  const collectAlternatives = (candidates: CatalogModel[]) =>
    candidates.filter((model) => {
      if (seen.has(model.id)) return false;
      seen.add(model.id);
      return true;
    });

  const prioritizedAlternatives = collectAlternatives(prioritizedCandidates);
  const secondaryAlternatives = collectAlternatives(secondaryCandidates);
  const remainingAlternatives = [...prioritizedAlternatives, ...secondaryAlternatives];

  const affordableAlternatives = remainingAlternatives.filter(fitsBudget);
  const orderedAlternatives =
    affordableAlternatives.length === remainingAlternatives.length
      ? remainingAlternatives
      : [
          ...affordableAlternatives,
          ...remainingAlternatives.filter(
            (model) => !affordableAlternatives.includes(model)
          )
        ];

  const primaryWithinBudget = fitsBudget(selectedPrimary);

  if (!primaryWithinBudget) {
    if (typeof constraints.maxPrice === "number" || typeof constraints.minPrice === "number") {
      notes.push(
        affordableAlternatives.length
          ? "推奨機種は予算条件を上回ります。下位候補でのコスト調整もご検討ください。"
          : "設定した予算条件では要件に合う機体が限られます。条件の見直しもご検討ください。"
      );
    } else {
      notes.push("要件に最適な機体を優先表示しています。");
    }
  }

  if (weightPreference === "under100" && !isMicroModel(selectedPrimary)) {
    notes.push(
      microCandidates.length
        ? "100g未満モデルが優先候補にありません。別タイプの機体も合わせてご検討ください。"
        : "このタイプには100g未満の候補がありません。許可申請を前提にした機体を提示しています。"
    );
  }

  return {
    primary: selectedPrimary,
    alternatives: orderedAlternatives,
    note: notes.length ? notes.join(" ") : undefined
  };
}

function buildCandidateEntries(
  mode: DiagnosisMode,
  evaluation: ReturnType<typeof evaluateQuestionSet>,
  constraints: ConstraintState,
  primaryType?: DroneTypeKey
): CandidateEntry[] {
  const ranked = evaluation.ranked.slice(0, 4);
  if (!ranked.length) return [];

  return ranked.flatMap((entry, index) => {
    const typeDetail = catalog.types[entry.type];
    if (!typeDetail) return [];
    const { primary, alternatives, note } = selectModelsWithBudget(entry.type, constraints);
    const representative = primary ?? alternatives[0];
    return [
      {
        rank: index + 1,
        typeKey: entry.type,
        typeLabel: typeDetail.label,
        score: entry.score,
        model: representative,
        fallback: note,
        isPrimary: entry.type === primaryType && mode !== "unknown"
      }
    ];
  });
}

export default function DiagnosePage() {
  const [state, setState] = useState<DiagnosisState>(createInitialDiagnosisState());
  const [currentQuestionId, setCurrentQuestionId] = useState<string | undefined>(
    dynamicQuestionSet.questions[0]?.id
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const activeQuestions = useMemo(
    () => buildActiveQuestions(dynamicQuestionSet, state),
    [state]
  );

  const currentQuestion = findQuestionById(dynamicQuestionSet, currentQuestionId);

  const answeredCount = Object.keys(state.answers).length;
  const totalQuestions = activeQuestions.length;

  const evaluation = useMemo(
    () => evaluateQuestionSet(dynamicQuestionSet, state.answers),
    [state.answers]
  );

  const diagnosisComplete = isDiagnosisComplete(state, activeQuestions);
  const primaryType = evaluation.primary?.type;
  const typeDetail = primaryType ? catalog.types[primaryType] : undefined;
  const modelSelection = primaryType
    ? selectModelsWithBudget(primaryType, state.constraints)
    : { primary: undefined, alternatives: [], note: undefined };
  const resultTemplate = primaryType ? resolveResultTemplate(primaryType) : undefined;

  const shareUrl =
    typeof window !== "undefined" && primaryType
      ? `${window.location.origin}/result/${primaryType}`
      : primaryType
        ? `/result/${primaryType}`
        : "";

  const budgetLabel = formatPriceRange(state.constraints.minPrice, state.constraints.maxPrice);
  const hasAnswers = state.questionOrder.length > 0;

  const candidateEntries = useMemo(
    () => buildCandidateEntries(state.mode, evaluation, state.constraints, primaryType),
    [evaluation, state.constraints, primaryType, state.mode]
  );

  const handleSelect = (question: Question, option: QuestionOption) => {
    const nextState = registerAnswer(state, question, option);
    setState(nextState);
    setErrorMessage(null);

    const nextActiveQuestions = buildActiveQuestions(dynamicQuestionSet, nextState);
    const shouldFinish = isDiagnosisComplete(nextState, nextActiveQuestions);
    const nextQuestionId = findNextQuestionId(dynamicQuestionSet, nextState);

    if (shouldFinish || !nextQuestionId) {
      setCurrentQuestionId(undefined);
    } else {
      setCurrentQuestionId(nextQuestionId);
    }
  };

  const handleOptionSelect = (optionKey: string) => {
    if (!currentQuestion) return;
    const option = currentQuestion.options.find((item) => item.key === optionKey);
    if (!option) return;
    handleSelect(currentQuestion, option);
  };

  const handleNext = () => {
    if (!currentQuestion) return;
    if (!state.answers[currentQuestion.id]) {
      setErrorMessage("選択肢をひとつ選んでから次へ進んでください。");
      return;
    }

    const nextQuestionId = findNextQuestionId(dynamicQuestionSet, state);
    if (!nextQuestionId) {
      setCurrentQuestionId(undefined);
      return;
    }
    setCurrentQuestionId(nextQuestionId);
  };

  const handlePrev = () => {
    if (!currentQuestion) return;
    const currentIndex = activeQuestions.findIndex((item) => item.id === currentQuestion.id);
    if (currentIndex <= 0) return;
    setCurrentQuestionId(activeQuestions[currentIndex - 1]?.id);
  };

  const handleReset = () => {
    const initialState = createInitialDiagnosisState();
    setState(initialState);
    setCurrentQuestionId(dynamicQuestionSet.questions[0]?.id);
    setErrorMessage(null);
    setCopied(false);
  };

  const handleCopyShareUrl = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy share URL", error);
      setErrorMessage("リンクのコピーに失敗しました。手動でコピーしてください。");
    }
  };

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex flex-col gap-8">
          <header className="flex flex-col gap-4 text-center sm:text-left">
            <span className="badge badge-primary self-center sm:self-start">Dynamic</span>
            <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">用途最適ドローン診断</h1>
            <p className="text-base text-muted">
              目的と予算を起点に、必要な質問だけを順番にお伺いします。ライトユーザーは最短3問、
              プロ用途でも最大7問で結果をご案内します。
            </p>
          </header>

          {!diagnosisComplete && currentQuestion ? (
            <section className="flex flex-col gap-6 rounded-3xl bg-white p-8 shadow-xl shadow-sky-100">
              <ProgressBar
                current={Number.isFinite(answeredCount) ? answeredCount + 1 : 1}
                total={Math.max(totalQuestions, answeredCount + 1)}
                label="診断進捗"
              />
              <QuestionCard
                question={currentQuestion}
                selectedKey={state.answers[currentQuestion.id]}
                onSelect={handleOptionSelect}
              />
              {errorMessage ? (
                <p className="text-sm font-semibold text-danger">{errorMessage}</p>
              ) : null}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={handlePrev}
                    className="rounded-full border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-primary hover:text-primary disabled:opacity-40"
                    disabled={answeredCount === 0}
                  >
                    前の質問へ
                  </button>
                  <button
                    type="button"
                    onClick={handleNext}
                    className="rounded-full bg-primary px-8 py-3 text-sm font-semibold text-white transition hover:bg-sky-500"
                  >
                    {findNextQuestionId(dynamicQuestionSet, state)
                      ? "次の質問へ"
                      : "診断結果を見る"}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={handleReset}
                  className="rounded-full border border-danger px-6 py-3 text-sm font-semibold text-danger transition hover:bg-danger hover:text-white"
                >
                  診断を最初からやり直す
                </button>
              </div>
            </section>
          ) : null}

          {diagnosisComplete ? (
            <section className="flex flex-col gap-8">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">診断結果</h2>
                  <p className="text-sm text-muted">
                    回答内容に基づき、最適なタイプとおすすめ機体をご提案します。
                    {budgetLabel ? ` 選択予算帯：${budgetLabel}` : ""}
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Link
                    href="/"
                    className="rounded-full border border-slate-300 px-5 py-2 text-sm font-semibold text-slate-700 transition hover:border-primary hover:text-primary"
                  >
                    トップへ戻る
                  </Link>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="rounded-full border border-danger px-5 py-2 text-sm font-semibold text-danger transition hover:bg-danger hover:text-white"
                  >
                    もう一度診断する
                  </button>
                </div>
              </div>

              {typeDetail ? (
                <ResultCard
                  typeLabel={typeDetail.label}
                  template={resultTemplate}
                  primaryModel={modelSelection.primary}
                  alternativeModels={modelSelection.alternatives}
                  score={evaluation.primary?.score}
                />
              ) : (
                <div className="rounded-3xl bg-white p-8 text-slate-700 shadow">
                  診断結果を確定できませんでした。回答を追加してから再度お試しください。
                </div>
              )}

              {modelSelection.note ? (
                <div className="rounded-3xl bg-slate-50 p-4 text-sm text-slate-700">
                  {modelSelection.note}
                </div>
              ) : null}

              {resultTemplate ? (
                <CTAButtons
                  primary={resultTemplate.cta}
                  secondary={resultTemplate.secondaryCta}
                />
              ) : null}

              <section className="rounded-3xl bg-white p-6 shadow">
                <h3 className="text-lg font-semibold text-slate-900">結果を共有する</h3>
                <p className="mt-1 text-sm text-muted">
                  チームメンバーやお客様と診断結果を共有する際は以下のリンクをご活用ください。
                </p>
                <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <code className="rounded-full bg-slate-100 px-4 py-2 text-xs text-slate-700">
                    {shareUrl || "結果確定後にリンクが表示されます"}
                  </code>
                  <button
                    type="button"
                    onClick={handleCopyShareUrl}
                    disabled={!shareUrl}
                    className="rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 transition disabled:opacity-40 hover:border-primary hover:text-primary"
                  >
                    {copied ? "コピー済み" : "リンクをコピー"}
                  </button>
                </div>
              </section>

              <section className="rounded-3xl bg-white p-6 shadow">
                <h3 className="text-lg font-semibold text-slate-900">スコア内訳</h3>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {evaluation.ranked.map(({ type, score }) => {
                    const detail = catalog.types[type];
                    if (!detail) return null;
                    return (
                      <div
                        key={type}
                        className="flex flex-col gap-1 rounded-2xl border border-slate-200 px-4 py-4"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-slate-500">
                            {detail.label}
                          </span>
                          <span className="text-lg font-bold text-slate-900">
                            {score.toFixed(1)}
                          </span>
                        </div>
                        <p className="text-xs text-muted">{detail.summary}</p>
                      </div>
                    );
                  })}
                </div>
              </section>
            </section>
          ) : null}

          <section className="rounded-3xl bg-white p-6 shadow">
            <h3 className="text-lg font-semibold text-slate-900">診断の進め方</h3>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-700">
              <li>最初に目的と予算をお伺いし、ライト／プロモードを自動判定します。</li>
              <li>ライトモードは最短3問で完了。プロモードは最大7問で詳細要件を把握します。</li>
              <li>診断途中でリセットしたい場合は「診断を最初からやり直す」を押してください。</li>
            </ul>
          </section>
        </div>

        <CandidatePanel
          candidates={candidateEntries}
          constraints={state.constraints}
          mode={state.mode}
          hasAnswers={hasAnswers}
        />
      </div>
    </main>
  );
}
