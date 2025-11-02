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
  preferredWeight?: "under100" | "over100";
}

export interface DiagnosisState {
  mode: DiagnosisMode;
  constraints: ConstraintState;
  answers: AnswerMap;
  questionOrder: string[];
  detailSegments: string[];
}

export const initialDiagnosisState: DiagnosisState = {
  mode: "unknown",
  constraints: {},
  answers: {},
  questionOrder: [],
  detailSegments: []
};

export function createInitialDiagnosisState(): DiagnosisState {
  return {
    mode: "unknown",
    constraints: {},
    answers: {},
    questionOrder: [],
    detailSegments: []
  };
}

const COMMON_SEGMENT = "common";

export function shouldIncludeQuestion(
  question: Question,
  state: DiagnosisState
) {
  const segments = question.targetSegments ?? [COMMON_SEGMENT];
  if (state.mode === "unknown") {
    return segments.includes(COMMON_SEGMENT);
  }
  if (segments.includes(COMMON_SEGMENT) || segments.includes(state.mode)) {
    return true;
  }
  if (!state.detailSegments.length) {
    return false;
  }
  return segments.some((segment) => state.detailSegments.includes(segment));
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
    questionOrder: [...state.questionOrder],
    detailSegments: [...state.detailSegments]
  };

  if (option.effects?.setDetailSegments) {
    nextState.detailSegments = Array.from(
      new Set(option.effects.setDetailSegments)
    );
  }

  if (option.effects?.addDetailSegments?.length) {
    const merged = new Set([
      ...nextState.detailSegments,
      ...option.effects.addDetailSegments
    ]);
    nextState.detailSegments = Array.from(merged);
  }

  if (option.effects?.removeDetailSegments?.length) {
    nextState.detailSegments = nextState.detailSegments.filter(
      (segment) => !option.effects?.removeDetailSegments?.includes(segment)
    );
  }

  if (option.effects?.clearPreferredWeight) {
    delete nextState.constraints.preferredWeight;
  }

  return nextState;
}

function extractConstraints(constraints?: QuestionOptionConstraints) {
  if (!constraints) return {};
  return {
    maxPrice: constraints.maxPrice,
    minPrice: constraints.minPrice,
    requiredSensors: constraints.requiredSensors,
    preferredWeight: constraints.preferredWeight
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
    return shouldIncludeQuestion(question, state);
  })?.id;
}

export function buildActiveQuestions(
  questionSet: QuestionSet,
  state: DiagnosisState
) {
  return questionSet.questions.filter((question) => shouldIncludeQuestion(question, state));
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
