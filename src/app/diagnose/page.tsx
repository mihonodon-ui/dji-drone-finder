"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import CTAButtons from "@/components/CTAButtons";
import ProgressBar from "@/components/ProgressBar";
import QuestionCard from "@/components/QuestionCard";
import ResultCard from "@/components/ResultCard";
import {
  catalog,
  dynamicQuestionSet,
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
import type { DroneTypeKey, Question, QuestionOption } from "@/lib/types";

function formatPriceRange(min?: number, max?: number) {
  if (!min && !max) return null;
  if (min && max) {
    return `${min.toLocaleString("ja-JP")}〜${max.toLocaleString("ja-JP")}円`;
  }
  if (min) return `${min.toLocaleString("ja-JP")}円以上`;
  if (max) return `${max.toLocaleString("ja-JP")}円以下`;
  return null;
}

function selectModelsWithBudget(type: DroneTypeKey, maxPrice?: number, minPrice?: number) {
  const typeDetail = catalog.types[type];
  if (!typeDetail) {
    return {
      primary: undefined,
      alternatives: [],
      note: undefined
    };
  }

  const primary = resolvePrimaryModel(type);
  const alternatives = resolveAlternativeModels(type);
  const candidates = [primary, ...alternatives].filter(
    (model): model is NonNullable<typeof model> => Boolean(model)
  );

  const affordable = candidates.filter((model) => {
    const { min, max } = model.priceJPY;
    if (typeof maxPrice === "number" && min > maxPrice) {
      return false;
    }
    if (typeof minPrice === "number" && max < minPrice) {
      return false;
    }
    return true;
  });

  if (!affordable.length) {
    return {
      primary,
      alternatives,
      note: maxPrice ? "ご選択の予算帯では該当モデルが見つかりませんでした。" : undefined
    };
  }

  const [first, ...rest] = affordable;
  const note =
    primary && first.id !== primary.id
      ? "予算に合わせて代替候補をメインとして表示しています。"
      : undefined;

  return {
    primary: first,
    alternatives: rest,
    note
  };
}

export default function DiagnosePage() {
  const [state, setState] = useState<DiagnosisState>(createInitialDiagnosisState());
  const [currentQuestionId, setCurrentQuestionId] = useState<string | undefined>(
    dynamicQuestionSet.questions[0]?.id
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const activeQuestions = useMemo(
    () => buildActiveQuestions(dynamicQuestionSet, state.mode),
    [state.mode]
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
  const models = primaryType
    ? selectModelsWithBudget(primaryType, state.constraints.maxPrice, state.constraints.minPrice)
    : { primary: undefined, alternatives: [], note: undefined };
  const resultTemplate = primaryType ? resolveResultTemplate(primaryType) : undefined;

  const shareUrl =
    typeof window !== "undefined" && primaryType
      ? `${window.location.origin}/result/${primaryType}`
      : primaryType
        ? `/result/${primaryType}`
        : "";

  const budgetLabel = formatPriceRange(state.constraints.minPrice, state.constraints.maxPrice);

  const handleSelect = (question: Question, option: QuestionOption) => {
    const nextState = registerAnswer(state, question, option);
    setState(nextState);
    setErrorMessage(null);

    const nextActiveQuestions = buildActiveQuestions(dynamicQuestionSet, nextState.mode);
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

  const handleReset = () => {
    setState(createInitialDiagnosisState());
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
    <main className="mx-auto flex max-w-5xl flex-col gap-10 px-6 py-12">
      <header className="flex flex-col gap-4 text-center sm:text-left">
        <span className="badge badge-primary self-center sm:self-start">Dynamic</span>
        <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">
          最適な DJI ドローン診断
        </h1>
        <p className="text-base text-muted">
          目的と予算を起点に、必要な機能だけを順番にお伺いします。ライトユーザーは最短3問、プロ用途でも最大7問で結果をご案内します。
        </p>
      </header>

      {!diagnosisComplete && currentQuestion ? (
        <>
          <ProgressBar
            current={answeredCount + 1}
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
            <button
              type="button"
              onClick={handleReset}
              className="rounded-full border border-danger px-6 py-3 text-sm font-semibold text-danger transition hover:bg-danger hover:text-white"
            >
              診断を最初からやり直す
            </button>
            <span className="text-xs text-muted">
              現在のモード：{state.mode === "unknown" ? "診断中" : state.mode === "light" ? "ライト" : "プロ"}
            </span>
          </div>
        </>
      ) : null}

      {diagnosisComplete ? (
        <section className="flex flex-col gap-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">診断結果</h2>
              <p className="text-sm text-muted">
                回答内容に基づき、最適なタイプとおすすめ機体をご提案します。
                {budgetLabel ? ` ご選択の予算帯：${budgetLabel}` : ""}
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
              primaryModel={models.primary}
              alternativeModels={models.alternatives}
              score={evaluation.primary?.score}
            />
          ) : (
            <div className="rounded-3xl bg-white p-8 text-slate-700 shadow">
              診断結果を確定できませんでした。回答をリセットして再度お試しください。
            </div>
          )}

          {models.note ? (
            <div className="rounded-3xl bg-slate-50 p-4 text-sm text-slate-700">{models.note}</div>
          ) : null}

          {resultTemplate ? (
            <CTAButtons primary={resultTemplate.cta} secondary={resultTemplate.secondaryCta} />
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
                      <span className="text-sm font-semibold text-slate-500">{detail.label}</span>
                      <span className="text-lg font-bold text-slate-900">{score.toFixed(1)}</span>
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
          <li>最初に目的と予算をお伺いし、ライト/プロモードを自動判定します。</li>
          <li>ライトモードは最短3問で完了。プロモードは最大7問で詳しい要件を把握します。</li>
          <li>診断途中でリセットしたい場合は「診断を最初からやり直す」を押してください。</li>
        </ul>
      </section>
    </main>
  );
}
