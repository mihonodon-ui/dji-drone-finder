"use client";

import clsx from "clsx";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import QuestionCard from "@/components/QuestionCard";
import ProgressBar from "@/components/ProgressBar";
import {
  catalog,
  resolveAlternativeModels,
  resolvePrimaryModel,
  step1QuestionSet
} from "@/lib/datasets";
import { evaluateQuestionSet } from "@/lib/scoring";
import type {
  AnswerMap,
  CatalogModel,
  CatalogType,
  DroneTypeKey,
  Question,
  QuestionOption
} from "@/lib/types";

const questions = step1QuestionSet.questions;
const totalQuestions = questions.length;
const typeEntries = Object.entries(catalog.types) as [DroneTypeKey, CatalogType][];
const defaultType: DroneTypeKey = (typeEntries[0]?.[0] as DroneTypeKey) ?? "hobby";

type PreferredWeight = "under100" | "over100" | undefined;

type TypeCardProps = {
  typeKey: DroneTypeKey;
  typeDetail: CatalogType;
  primaryModel?: CatalogModel;
  isSelected: boolean;
  onSelect: () => void;
};

function getWeightPreference(answerMap: AnswerMap): PreferredWeight {
  const permitAnswer = answerMap["s1_permit"];
  if (permitAnswer === "A") return "under100";
  if (permitAnswer === "B") return "over100";
  return undefined;
}

function buildStep2Link(type: DroneTypeKey, weightPref?: PreferredWeight) {
  const params = new URLSearchParams();
  params.set("prefType", type);
  if (weightPref) {
    params.set("prefWeight", weightPref);
  }
  return `/diagnose?${params.toString()}`;
}

function TypeCard({ typeKey, typeDetail, primaryModel, isSelected, onSelect }: TypeCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={clsx(
        "flex h-full flex-col gap-3 rounded-3xl border px-5 py-5 text-left transition",
        isSelected
          ? "border-primary bg-sky-50 shadow-lg shadow-sky-100"
          : "border-slate-200 bg-white hover:border-primary hover:shadow-md"
      )}
    >
      <div
        className={clsx(
          "w-full rounded-2xl px-4 py-3 text-left transition",
          isSelected
            ? "bg-gradient-to-r from-primary/20 via-primary/10 to-sky-100"
            : "bg-slate-100"
        )}
      >
        <span className="text-xs font-semibold uppercase tracking-wide text-primary">
          用途タイプ
        </span>
        <h3 className="mt-1 text-lg font-bold text-slate-900">{typeDetail.label}</h3>
      </div>
      <p className="text-sm text-slate-600 line-clamp-3">{typeDetail.summary}</p>
      {primaryModel ? (
        <div className="rounded-2xl bg-slate-50 p-4 text-xs text-slate-600">
          <p className="font-semibold text-slate-900">推奨機体：{primaryModel.name}</p>
          <p>
            目安価格：
            {primaryModel.priceJPY.min.toLocaleString("ja-JP")}〜
            {primaryModel.priceJPY.max.toLocaleString("ja-JP")}円
          </p>
        </div>
      ) : null}
      <span className="mt-auto text-xs font-semibold text-primary">タイプを選択</span>
    </button>
  );
}

export default function Step1Page() {
  const [selectedType, setSelectedType] = useState<DroneTypeKey>(defaultType);
  const [preferredWeight, setPreferredWeight] = useState<PreferredWeight>(undefined);
  const [showSurvey, setShowSurvey] = useState(false);
  const [modalType, setModalType] = useState<DroneTypeKey | null>(null);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<AnswerMap>({});

  const surveyComplete = currentIndex >= totalQuestions;
  const activeQuestion: Question | undefined = !surveyComplete
    ? questions[currentIndex]
    : undefined;

  const evaluation = useMemo(() => {
    if (!showSurvey || !surveyComplete) return null;
    return evaluateQuestionSet(step1QuestionSet, answers, { closenessThreshold: 1 });
  }, [showSurvey, surveyComplete, answers]);

  const weightFromAnswers = getWeightPreference(answers);

  const topTypes = useMemo(() => {
    if (!evaluation) return [];
    return evaluation.ranked.filter((entry) => entry.score > 0).slice(0, 5);
  }, [evaluation]);

  useEffect(() => {
    if (!showSurvey || !evaluation || !surveyComplete) return;
    const firstType = topTypes[0]?.type;
    if (firstType && firstType !== selectedType) {
      setSelectedType(firstType);
    }
    if (weightFromAnswers && weightFromAnswers !== preferredWeight) {
      setPreferredWeight(weightFromAnswers);
    }
  }, [showSurvey, surveyComplete, evaluation, topTypes, weightFromAnswers, selectedType, preferredWeight]);

  useEffect(() => {
    if (!modalType) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setModalType(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [modalType]);

  const handleTypeSelection = (type: DroneTypeKey, options?: { silent?: boolean }) => {
    setSelectedType(type);
    if (!options?.silent) {
      setModalType(type);
    }
  };

  const closeModal = () => setModalType(null);

  const selectedTypeDetail = catalog.types[selectedType];
  const primaryModel = resolvePrimaryModel(selectedType);
  const alternativeModels = useMemo(
    () => resolveAlternativeModels(selectedType).slice(0, 5),
    [selectedType]
  );

  const modalTypeDetail = modalType ? catalog.types[modalType] : null;
  const modalPrimaryModel = modalType ? resolvePrimaryModel(modalType) : undefined;
  const modalAlternativeModels = modalType
    ? resolveAlternativeModels(modalType).slice(0, 3)
    : [];
  const modalStep2Url = modalType ? buildStep2Link(modalType, preferredWeight) : "#";

  const step2Url = buildStep2Link(selectedType, preferredWeight);

  const weightNote =
    preferredWeight === "under100"
      ? "100g未満のマイクロドローンを優先しています。用途によっては性能や飛行時間に制約があります。"
      : preferredWeight === "over100"
        ? "許可・承認を取得する前提で性能を優先しています。"
        : "許可・承認の有無は STEP2 でヒアリングできます。";

  const progressStep = surveyComplete ? totalQuestions : currentIndex + 1;

  function handleOptionSelect(question: Question, option: QuestionOption) {
    setAnswers((prev) => ({ ...prev, [question.id]: option.key }));
    if (currentIndex + 1 < totalQuestions) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setCurrentIndex(totalQuestions);
    }
  }

  function handleSurveyBack() {
    if (currentIndex === 0) return;
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  }

  function handleSurveyReset() {
    setAnswers({});
    setCurrentIndex(0);
    setPreferredWeight(undefined);
  }

  const handleToggleSurvey = () => {
    if (showSurvey) {
      handleSurveyReset();
      setShowSurvey(false);
    } else {
      setModalType(null);
      setShowSurvey(true);
    }
  };

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-6xl flex-col gap-10 px-6 py-12">
      <header className="flex flex-col gap-2 text-center sm:text-left">
        <span className="badge badge-primary w-fit">STEP 1</span>
        <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">
          用途に合わせてタイプを選びましょう
        </h1>
        <p className="text-base text-muted sm:text-lg">
          気になるタイプカードを選ぶと概要と推奨機体が表示されます。迷った方はページ下部の質問形式で診断することもできます。
        </p>
      </header>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="grid gap-4 md:grid-cols-2">
          {typeEntries.map(([typeKey, typeDetail]) => (
            <TypeCard
              key={typeKey}
              typeKey={typeKey}
              typeDetail={typeDetail}
              primaryModel={resolvePrimaryModel(typeKey)}
              isSelected={selectedType === typeKey}
              onSelect={() => handleTypeSelection(typeKey)}
            />
          ))}
        </div>

        <aside className="flex h-fit flex-col gap-4 rounded-3xl bg-white p-6 shadow-xl shadow-sky-100">
          <span className="badge badge-primary w-fit text-xs font-semibold">選択中のタイプ</span>
          <h2 className="text-2xl font-bold text-slate-900">{selectedTypeDetail.label}</h2>
          <p className="text-sm text-slate-600">{selectedTypeDetail.summary}</p>

          <p className="text-xs text-slate-500">{weightNote}</p>

          <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
            <p className="font-semibold text-slate-900">
              推奨機体：{primaryModel ? primaryModel.name : "選定中"}
            </p>
            {primaryModel ? (
              <p className="text-xs text-slate-500">
                目安価格：
                {primaryModel.priceJPY.min.toLocaleString("ja-JP")}〜
                {primaryModel.priceJPY.max.toLocaleString("ja-JP")}円
              </p>
            ) : null}
          </div>

          {alternativeModels.length ? (
            <div className="rounded-2xl border border-dashed border-slate-200 p-4">
              <p className="text-xs font-semibold text-slate-500">その他の候補</p>
              <ul className="mt-2 space-y-1 text-xs text-slate-600">
                {alternativeModels.map((model) => (
                  <li key={model.id}>{model.name}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="mt-2 flex flex-col gap-2 text-xs font-semibold">
            <Link
              href="/lineup#micro"
              className="text-primary hover:underline"
            >
              100g未満の機体一覧を確認する
            </Link>
            <Link
              href="/lineup"
              className="text-primary hover:underline"
            >
              診断で使う全ラインナップを見る
            </Link>
          </div>

          <div className="mt-2 flex flex-wrap gap-3">
            <Link
              href={step2Url}
              className="rounded-full bg-primary px-6 py-2 text-sm font-semibold text-white transition hover:bg-sky-500"
            >
              STEP2 詳細診断へ進む
            </Link>
            <Link
              href={`/result/${selectedType}`}
              className="rounded-full border border-slate-300 px-6 py-2 text-sm font-semibold text-slate-600 transition hover:border-primary hover:text-primary"
            >
              タイプ概要を見る
            </Link>
          </div>
        </aside>
      </section>

      <section className="rounded-3xl bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">用途がまだ曖昧な方はこちら</h2>
            <p className="text-sm text-muted">
              質問形式でタイプを提案する簡易診断もご利用いただけます。
            </p>
          </div>
          <button
            type="button"
            onClick={handleToggleSurvey}
            className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-primary hover:text-primary"
          >
            {showSurvey ? "質問診断を閉じる" : "質問でタイプ診断を行う"}
          </button>
        </div>

        {showSurvey ? (
          <div className="mt-6 flex flex-col gap-6">
            {!surveyComplete && activeQuestion ? (
              <div className="flex flex-col gap-4 rounded-3xl bg-slate-50 p-6">
                <ProgressBar
                  current={progressStep}
                  total={totalQuestions}
                  label="診断進捗"
                />
                <QuestionCard
                  question={activeQuestion}
                  selectedKey={answers[activeQuestion.id]}
                  onSelect={(optionKey) => {
                    const option = activeQuestion.options.find((opt) => opt.key === optionKey);
                    if (option) {
                      handleOptionSelect(activeQuestion, option);
                    }
                  }}
                />
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={handleSurveyBack}
                    className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-primary hover:text-primary disabled:opacity-40"
                    disabled={currentIndex === 0}
                  >
                    前の質問へ戻る
                  </button>
                  <span className="text-xs text-slate-500">
                    回答すると自動で次へ進みます
                  </span>
                </div>
              </div>
            ) : null}

            {surveyComplete && evaluation ? (
              <div className="flex flex-col gap-4 rounded-3xl bg-slate-50 p-6">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">診断結果</h3>
                  <p className="text-sm text-muted">
                    上位タイプを STEP1 のセレクションに適用できます。気になるタイプのボタンを押してください。
                  </p>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  {topTypes.map((entry, index) => {
                    const typeDetail = catalog.types[entry.type];
                    return (
                      <div
                        key={entry.type}
                        className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4"
                      >
                        <span className="badge badge-primary w-fit bg-sky-100 text-xs font-semibold text-primary">
                          候補 {index + 1}
                        </span>
                        <p className="text-sm font-semibold text-slate-900">{typeDetail.label}</p>
                        <p className="text-xs text-slate-600 line-clamp-3">{typeDetail.summary}</p>
                        <div className="flex items-center justify-between text-xs text-slate-500">
                          <span>スコア {entry.score.toFixed(1)}</span>
                          <button
                            type="button"
                            onClick={() => {
                              handleTypeSelection(entry.type);
                              if (weightFromAnswers) {
                                setPreferredWeight(weightFromAnswers);
                              }
                              setShowSurvey(false);
                            }}
                            className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-white transition hover:bg-sky-500"
                          >
                            このタイプを選択
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={handleSurveyReset}
                    className="rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-primary hover:text-primary"
                  >
                    回答をやり直す
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowSurvey(false);
                    }}
                    className="rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-primary hover:text-primary"
                  >
                    診断結果を閉じる
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
      </section>

      {modalTypeDetail ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 py-8"
          onClick={closeModal}
          role="presentation"
        >
          <div
            className="relative w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={closeModal}
              className="absolute right-4 top-4 rounded-full border border-slate-300 p-2 text-xs text-slate-500 transition hover:border-primary hover:text-primary"
              aria-label="モーダルを閉じる"
            >
              ×
            </button>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <span className="badge badge-primary w-fit bg-sky-100 text-xs font-semibold text-primary">
                  タイプ概要
                </span>
                <h3 className="text-xl font-semibold text-slate-900">
                  {modalTypeDetail.label}
                </h3>
                <p className="text-sm text-slate-600">{modalTypeDetail.summary}</p>
              </div>

              {modalPrimaryModel ? (
                <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
                  <p className="font-semibold text-slate-900">
                    推奨機体：{modalPrimaryModel.name}
                  </p>
                  <p className="text-xs text-slate-500">
                    目安価格：
                    {modalPrimaryModel.priceJPY.min.toLocaleString("ja-JP")}〜
                    {modalPrimaryModel.priceJPY.max.toLocaleString("ja-JP")}円
                  </p>
                  <p className="mt-2 text-xs text-slate-500">
                    STEP2 では回答に応じて最終的な 1 機種を提示します。
                  </p>
                </div>
              ) : null}

              {modalAlternativeModels.length ? (
                <div className="rounded-2xl border border-dashed border-slate-200 p-4">
                  <p className="text-xs font-semibold text-slate-500">その他の候補</p>
                  <ul className="mt-2 space-y-1 text-xs text-slate-600">
                    {modalAlternativeModels.map((model) => (
                      <li key={model.id}>{model.name}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <div className="flex flex-col gap-2 text-xs text-slate-500">
                <Link href="/lineup#micro" className="font-semibold text-primary hover:underline">
                  100g未満の機体ラインナップを見る
                </Link>
                <Link href="/lineup" className="font-semibold text-primary hover:underline">
                  診断で使用する全機体ラインナップを見る
                </Link>
              </div>

              <div className="mt-2 flex flex-wrap gap-3">
                <Link
                  href={modalStep2Url}
                  className="rounded-full bg-primary px-6 py-2 text-sm font-semibold text-white transition hover:bg-sky-500"
                >
                  STEP2 詳細診断へ進む
                </Link>
                <Link
                  href={`/result/${modalType ?? selectedType}`}
                  className="rounded-full border border-slate-300 px-6 py-2 text-sm font-semibold text-slate-600 transition hover:border-primary hover:text-primary"
                >
                  タイプの結果テンプレートを見る
                </Link>
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-full border border-slate-300 px-6 py-2 text-sm font-semibold text-slate-600 transition hover:border-primary hover:text-primary"
                >
                  閉じる
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}


