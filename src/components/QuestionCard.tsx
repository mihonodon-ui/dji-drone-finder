"use client";

import clsx from "clsx";
import type { Question } from "@/lib/types";

interface QuestionCardProps {
  question: Question;
  selectedKey?: string;
  onSelect: (optionKey: string) => void;
}

export function QuestionCard({ question, selectedKey, onSelect }: QuestionCardProps) {
  return (
    <div className="w-full rounded-3xl bg-white p-8 shadow-xl shadow-sky-100">
      <h2 className="text-2xl font-semibold text-slate-900">{question.text}</h2>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {question.options.map((option) => {
          const isSelected = option.key === selectedKey;
          return (
            <button
              type="button"
              key={option.key}
              onClick={() => onSelect(option.key)}
              className={clsx(
                "rounded-2xl border px-5 py-4 text-left transition focus-visible:ring-4 focus-visible:ring-sky-200",
                isSelected
                  ? "border-transparent bg-primary text-white shadow-lg shadow-sky-200"
                  : "border-slate-200 bg-white text-slate-700 hover:border-primary hover:text-primary"
              )}
            >
              <span className="text-sm font-semibold tracking-wide text-slate-500">
                選択肢 {option.key}
              </span>
              <p className="mt-1 text-base font-medium">{option.label}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default QuestionCard;

