"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import CTAButtons from "@/components/CTAButtons";
import ProgressBar from "@/components/ProgressBar";
import QuestionCard from "@/components/QuestionCard";
import ResultCard from "@/components/ResultCard";
import {
  catalog,
  resolveAlternativeModels,
  resolvePrimaryModel,
  resolveResultTemplate,
  step2QuestionSet
} from "@/lib/datasets";
import { evaluateQuestionSet } from "@/lib/scoring";
import type { AnswerMap, DroneTypeKey } from "@/lib/types";

const { questions, title } = step2QuestionSet;

function buildShareUrl(type: DroneTypeKey | undefined) {
  if (!type) return "";
  if (typeof window === "undefined") {
    return `/result/${type}`;
  }
  const origin = window.location.origin ?? "";
  return `${origin}/result/${type}`;
}

export default function Step2Page() {
  const totalQuestions = questions.length;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [showResult, setShowResult] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const currentQuestion = questions[currentIndex];
  const evaluation = useMemo(
    () => evaluateQuestionSet(step2QuestionSet, answers, { closenessThreshold: 3 }),
    [answers]
  );

  const primaryType = evaluation.primary?.type;
  const typeDetail = primaryType ? catalog.types[primaryType] : undefined;
  const primaryModel = primaryType ? resolvePrimaryModel(primaryType) : undefined;
  const alternativeModels = primaryType
    ? resolveAlternativeModels(primaryType)
    : [];
  const resultTemplate = primaryType ? resolveResultTemplate(primaryType) : undefined;

  const shareUrl = buildShareUrl(primaryType);

  const selectedKey = currentQuestion ? answers[currentQuestion.id] : undefined;
  const isCompleted = Object.keys(answers).length === totalQuestions;

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
      setErrorMessage("選択肢をひとつ選択してください。");
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
    }
  };

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-10 px-6 py-12">
      <header className="flex flex-col gap-3 text-center sm:text-left">
        <span className="badge badge-primary self-center sm:self-start">STEP 2</span>
        <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">{title}</h1>
        <p className="text-base text-muted">
          10問に回答すると用途・センサー要件・自動化ニーズまで反映したおすすめ構成と価格帯をご提案します。
          スコアが近いタイプも合わせて確認し、導入検討の材料にしてください。
        </p>
      </header>

      {!showResult && currentQuestion ? (
        <>
          <ProgressBar
            current={Number.isFinite(currentIndex) ? currentIndex + 1 : 1}
            total={totalQuestions}
            label="診断進捗"
          />
          <div className="rounded-3xl bg-white p-8 shadow-xl shadow-sky-100">
            <QuestionCard
              question={currentQuestion}
              selectedKey={selectedKey}
              onSelect={handleSelect}
            />
            {errorMessage ? (
              <p className="mt-4 text-sm font-semibold text-danger">{errorMessage}</p>
            ) : null}
          </div>
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-between">
            <button
              type="button"
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className="rounded-full border border-slate-300 px-6 py-3 font-semibold text-slate-600 transition disabled:opacity-40 hover:border-primary hover:text-primary"
            >
              前の質問へ
            </button>
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={handleReset}
                className="rounded-full border border-danger px-6 py-3 font-semibold text-danger transition hover:bg-danger hover:text-white"
              >
                回答をリセット
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="rounded-full bg-primary px-8 py-3 font-semibold text-white transition hover:bg-sky-500"
              >
                {currentIndex === totalQuestions - 1 ? "診断結果を見る" : "次の質問へ"}
              </button>
            </div>
          </div>
          {isCompleted ? (
            <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
              全ての質問に回答済みです。「診断結果を見る」で結果を表示します。
            </div>
          ) : null}
          <section className="rounded-3xl bg-white p-6 shadow">
            <h2 className="text-lg font-semibold text-slate-900">目的別のヒント</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-700">
              <li>自動航行や Dock を選択すると警戒・物流タイプのスコアが上がります。</li>
              <li>
                赤外線/RTK を選ぶと点検・測量・農業タイプの優先度が高まります。用途が複数ある場合は補足コメントとしてメモすると共有しやすいです。
              </li>
              <li>
                予算回答はタイブレーク要素です。迷った場合は広めのレンジを選び、結果ページで上位候補を比較しましょう。
              </li>
            </ul>
          </section>
        </>
      ) : null}

      {showResult ? (
        <section className="flex flex-col gap-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">プロ診断結果</h2>
              <p className="text-sm text-muted">
                業務要件を踏まえたおすすめタイプと機種候補です。スコア差が小さいタイプも確認し、必要に応じて体験会や相談に進んでください。
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
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
                再診断を行う
              </button>
              {primaryType ? (
                <Link
                  href={`/result/${primaryType}`}
                  className="rounded-full border border-slate-300 px-5 py-2 text-sm font-semibold text-slate-700 transition hover:border-primary hover:text-primary"
                >
                  結果ページを見る
                </Link>
              ) : null}
            </div>
          </div>

          {primaryType && typeDetail ? (
            <ResultCard
              typeLabel={`${typeDetail.label}タイプ`}
              template={resultTemplate}
              primaryModel={primaryModel}
              alternativeModels={alternativeModels}
              score={evaluation.primary?.score}
            />
          ) : (
            <div className="rounded-3xl bg-white p-8 text-slate-700 shadow">
              まだ十分な回答が得られていません。回答を追加してから再度診断結果をご確認ください。
            </div>
          )}

          {resultTemplate ? (
            <CTAButtons
              primary={resultTemplate.cta}
              secondary={resultTemplate.secondaryCta}
            />
          ) : null}

          <section className="rounded-3xl bg-white p-6 shadow">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">結果を共有する</h3>
                <p className="text-sm text-muted">
                  チームや上長と共有する際は以下のURLをコピーして送付してください。
                </p>
              </div>
              <div className="flex items-center gap-2">
                <code className="rounded-full bg-slate-100 px-4 py-2 text-xs text-slate-700">
                  {shareUrl || "回答を完了すると共有リンクが表示されます"}
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
            </div>
          </section>

          <section className="rounded-3xl bg-white p-6 shadow">
            <h3 className="text-lg font-semibold text-slate-900">スコア内訳</h3>
            <p className="mt-1 text-sm text-muted">
              差が 3 点以内のタイプはセカンド候補として表示しています。現場要件に応じて組み合わせ導入も検討しましょう。
            </p>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {evaluation.ranked.map(({ type, score }) => {
                const detail = catalog.types[type];
                if (!detail) return null;
                const isSecondary = evaluation.secondary.some(
                  (entry) => entry.type === type
                );
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
                    {isSecondary ? (
                      <span className="badge badge-success mt-2 text-xs font-semibold">
                        セカンド候補
                      </span>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </section>

          {evaluation.secondary.length ? (
            <section className="rounded-3xl bg-slate-50 p-6">
              <h3 className="text-lg font-semibold text-slate-900">セカンド候補の活用</h3>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-700">
                <li>
                  プロジェクトのフェーズに合わせて、セカンド候補をバックアップ機種として検討できます。
                </li>
                <li>
                  キャパシティ計画では、メイン機とセカンド候補を組み合わせた冗長構成が効果的です。
                </li>
                <li>
                  導入相談時には、セカンド候補の用途や予算条件も合わせて伝えると提案が具体的になります。
                </li>
              </ul>
            </section>
          ) : null}

          <section className="rounded-3xl bg-white p-6 shadow">
            <h3 className="text-lg font-semibold text-slate-900">次のアクション</h3>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-700">
              <li>
                導入イメージを固めるため、体験会やデモフライトの参加を検討してください。カレンダー連携の CTA
                を用意しておくとスムーズです。
              </li>
              <li>
                問い合わせフォームでは「診断結果：{typeDetail?.label ?? "未選択"}」をプリセットすると回答データと連携しやすくなります。
              </li>
              <li>
                GA4 イベント（`view_result`, `click_consult` など）で診断完了率や CTA クリック率を計測しましょう。
              </li>
            </ul>
          </section>

          <div className="flex flex-wrap gap-4">
            <Link
              href="/step1"
              className="rounded-full border border-slate-300 px-6 py-3 font-semibold text-slate-700 transition hover:border-primary hover:text-primary"
            >
              ライト診断へ戻る
            </Link>
            <Link
              href="/"
              className="rounded-full border border-slate-300 px-6 py-3 font-semibold text-slate-700 transition hover:border-primary hover:text-primary"
            >
              ランディングへ戻る
            </Link>
          </div>
        </section>
      ) : null}
    </main>
  );
}
