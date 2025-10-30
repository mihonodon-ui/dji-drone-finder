import type {
  AnswerMap,
  Question,
  QuestionOption,
  QuestionOptionConstraints,
  QuestionSet
} from "./types";

export type DiagnosisMode = "unknown" | "light" | "pro";

export interface ConstraintState {
  maxPrice?: number;
  minPrice?: number;
  requiredSensors?: string[];
}

export interface DiagnosisState {
  mode: DiagnosisMode;
  constraints: ConstraintState;
  answers: AnswerMap;
  questionOrder: string[];
}

export const initialDiagnosisState: DiagnosisState = {
  mode: "unknown",
  constraints: {},
  answers: {},
  questionOrder: []
};

export function createInitialDiagnosisState(): DiagnosisState {
  return {
    mode: "unknown",
    constraints: {},
    answers: {},
    questionOrder: []
  };
}

const COMMON_SEGMENT = "common";

export function shouldIncludeQuestion(question: Question, mode: DiagnosisMode) {
  const segments = question.targetSegments ?? [COMMON_SEGMENT];
  if (mode === "unknown") {
    return segments.includes(COMMON_SEGMENT);
  }
  return segments.includes(COMMON_SEGMENT) || segments.includes(mode);
}

export function applyOptionEffects(
  state: DiagnosisState,
  option: QuestionOption
): DiagnosisState {
  const nextState: DiagnosisState = {
    ...state,
    mode: option.effects?.setMode ?? state.mode,
    constraints: {
      ...state.constraints,
      ...extractConstraints(option.constraints)
    },
    answers: { ...state.answers },
    questionOrder: [...state.questionOrder]
  };

  return nextState;
}

function extractConstraints(constraints?: QuestionOptionConstraints) {
  if (!constraints) return {};
  return {
    maxPrice: constraints.maxPrice,
    minPrice: constraints.minPrice,
    requiredSensors: constraints.requiredSensors
  };
}

export function registerAnswer(
  state: DiagnosisState,
  question: Question,
  option: QuestionOption
): DiagnosisState {
  const nextState = applyOptionEffects(state, option);
  nextState.answers[question.id] = option.key;
  if (!nextState.questionOrder.includes(question.id)) {
    nextState.questionOrder.push(question.id);
  }
  return nextState;
}

export function findQuestionById(questionSet: QuestionSet, id?: string) {
  return questionSet.questions.find((question) => question.id === id);
}

export function findNextQuestionId(
  questionSet: QuestionSet,
  state: DiagnosisState
): string | undefined {
  return questionSet.questions.find((question) => {
    if (state.answers[question.id]) {
      return false;
    }
    return shouldIncludeQuestion(question, state.mode);
  })?.id;
}

export function buildActiveQuestions(questionSet: QuestionSet, mode: DiagnosisMode) {
  return questionSet.questions.filter((question) => shouldIncludeQuestion(question, mode));
}

export function isDiagnosisComplete(
  state: DiagnosisState,
  activeQuestions: Question[]
): boolean {
  const answeredCount = Object.keys(state.answers).length;
  if (state.mode === "light") {
    const hasLightTerminalAnswered = state.questionOrder.some((questionId) => {
      const question = activeQuestions.find((item) => item.id === questionId);
      return question?.strategyTags?.includes("light_terminal");
    });
    return hasLightTerminalAnswered || answeredCount >= activeQuestions.length;
  }

  if (state.mode === "pro") {
    return answeredCount >= activeQuestions.length;
  }

  return false;
}
