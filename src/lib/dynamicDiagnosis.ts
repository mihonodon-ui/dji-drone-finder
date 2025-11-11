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
  preferredModels: string[];
  forceComplete: boolean;
  resultSummary: string[];
  skipCommonQuestions: boolean;
}

export const initialDiagnosisState: DiagnosisState = {
  mode: "unknown",
  constraints: {},
  answers: {},
  questionOrder: [],
  detailSegments: [],
  preferredModels: [],
  forceComplete: false,
  resultSummary: [],
  skipCommonQuestions: false
};

export function createInitialDiagnosisState(): DiagnosisState {
  return {
    mode: "unknown",
    constraints: {},
    answers: {},
    questionOrder: [],
    detailSegments: [],
    preferredModels: [],
    forceComplete: false,
    resultSummary: [],
    skipCommonQuestions: false
  };
}

const COMMON_SEGMENT = "common";

export function shouldIncludeQuestion(
  question: Question,
  state: DiagnosisState
) {
  const segments = question.targetSegments ?? [COMMON_SEGMENT];
  if (
    state.skipCommonQuestions &&
    segments.length === 1 &&
    segments[0] === COMMON_SEGMENT
  ) {
    return false;
  }

  if (state.mode === "unknown") {
    if (state.detailSegments.length) {
      return segments.some(
        (segment) =>
          segment === COMMON_SEGMENT || state.detailSegments.includes(segment)
      );
    }
    return segments.includes(COMMON_SEGMENT);
  }

  const includesCommon = segments.includes(COMMON_SEGMENT);
  const includesMode = segments.includes(state.mode);
  if (includesCommon || includesMode) {
    if (
      state.mode === "light" &&
      state.detailSegments.length > 0 &&
      !includesCommon
    ) {
      const matchesDetail = segments.some((segment) =>
        state.detailSegments.includes(segment)
      );
      if (!matchesDetail) {
        return false;
      }
    }
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
  let preferredModels = [...state.preferredModels];

  if (option.effects?.clearPreferredModels) {
    preferredModels = [];
  }

  if (option.effects?.setPreferredModels?.length) {
    preferredModels = Array.from(new Set(option.effects.setPreferredModels));
  }

  if (option.effects?.addPreferredModels?.length) {
    preferredModels = Array.from(
      new Set([...preferredModels, ...option.effects.addPreferredModels])
    );
  }
  const forceComplete = state.forceComplete || Boolean(option.effects?.forceComplete);

  let resultSummary = [...state.resultSummary];
  if (option.effects?.clearResultSummary) {
    resultSummary = [];
  }
  if (option.effects?.appendResultSummary) {
    resultSummary = [...resultSummary, option.effects.appendResultSummary];
  }
  if (option.effects?.setResultSummary) {
    resultSummary = [option.effects.setResultSummary];
  }

  const nextState: DiagnosisState = {
    ...state,
    mode: option.effects?.setMode ?? state.mode,
    constraints: {
      ...state.constraints,
      ...extractConstraints(option.constraints)
    },
    answers: { ...state.answers },
    questionOrder: [...state.questionOrder],
    detailSegments: [...state.detailSegments],
    preferredModels,
    forceComplete,
    resultSummary
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
  let nextState = applyOptionEffects(state, option);
  if (nextState.mode === "unknown") {
    nextState = { ...nextState, mode: "pro" };
  }
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
  if (state.forceComplete) {
    return true;
  }

  const answeredCount = Object.keys(state.answers).length;
  const pendingTerminal = activeQuestions.some(
    (question) =>
      question.strategyTags?.includes("light_terminal") && !state.answers[question.id]
  );

  if (state.mode === "light") {
    if (pendingTerminal) {
      return false;
    }
    return answeredCount >= activeQuestions.length;
  }

  if (state.mode === "pro") {
    if (pendingTerminal) {
      return false;
    }
    return answeredCount >= activeQuestions.length;
  }

  return false;
}
