"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import QuestionCard from "@/components/QuestionCard";
import ProgressBar from "@/components/ProgressBar";
import ResultCard from "@/components/ResultCard";
import CTAButtons from "@/components/CTAButtons";
import {
  catalog,
  resolveAlternativeModels,
  resolvePrimaryModel,
  resolveResultTemplate,
  step1QuestionSet
} from "@/lib/datasets";
import { evaluateQuestionSet } from "@/lib/scoring";
import type { AnswerMap } from "@/lib/types";

const { questions, title } = step1QuestionSet;

export default function Step1Page() {
  const totalQuestions = questions.length;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [showResult, setShowResult] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const currentQuestion = questions[currentIndex];

  const evaluation = useMemo(
    () => evaluateQuestionSet(step1QuestionSet, answers),
    [answers]
  );

  const selectedKey = currentQuestion ? answers[currentQuestion.id] : undefined;
  const isCompleted = Object.keys(answers).length === totalQuestions;

  const primaryType = evaluation.primary?.type;
  const typeDetail = primaryType ? catalog.types[primaryType] : undefined;
  const primaryModel = primaryType ? resolvePrimaryModel(primaryType) : undefined;
  const alternativeModels = primaryType
    ? resolveAlternativeModels(primaryType)
    : [];
  const resultTemplate = primaryType ? resolveResultTemplate(primaryType) : undefined;

  const handleSelect = (optionKey: string) => {
    if (!currentQuestion) return;
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: optionKey
    }));
    setErrorMessage(null);
  };

  const handleNext = () => {
    if (!currentQuestion) return;
    if (!answers[currentQuestion.id]) {
      setErrorMessage("選択肢をひとつ選んでから次へ進んでください。");
      return;
    }
    if (currentIndex === totalQuestions - 1) {
      setShowResult(true);
      return;
    }
    setCurrentIndex((idx) => Math.min(idx + 1, totalQuestions - 1));
  };

  const handlePrev = () => {
    setCurrentIndex((idx) => Math.max(idx - 1, 0));
  };

  const handleReset = () => {
    setAnswers({});
    setCurrentIndex(0);
    setShowResult(false);
    setErrorMessage(null);
  };

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-10 px-6 py-12">
      <header className="flex flex-col gap-4 text-center sm:text-left">
        <span className="badge badge-primary self-center sm:self-start">STEP 1</span>
        <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">{title}</h1>
        <p className="text-base text-muted">
          5問に回答すると、あなたに近い用途タイプとおすすめの DJI 機種を提示します。
          選び直しはいつでも可能です。
        </p>
      </header>

      {!showResult && currentQuestion ? (
        <>
          <ProgressBar
            current={Number.isFinite(currentIndex) ? currentIndex + 1 : 1}
            total={totalQuestions}
            label="診断進捗"
          />
          <QuestionCard
            question={currentQuestion}
            selectedKey={selectedKey}
            onSelect={handleSelect}
          />
          {errorMessage ? (
            <p className="text-sm font-semibold text-danger">{errorMessage}</p>
          ) : null}
          <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:justify-between">
            <button
              type="button"
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className="rounded-full border border-slate-300 px-6 py-3 font-semibold text-slate-600 transition disabled:opacity-40 hover:border-primary hover:text-primary"
            >
              前の質問へ
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="rounded-full bg-primary px-8 py-3 font-semibold text-white transition hover:bg-sky-500"
            >
              {currentIndex === totalQuestions - 1 ? "結果を見る" : "次の質問へ"}
            </button>
          </div>
          {isCompleted ? (
            <div className="mt-6 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
              全ての質問に回答済みです。「結果を見る」で診断結果を表示します。
            </div>
          ) : null}
        </>
      ) : null}

      {showResult ? (
        <section className="flex flex-col gap-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">ライト診断結果</h2>
              <p className="text-sm text-muted">
                スコアが高かったタイプを表示しています。差が小さい場合はセカンド候補も参考にしてください。
              </p>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowResult(false)}
                className="rounded-full border border-slate-300 px-5 py-2 text-sm font-semibold text-slate-700 transition hover:border-primary hover:text-primary"
              >
                回答を見直す
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="rounded-full border border-danger px-5 py-2 text-sm font-semibold text-danger transition hover:bg-danger hover:text-white"
              >
                診断をやり直す
              </button>
            </div>
          </div>

          {primaryType && typeDetail ? (
            <ResultCard
              typeLabel={typeDetail.label}
              template={resultTemplate}
              primaryModel={primaryModel}
              alternativeModels={alternativeModels}
              score={evaluation.primary?.score}
            />
          ) : (
            <div className="rounded-3xl bg-white p-8 text-slate-700 shadow">
              まだ十分な回答が得られていません。回答を追加してから再度お試しください。
            </div>
          )}

          {resultTemplate ? (
            <CTAButtons primary={resultTemplate.cta} secondary={resultTemplate.secondaryCta} />
          ) : null}

          <section className="rounded-3xl bg-white p-6 shadow">
            <h3 className="text-lg font-semibold text-slate-900">スコア内訳</h3>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {evaluation.ranked.map(({ type, score }) => {
                const detail = catalog.types[type];
                if (!detail) return null;
                return (
                  <div
                    key={type}
                    className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3"
                  >
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-slate-500">{detail.label}</span>
                      <span className="text-xs text-muted">{detail.summary}</span>
                    </div>
                    <span className="text-lg font-bold text-slate-900">{score.toFixed(1)}</span>
                  </div>
                );
              })}
            </div>
          </section>

          {evaluation.secondary.length ? (
            <section className="rounded-3xl bg-slate-50 p-6">
              <h3 className="text-lg font-semibold text-slate-900">セカンド候補</h3>
              <p className="mt-1 text-sm text-muted">
                スコア差が小さいタイプです。STEP2 プロ診断で詳細な要件を確認しましょう。
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                {evaluation.secondary.map(({ type }) => {
                  const detail = catalog.types[type];
                  return detail ? (
                    <span
                      key={type}
                      className="badge badge-success border border-success/40 bg-transparent text-success"
                    >
                      {detail.label}
                    </span>
                  ) : null;
                })}
              </div>
            </section>
          ) : null}

          <section className="rounded-3xl bg-white p-6 shadow">
            <h3 className="text-lg font-semibold text-slate-900">次のステップ</h3>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-700">
              <li>
                プロ診断（STEP2）で予算・センサー要件などを入力し、確度の高い機種提案を受けましょう。
              </li>
              <li>
                結果ページをブックマークしてチームと共有。JSON
                データ差し替えで最新カタログにも即対応できます。
              </li>
            </ul>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href="/"
                className="rounded-full border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-primary hover:text-primary"
              >
                ホームへ戻る
              </Link>
              <Link
                href="/step2"
                className="rounded-full border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-primary hover:text-primary"
              >
                プロ診断へ進む
              </Link>
            </div>
          </section>
        </section>
      ) : null}
    </main>
  );
}
