const { readFileSync } = require("node:fs");
const { resolve } = require("node:path");

type Difficulty = "easy" | "medium" | "hard";
type QuestionType = "concept" | "scenario" | "graph" | "calculation";
type GraphType =
  | "supplyDemand"
  | "priceControl"
  | "monopoly"
  | "perfectCompetition"
  | "externality";
type GraphInteraction = "clickEquilibrium" | "shiftCurve" | "regionSelect" | "dragCurve";

type Question = {
  id: string;
  unit: number;
  topic: string;
  difficulty: Difficulty;
  type: QuestionType;
  question: string;
  choices: string[];
  correctAnswer: string;
  explanation: string;
  graphConfig: null | {
    type: GraphType;
    title: string;
    curves?: Array<{
      label: string;
      kind: string;
      shift: "left" | "right" | "none";
    }>;
    interaction?: GraphInteraction;
    correctAnswer?: {
      kind: "point" | "shift" | "region";
      x?: number;
      y?: number;
      tolerance?: number;
      curve?: "demand" | "supply";
      direction?: "left" | "right";
      region?: string;
    };
  };
};

const expectedDistribution: Record<number, number> = {
  1: 20,
  2: 25,
  3: 25,
  4: 20,
  5: 15,
  6: 15
};

const allowedDifficulties = new Set<Difficulty>(["easy", "medium", "hard"]);
const allowedTypes = new Set<QuestionType>([
  "concept",
  "scenario",
  "graph",
  "calculation"
]);
const allowedGraphTypes = new Set<GraphType>([
  "supplyDemand",
  "priceControl",
  "monopoly",
  "perfectCompetition",
  "externality"
]);
const allowedGraphInteractions = new Set<GraphInteraction>([
  "clickEquilibrium",
  "shiftCurve",
  "regionSelect",
  "dragCurve"
]);

const questionsPath = resolve(process.cwd(), "data/questions.json");
const raw = readFileSync(questionsPath, "utf8");
const questions = JSON.parse(raw) as Question[];
const errors: string[] = [];
const ids = new Set<string>();
const distribution = new Map<number, number>();

if (!Array.isArray(questions)) {
  errors.push("questions.json must be a JSON array.");
} else {
  questions.forEach((question, index) => {
    const label = question?.id || `question at index ${index}`;

    if (!question.id || typeof question.id !== "string") {
      errors.push(`${label}: id is required.`);
    } else if (ids.has(question.id)) {
      errors.push(`${label}: duplicate id.`);
    } else {
      ids.add(question.id);
    }

    if (!Number.isInteger(question.unit) || question.unit < 1 || question.unit > 6) {
      errors.push(`${label}: unit must be an integer from 1 to 6.`);
    } else {
      distribution.set(question.unit, (distribution.get(question.unit) ?? 0) + 1);
    }

    if (!question.topic || typeof question.topic !== "string") {
      errors.push(`${label}: topic is required.`);
    }

    if (!allowedDifficulties.has(question.difficulty)) {
      errors.push(`${label}: difficulty must be easy, medium, or hard.`);
    }

    if (!allowedTypes.has(question.type)) {
      errors.push(`${label}: type must be concept, scenario, graph, or calculation.`);
    }

    if (!question.question || typeof question.question !== "string") {
      errors.push(`${label}: question text is required.`);
    }

    if (!Array.isArray(question.choices) || question.choices.length !== 4) {
      errors.push(`${label}: choices must contain exactly 4 answers.`);
    } else {
      const uniqueChoices = new Set(question.choices);
      if (uniqueChoices.size !== 4) {
        errors.push(`${label}: choices must be unique.`);
      }
      if (!question.choices.includes(question.correctAnswer)) {
        errors.push(`${label}: correctAnswer must match one choice exactly.`);
      }
    }

    if (!question.explanation || !question.explanation.trim()) {
      errors.push(`${label}: explanation must not be empty.`);
    }

    if (question.type === "graph") {
      if (!question.graphConfig) {
        errors.push(`${label}: graph questions must include graphConfig.`);
      } else {
        validateGraphConfig(label, question.graphConfig, errors);
      }
    } else if (question.graphConfig !== null) {
      errors.push(`${label}: non-graph questions must use graphConfig: null.`);
    }
  });
}

for (const [unit, expected] of Object.entries(expectedDistribution)) {
  const actual = distribution.get(Number(unit)) ?? 0;
  if (actual !== expected) {
    errors.push(`Unit ${unit}: expected ${expected} questions, found ${actual}.`);
  }
}

if (questions.length !== 120) {
  errors.push(`Expected 120 total questions, found ${questions.length}.`);
}

if (errors.length > 0) {
  console.error("Question validation failed:");
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log("Question validation passed.");
console.log(`Total questions: ${questions.length}`);
console.log(
  `Distribution: ${[...distribution.entries()]
    .sort(([a], [b]) => a - b)
    .map(([unit, count]) => `Unit ${unit}=${count}`)
    .join(", ")}`
);

function validateGraphConfig(
  label: string,
  graphConfig: NonNullable<Question["graphConfig"]>,
  errors: string[]
) {
  if (!allowedGraphTypes.has(graphConfig.type)) {
    errors.push(`${label}: graphConfig.type is not supported.`);
  }

  if (!graphConfig.title || typeof graphConfig.title !== "string") {
    errors.push(`${label}: graphConfig.title is required.`);
  }

  if (!Array.isArray(graphConfig.curves) || graphConfig.curves.length === 0) {
    errors.push(`${label}: graphConfig.curves must contain at least one curve.`);
  } else {
    graphConfig.curves.forEach((curve, index) => {
      if (!curve.label || !curve.kind) {
        errors.push(`${label}: graphConfig.curves[${index}] needs label and kind.`);
      }
      if (!["left", "right", "none"].includes(curve.shift)) {
        errors.push(`${label}: graphConfig.curves[${index}].shift is invalid.`);
      }
    });
  }

  if (!graphConfig.interaction || !allowedGraphInteractions.has(graphConfig.interaction)) {
    errors.push(`${label}: graphConfig.interaction is required and must be supported.`);
  }

  if (!graphConfig.correctAnswer || typeof graphConfig.correctAnswer !== "object") {
    errors.push(`${label}: graphConfig.correctAnswer is required for interactive graphs.`);
    return;
  }

  if (graphConfig.correctAnswer.kind === "point") {
    if (
      typeof graphConfig.correctAnswer.x !== "number" ||
      typeof graphConfig.correctAnswer.y !== "number"
    ) {
      errors.push(`${label}: point graph answer needs numeric x and y.`);
    }
  } else if (graphConfig.correctAnswer.kind === "shift") {
    if (
      !["demand", "supply"].includes(String(graphConfig.correctAnswer.curve)) ||
      !["left", "right"].includes(String(graphConfig.correctAnswer.direction))
    ) {
      errors.push(`${label}: shift graph answer needs curve and direction.`);
    }
  } else if (graphConfig.correctAnswer.kind === "region") {
    if (!graphConfig.correctAnswer.region) {
      errors.push(`${label}: region graph answer needs a region.`);
    }
  } else {
    errors.push(`${label}: graphConfig.correctAnswer.kind is invalid.`);
  }
}
