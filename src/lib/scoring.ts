import { AnswerMap, DroneTypeKey, QuestionSet, defaultTypePriority } from "./types";

export type ScoreMap = Record<DroneTypeKey, number>;

export interface RankedScore {
  type: DroneTypeKey;
  score: number;
}

export interface DiagnosisSummary {
  totals: ScoreMap;
  ranked: RankedScore[];
  primary?: RankedScore;
  secondary: RankedScore[];
}

export interface EvaluationOptions {
  closenessThreshold?: number;
}

const DEFAULT_THRESHOLD = 2;

export function createEmptyScoreMap(): ScoreMap {
  return {
    hobby: 0,
    creative: 0,
    inspection: 0,
    survey: 0,
    agri: 0,
    logi: 0,
    disaster: 0,
    auto: 0,
    dev: 0
  };
}

export function calculateScoreMap(
  questionSet: QuestionSet,
  answers: AnswerMap
): ScoreMap {
  const totals = createEmptyScoreMap();

  questionSet.questions.forEach((question) => {
    const answerKey = answers[question.id];
    if (!answerKey) {
      return;
    }

    const selectedOption = question.options.find((option) => option.key === answerKey);
    if (!selectedOption) {
      return;
    }

    const weight = question.weight ?? 1;

    Object.entries(selectedOption.scores).forEach(([typeKey, score]) => {
      const typedKey = typeKey as DroneTypeKey;
      if (typedKey in totals) {
        totals[typedKey] += score * weight;
      }
    });
  });

  return totals;
}

function compareByWeightedAnswers(
  typeA: DroneTypeKey,
  typeB: DroneTypeKey,
  questionSet: QuestionSet,
  answers: AnswerMap
) {
  const sortedByWeight = [...questionSet.questions].sort(
    (a, b) => (b.weight ?? 1) - (a.weight ?? 1)
  );

  for (const question of sortedByWeight) {
    const answerKey = answers[question.id];
    if (!answerKey) continue;
    const selectedOption = question.options.find((option) => option.key === answerKey);
    if (!selectedOption) continue;

    const scoreA = (selectedOption.scores[typeA] ?? 0) * (question.weight ?? 1);
    const scoreB = (selectedOption.scores[typeB] ?? 0) * (question.weight ?? 1);

    if (scoreA === scoreB) {
      continue;
    }

    return scoreB - scoreA;
  }

  return 0;
}

function rankScores(
  totals: ScoreMap,
  questionSet: QuestionSet,
  answers: AnswerMap
): RankedScore[] {
  const entries: RankedScore[] = Object.entries(totals).map(([type, score]) => ({
    type: type as DroneTypeKey,
    score
  }));

  entries.sort((a, b) => {
    const primaryDiff = b.score - a.score;
    if (primaryDiff !== 0) {
      return primaryDiff;
    }

    const weightedDiff = compareByWeightedAnswers(a.type, b.type, questionSet, answers);
    if (weightedDiff !== 0) {
      return weightedDiff;
    }

    return (
      defaultTypePriority.indexOf(a.type) - defaultTypePriority.indexOf(b.type)
    );
  });

  return entries;
}

export function evaluateQuestionSet(
  questionSet: QuestionSet,
  answers: AnswerMap,
  options: EvaluationOptions = {}
): DiagnosisSummary {
  const totals = calculateScoreMap(questionSet, answers);
  const ranked = rankScores(totals, questionSet, answers);
  const primary = ranked[0];
  const threshold = options.closenessThreshold ?? DEFAULT_THRESHOLD;

  const secondary =
    primary === undefined
      ? []
      : ranked.filter(
          (entry) => entry.type !== primary.type && primary.score - entry.score <= threshold
        );

  return {
    totals,
    ranked,
    primary,
    secondary
  };
}
