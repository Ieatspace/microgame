import type { GraphCorrectAnswer, GraphInteraction } from "./graphEngine";

export type QuestionUnit = 1 | 2 | 3 | 4 | 5 | 6;

export type Difficulty = "easy" | "medium" | "hard";
export type QuestionType = "concept" | "scenario" | "graph" | "calculation";
export type ShiftDirection = "left" | "right" | "none";
export type GraphType =
  | "supplyDemand"
  | "priceControl"
  | "monopoly"
  | "perfectCompetition"
  | "externality";

export type GraphCurve = {
  label: string;
  kind: string;
  shift: ShiftDirection;
};

export type GraphConfig = {
  type: GraphType;
  title: string;
  curves: GraphCurve[];
  interaction?: GraphInteraction;
  correctAnswer?: GraphCorrectAnswer;
  highlight?: string;
  priceControl?: {
    kind: "ceiling" | "floor";
    binding: boolean;
  };
  externality?: "negativeProduction" | "positiveConsumption";
};

export type MicroQuestion = {
  id: string;
  unit: QuestionUnit;
  topic: string;
  difficulty: Difficulty;
  type: QuestionType;
  question: string;
  choices: [string, string, string, string] | string[];
  correctAnswer: string;
  explanation: string;
  graphConfig: GraphConfig | null;
};

type Drill = {
  topic: string;
  dueAfter: number;
  remaining: number;
  total: number;
  correct: number;
  perfect: boolean;
};

export type MissedQuestion = {
  id: string;
  unit: QuestionUnit;
  topic: string;
  selectedAnswer: string;
  correctAnswer: string;
};

export type QuestionSession = {
  questions: MicroQuestion[];
  questionsById: Map<string, MicroQuestion>;
  usedIds: Set<string>;
  recentIds: string[];
  weakTopics: Record<string, number>;
  topicMissCounts: Record<string, number>;
  pendingDrills: Drill[];
  activeDrill?: Drill;
  answered: number;
  correct: number;
  missedQuestions: MissedQuestion[];
};

export type QuestionOutcome = {
  correct: boolean;
  coins: number;
  xp: number;
  streak: number;
  multiplier: number;
  streakBonus: number;
  selectedAnswer: string;
  correctAnswer: string;
  explanationSteps: string[];
  weakTopics: Array<{ topic: string; score: number }>;
  miniDrill?: {
    topic: string;
    active: boolean;
    remaining: number;
    completed: boolean;
    perfect: boolean;
    bonusCoins: number;
    bonusXp: number;
  };
};

const WEAK_TOPIC_STORAGE_KEY = "micro-defense-weak-topics-v2";
const MISS_COUNT_STORAGE_KEY = "micro-defense-topic-misses-v2";

export const UNIT_LABELS: Record<QuestionUnit, string> = {
  1: "Basic Economic Concepts",
  2: "Supply and Demand",
  3: "Production, Cost, and Perfect Competition",
  4: "Imperfect Competition",
  5: "Factor Markets",
  6: "Market Failure and Government"
};

export const UNIT_REVIEW_RECOMMENDATIONS: Record<QuestionUnit, string> = {
  1: "Review PPCs, opportunity cost, and comparative advantage tables.",
  2: "Review demand/supply shifts, elasticity, taxes, and price controls.",
  3: "Review cost curves, shutdown rules, and competitive firm graphs.",
  4: "Review monopoly MR = MC, regulation, price discrimination, and game theory.",
  5: "Review MRP, MFC, least-cost input use, and labor market shifts.",
  6: "Review externalities, public goods, common resources, and surplus effects."
};

export function createQuestionSession(questions: MicroQuestion[]): QuestionSession {
  return {
    questions,
    questionsById: new Map(questions.map((question) => [question.id, question])),
    usedIds: new Set<string>(),
    recentIds: [],
    weakTopics: loadStoredRecord(WEAK_TOPIC_STORAGE_KEY),
    topicMissCounts: loadStoredRecord(MISS_COUNT_STORAGE_KEY),
    pendingDrills: [],
    answered: 0,
    correct: 0,
    missedQuestions: []
  };
}

export function getQuestionById(
  session: QuestionSession,
  questionId: string
): MicroQuestion | undefined {
  return session.questionsById.get(questionId);
}

export function getWeakTopics(session: QuestionSession, limit = 5) {
  return Object.entries(session.weakTopics)
    .filter(([, score]) => score > 0.2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([topic, score]) => ({ topic, score }));
}

export function getRecommendedUnits(session: QuestionSession) {
  const unitScores = new Map<QuestionUnit, number>();

  for (const missed of session.missedQuestions) {
    unitScores.set(missed.unit, (unitScores.get(missed.unit) ?? 0) + 2);
  }

  const topicUnits = new Map<string, QuestionUnit>();
  for (const question of session.questions) {
    topicUnits.set(question.topic, question.unit);
  }

  for (const [topic, weakness] of Object.entries(session.weakTopics)) {
    const unit = topicUnits.get(topic);
    if (unit && weakness > 0) {
      unitScores.set(unit, (unitScores.get(unit) ?? 0) + weakness);
    }
  }

  return [...unitScores.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([unit]) => ({
      unit,
      label: UNIT_LABELS[unit],
      recommendation: UNIT_REVIEW_RECOMMENDATIONS[unit]
    }));
}

export function selectQuestion(session: QuestionSession, wave = 1): MicroQuestion {
  agePendingDrills(session);

  const drill = nextDueDrill(session);
  if (drill) {
    const drillQuestion = weightedPick(
      candidatesFor(
        session,
        (question) => question.topic === drill.topic,
        wave,
        true
      )
    );

    if (drillQuestion) {
      session.activeDrill = drill;
      markUsed(session, drillQuestion.id);
      return drillQuestion;
    }
  }

  session.activeDrill = undefined;

  const picked = weightedPick(candidatesFor(session, () => true, wave, false));

  if (picked) {
    markUsed(session, picked.id);
    return picked;
  }

  session.usedIds.clear();
  const fallback = weightedPick(candidatesFor(session, () => true, wave, false));
  const question = fallback ?? session.questions[session.answered % session.questions.length];
  markUsed(session, question.id);
  return question;
}

export function scoreAnswer(
  session: QuestionSession,
  question: MicroQuestion,
  selectedAnswer: string,
  currentStreak: number,
  correctOverride?: boolean
): QuestionOutcome {
  const correct = correctOverride ?? selectedAnswer === question.correctAnswer;
  const streak = correct ? currentStreak + 1 : 0;
  const multiplier = 1;
  const baseCoins = difficultyCoins(question.difficulty);
  const baseXp = difficultyXp(question.difficulty);
  const streakBonus = correct ? calculateStreakBonus(streak) : 0;
  const drill = session.activeDrill?.topic === question.topic ? session.activeDrill : undefined;
  let drillBonusCoins = 0;
  let drillBonusXp = 0;
  let drillCompleted = false;
  let drillPerfect = false;

  session.answered += 1;

  if (correct) {
    session.correct += 1;
    session.weakTopics[question.topic] = Math.max(
      0,
      (session.weakTopics[question.topic] ?? 0) - 0.35
    );
  } else {
    session.weakTopics[question.topic] =
      (session.weakTopics[question.topic] ?? 0) + 1;
    session.topicMissCounts[question.topic] =
      (session.topicMissCounts[question.topic] ?? 0) + 1;
    session.missedQuestions.push({
      id: question.id,
      unit: question.unit,
      topic: question.topic,
      selectedAnswer,
      correctAnswer: question.correctAnswer
    });

    if (session.topicMissCounts[question.topic] >= 2) {
      queueMiniDrill(session, question.topic);
      session.topicMissCounts[question.topic] = 0;
    }
  }

  if (drill) {
    drill.remaining -= 1;
    drill.correct += correct ? 1 : 0;
    drill.perfect = drill.perfect && correct;
    drillCompleted = drill.remaining <= 0;
    drillPerfect = drillCompleted && drill.perfect && drill.correct === drill.total;

    if (drillPerfect) {
      drillBonusCoins = 35;
      drillBonusXp = 45;
    }

    if (drillCompleted) {
      session.pendingDrills = session.pendingDrills.filter(
        (candidate) => candidate !== drill
      );
      session.activeDrill = undefined;
    }
  }

  persistRecord(WEAK_TOPIC_STORAGE_KEY, session.weakTopics);
  persistRecord(MISS_COUNT_STORAGE_KEY, session.topicMissCounts);

  return {
    correct,
    coins: correct ? baseCoins + streakBonus + drillBonusCoins : 0,
    xp: correct ? baseXp + drillBonusXp : 0,
    streak,
    multiplier,
    streakBonus,
    selectedAnswer,
    correctAnswer: question.correctAnswer,
    explanationSteps: question.explanation
      .split("|")
      .map((step) => step.trim())
      .filter(Boolean),
    weakTopics: getWeakTopics(session),
    miniDrill: drill
      ? {
          topic: drill.topic,
          active: !drillCompleted,
          remaining: Math.max(0, drill.remaining),
          completed: drillCompleted,
          perfect: drillPerfect,
          bonusCoins: drillBonusCoins,
          bonusXp: drillBonusXp
        }
      : undefined
  };
}

function candidatesFor(
  session: QuestionSession,
  predicate: (question: MicroQuestion) => boolean,
  wave: number,
  includeRecent: boolean
) {
  const fresh = session.questions.filter(
    (question) =>
      predicate(question) &&
      !session.usedIds.has(question.id) &&
      (includeRecent || !session.recentIds.includes(question.id))
  );

  const pool =
    fresh.length > 0
      ? fresh
      : session.questions.filter((question) => predicate(question));

  return pool.map((question) => ({
    question,
    weight:
      1 +
      weakTopicWeight(session, question.topic) +
      difficultyScaleWeight(question.difficulty, wave) +
      questionTypeWeight(question.type, wave)
  }));
}

function weightedPick(
  candidates: Array<{ question: MicroQuestion; weight: number }>
) {
  const total = candidates.reduce((sum, candidate) => sum + candidate.weight, 0);
  if (total <= 0) {
    return undefined;
  }

  let cursor = Math.random() * total;
  for (const candidate of candidates) {
    cursor -= candidate.weight;
    if (cursor <= 0) {
      return candidate.question;
    }
  }

  return candidates.at(-1)?.question;
}

function markUsed(session: QuestionSession, questionId: string) {
  session.usedIds.add(questionId);
  session.recentIds.unshift(questionId);
  session.recentIds = session.recentIds.slice(0, 16);
}

function agePendingDrills(session: QuestionSession) {
  for (const drill of session.pendingDrills) {
    drill.dueAfter -= 1;
  }
}

function nextDueDrill(session: QuestionSession) {
  return session.pendingDrills.find((drill) => drill.dueAfter <= 0);
}

function queueMiniDrill(session: QuestionSession, topic: string) {
  const alreadyQueued = session.pendingDrills.some((drill) => drill.topic === topic);
  if (alreadyQueued) {
    return;
  }

  session.pendingDrills.push({
    topic,
    dueAfter: 2,
    remaining: 2,
    total: 2,
    correct: 0,
    perfect: true
  });
}

function weakTopicWeight(session: QuestionSession, topic: string) {
  return Math.min(8, (session.weakTopics[topic] ?? 0) * 2.15);
}

function difficultyScaleWeight(difficulty: Difficulty, wave: number) {
  const target = wave <= 3 ? "easy" : wave <= 6 ? "medium" : "hard";

  if (difficulty === target) {
    return 1.2;
  }

  if (target === "hard" && difficulty === "medium") {
    return 0.55;
  }

  if (target === "medium" && difficulty !== "hard") {
    return 0.35;
  }

  return difficulty === "hard" ? 0.15 : 0;
}

function questionTypeWeight(type: QuestionType, wave: number) {
  if (wave >= 4 && (type === "graph" || type === "calculation")) {
    return 0.35;
  }

  if (wave <= 2 && type === "concept") {
    return 0.2;
  }

  return 0;
}

function difficultyCoins(difficulty: Difficulty) {
  if (difficulty === "hard") {
    return 60;
  }

  if (difficulty === "medium") {
    return 40;
  }

  return 25;
}

function difficultyXp(difficulty: Difficulty) {
  if (difficulty === "hard") {
    return 45;
  }

  if (difficulty === "medium") {
    return 30;
  }

  return 20;
}

function calculateStreakBonus(streak: number) {
  if (streak > 0 && streak % 10 === 0) {
    return 50;
  }

  if (streak > 0 && streak % 5 === 0) {
    return 20;
  }

  if (streak > 0 && streak % 3 === 0) {
    return 10;
  }

  return 0;
}

function loadStoredRecord(key: string): Record<string, number> {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const parsed = JSON.parse(window.localStorage.getItem(key) ?? "{}") as Record<
      string,
      unknown
    >;

    return Object.fromEntries(
      Object.entries(parsed)
        .map(([topic, value]): [string, number] => [topic, Number(value)])
        .filter(([, value]) => Number.isFinite(value) && value > 0)
    );
  } catch {
    return {};
  }
}

function persistRecord(key: string, record: Record<string, number>) {
  if (typeof window === "undefined") {
    return;
  }

  const cleaned = Object.fromEntries(
    Object.entries(record)
      .map(([topic, value]): [string, number] => [topic, Number(value.toFixed(3))])
      .filter(([, value]) => value > 0)
  );
  window.localStorage.setItem(key, JSON.stringify(cleaned));
}
