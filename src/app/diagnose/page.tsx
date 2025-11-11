"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import CandidatePanel from "@/components/CandidatePanel";
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
  type DiagnosisState
} from "@/lib/dynamicDiagnosis";
import { evaluateQuestionSet } from "@/lib/scoring";
import type {
  AnswerMap,
  CatalogModel,
  DroneTypeKey,
  Question,
  QuestionOption
} from "@/lib/types";

function formatPriceRange(min?: number, max?: number) {
  if (!min && !max) return null;
  if (min && max) {
    return `${min.toLocaleString("ja-JP")}〜${max.toLocaleString("ja-JP")}円`;
  }
  if (min) return `${min.toLocaleString("ja-JP")}円以上`;
  if (max) return `${max.toLocaleString("ja-JP")}円以下`;
  return null;
}

const questionPoolMap: Record<string, string[]> = {
  hobby_travel_priority: ["mini5pro", "air3s", "mini4k", "mini3", "mini2se", "mini4pro"],
  hobby_vlog_priority: ["mini4pro", "mini5pro", "mini4k", "mini3", "mini2se", "air3s"]
};

function selectModelsWithBudget(type: DroneTypeKey, state: DiagnosisState) {
  const { constraints, preferredModels } = state;
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
  const preferredSet = new Set(preferredModels);
  const preferredMatches = preferredModels
    .map((modelId) => uniqueCandidates.get(modelId))
    .filter((model): model is CatalogModel => Boolean(model));
  const nonPreferred = orderedCandidates.filter((model) => !preferredSet.has(model.id));
  const baseCandidates =
    preferredMatches.length > 0 ? [...preferredMatches, ...nonPreferred] : orderedCandidates;

  if (!baseCandidates.length) {
    return {
      primary: undefined,
      alternatives: [] as ReturnType<typeof resolveAlternativeModels>,
      note: constraints.maxPrice
        ? "予算条件に一致する機種が見つかりませんでした。"
        : undefined
    };
  }

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
  const microCandidates = baseCandidates.filter((model) => isMicroModel(model));
  const standardCandidates = baseCandidates.filter((model) => !isMicroModel(model));

  let prioritizedCandidates: CatalogModel[] = baseCandidates;
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
    prioritizedCandidates[0] ??
    baseCandidates[0] ??
    orderedCandidates[0]!;

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

export default function DiagnosePage() {
  const [state, setState] = useState<DiagnosisState>(createInitialDiagnosisState());
  const [currentQuestionId, setCurrentQuestionId] = useState<string | undefined>(undefined);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [prefTypeKey, setPrefTypeKey] = useState<DroneTypeKey | undefined>(undefined);
  const [prefWeightValue, setPrefWeightValue] = useState<"under100" | "over100" | undefined>();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const typeParam = params.get("prefType");
    const weightParam = params.get("prefWeight");

    if (weightParam === "under100" || weightParam === "over100") {
      setPrefWeightValue(weightParam);
    }

    if (typeParam && Object.prototype.hasOwnProperty.call(catalog.types, typeParam)) {
      setPrefTypeKey(typeParam as DroneTypeKey);
    }
  }, []);

  useEffect(() => {
    if (prefTypeKey === undefined && prefWeightValue === undefined) {
      return;
    }

    setState(createBaseState(prefWeightValue));
    setCurrentQuestionId(dynamicQuestionSet.questions[0]?.id);
    setErrorMessage(null);
    setCopied(false);
  }, [prefTypeKey, prefWeightValue]);

  useEffect(() => {
    if (currentQuestionId) return;
    const nextId = findNextQuestionId(dynamicQuestionSet, state);
    if (nextId) {
      setCurrentQuestionId(nextId);
    }
  }, [state, currentQuestionId]);

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
    ? selectModelsWithBudget(primaryType, state)
    : { primary: undefined, alternatives: [], note: undefined };
  const showFinalModels = diagnosisComplete;
  const finalResultSelection = showFinalModels
    ? modelSelection
    : { primary: undefined, alternatives: [], note: undefined };
  const resultTemplate = primaryType ? resolveResultTemplate(primaryType) : undefined;
  const resultHighlights = showFinalModels
    ? state.resultSummary.filter((item) => Boolean(item))
    : [];

  const shareUrl =
    typeof window !== "undefined" && primaryType
      ? `${window.location.origin}/result/${primaryType}`
      : primaryType
        ? `/result/${primaryType}`
        : "";

  const budgetLabel = formatPriceRange(state.constraints.minPrice, state.constraints.maxPrice);
  const hasAnswers = state.questionOrder.length > 0;

  const preferredModelList = useMemo(() => {
    const models: CatalogModel[] = [];
    state.preferredModels.forEach((modelId) => {
      const found = catalog.models.find((model) => model.id === modelId);
      if (found && !models.find((item) => item.id === found.id)) {
        models.push(found);
      }
    });
    return models;
  }, [state.preferredModels]);

  const candidateModels = useMemo(() => {
    const ordered: CatalogModel[] = [];
    if (modelSelection.primary) {
      ordered.push(modelSelection.primary);
    }
    modelSelection.alternatives.forEach((model) => {
      if (!ordered.find((item) => item.id === model.id)) {
        ordered.push(model);
      }
    });
    return ordered;
  }, [modelSelection.primary, modelSelection.alternatives]);

  const sidebarModels = preferredModelList.length ? preferredModelList : candidateModels;
  const questionPoolModels = useMemo(() => {
    if (!currentQuestion) return [];
    const poolIds = questionPoolMap[currentQuestion.id];
    if (!poolIds) return [];
    const models: CatalogModel[] = [];
    poolIds.forEach((id) => {
      const found = catalog.models.find((model) => model.id === id);
      if (found) {
        models.push(found);
      }
    });
    return models;
  }, [currentQuestion]);
  const galleryModels =
    questionPoolModels.length > 0 ? questionPoolModels : sidebarModels;

  const recommendedType = prefTypeKey ? catalog.types[prefTypeKey] : undefined;
  const weightPreferenceLabel =
    prefWeightValue === "under100"
      ? "100g未満のマイクロドローンを優先"
      : prefWeightValue === "over100"
        ? "100g超でも性能を優先"
        : undefined;

  const handleSelect = (question: Question, option: QuestionOption) => {
    const answers: AnswerMap = { ...state.answers };
    const order = [...state.questionOrder];
    const existingIndex = order.indexOf(question.id);

    if (existingIndex >= 0) {
      order.splice(existingIndex);
      state.questionOrder.slice(existingIndex).forEach((questionId) => {
        delete answers[questionId];
      });
    }

    answers[question.id] = option.key;
    order.push(question.id);

    const nextState = replayAnswers(answers, order, prefWeightValue);
    setState(nextState);
    setErrorMessage(null);

    const nextQuestionId = findNextQuestionId(dynamicQuestionSet, nextState);
    if (nextQuestionId) {
      setCurrentQuestionId(nextQuestionId);
    } else {
      setCurrentQuestionId(undefined);
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
    if (!state.questionOrder.length) return;
    const trimmedOrder = state.questionOrder.slice(0, -1);
    const trimmedAnswers: AnswerMap = { ...state.answers };
    const removed = state.questionOrder.slice(-1);
    removed.forEach((questionId) => {
      delete trimmedAnswers[questionId];
    });
    const rebuiltState = replayAnswers(trimmedAnswers, trimmedOrder, prefWeightValue);
    setState(rebuiltState);
    const targetQuestionId =
      trimmedOrder[trimmedOrder.length - 1] ?? dynamicQuestionSet.questions[0]?.id;
    setCurrentQuestionId(targetQuestionId ?? dynamicQuestionSet.questions[0]?.id);
  };

  const handleReset = () => {
    const base = createBaseState(prefWeightValue);
    setState(base);
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

          {recommendedType ? (
            <div className="rounded-3xl border border-sky-200 bg-sky-50 p-6 text-sm text-slate-700">
              <p className="font-semibold text-slate-900">
                STEP1 推奨タイプ：{recommendedType.label}
              </p>
              <p className="mt-1">{recommendedType.summary}</p>
              {weightPreferenceLabel ? (
                <p className="mt-1 text-xs text-slate-600">{weightPreferenceLabel}</p>
              ) : null}
              <p className="mt-1 text-xs text-slate-500">
                詳細診断では回答に合わせて候補機体が自動で更新されます。
              </p>
            </div>
          ) : null}

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
                  primaryModel={finalResultSelection.primary}
                  alternativeModels={finalResultSelection.alternatives}
                  score={evaluation.primary?.score}
                  resultSummary={resultHighlights}
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
          models={galleryModels}
          constraints={state.constraints}
          hasAnswers={hasAnswers}
          note={modelSelection.note}
        />
      </div>
    </main>
  );
}

function createBaseState(
  preferredWeight?: "under100" | "over100"
): DiagnosisState {
  const base = createInitialDiagnosisState();
  if (preferredWeight) {
    base.constraints = { ...base.constraints, preferredWeight };
  }
  return base;
}

function replayAnswers(
  answers: AnswerMap,
  order: string[],
  preferredWeight?: "under100" | "over100"
) {
  let nextState = createBaseState(preferredWeight);
  const sanitizedOrder: string[] = [];
  order.forEach((questionId) => {
    const answerKey = answers[questionId];
    if (!answerKey) return;
    const question = findQuestionById(dynamicQuestionSet, questionId);
    const option = question?.options.find((item) => item.key === answerKey);
    if (!question || !option) return;
    nextState = registerAnswer(nextState, question, option);
    sanitizedOrder.push(questionId);
  });
  nextState.questionOrder = sanitizedOrder;
  return nextState;
}



