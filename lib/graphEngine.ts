import type { GraphConfig } from "./questionEngine";

export type GraphInteraction =
  | "clickEquilibrium"
  | "shiftCurve"
  | "regionSelect"
  | "dragCurve";

export type GraphCorrectAnswer =
  | {
      kind: "point";
      x: number;
      y: number;
      tolerance?: number;
      label?: string;
    }
  | {
      kind: "shift";
      curve: "demand" | "supply";
      direction: "left" | "right";
    }
  | {
      kind: "region";
      region: "surplus" | "shortage" | "deadweightLoss" | "overproduction" | "underproduction" | "efficientQuantity";
    };

export type GraphResponse =
  | {
      kind: "point";
      x: number;
      y: number;
    }
  | {
      kind: "shift";
      curve: "demand" | "supply";
      direction: "left" | "right";
    }
  | {
      kind: "region";
      region: string;
    };

export type GraphEvaluation = {
  correct: boolean;
  label: string;
};

export type CurveLine = {
  kind: "demand" | "supply";
  label: string;
  shift: "left" | "right" | "none";
  x1: number;
  y1: number;
  x2: number;
  y2: number;
};

const EQUILIBRIUM_POINT = { x: 52, y: 51 };
const NEW_EQUILIBRIUM_POINT = { x: 60, y: 47 };
const PROFIT_POINT = { x: 56, y: 48 };

export function getGraphPrompt(graph: GraphConfig) {
  if (graph.interaction === "clickEquilibrium") {
    return "Click the correct equilibrium or profit-maximizing point.";
  }

  if (graph.interaction === "shiftCurve") {
    return "Identify the curve and direction of the shift.";
  }

  if (graph.interaction === "dragCurve") {
    return "Drag the curve in the correct direction.";
  }

  if (graph.interaction === "regionSelect") {
    return "Select the correct shaded region.";
  }

  return "Use the graph to answer.";
}

export function getDefaultCorrectAnswer(graph: GraphConfig): GraphCorrectAnswer {
  if (graph.interaction === "shiftCurve" || graph.interaction === "dragCurve") {
    const shiftedCurve = graph.curves.find((curve) => curve.shift !== "none");
    return {
      kind: "shift",
      curve: shiftedCurve?.kind === "supply" ? "supply" : "demand",
      direction: shiftedCurve?.shift === "left" ? "left" : "right"
    };
  }

  if (graph.interaction === "regionSelect") {
    return {
      kind: "region",
      region:
        graph.highlight === "deadweightLoss"
          ? "deadweightLoss"
          : graph.highlight === "shortage"
            ? "shortage"
            : graph.highlight === "surplus"
              ? "surplus"
              : graph.highlight === "underproduction"
                ? "underproduction"
                : graph.highlight === "overproduction"
                  ? "overproduction"
                  : "efficientQuantity"
    };
  }

  const point =
    graph.highlight === "newEquilibrium"
      ? NEW_EQUILIBRIUM_POINT
      : graph.type === "perfectCompetition"
        ? PROFIT_POINT
        : EQUILIBRIUM_POINT;

  return {
    kind: "point",
    x: point.x,
    y: point.y,
    tolerance: 8,
    label: graph.highlight === "newEquilibrium" ? "new equilibrium" : "equilibrium"
  };
}

export function evaluateGraphResponse(
  graph: GraphConfig,
  response: GraphResponse
): GraphEvaluation {
  const correctAnswer = graph.correctAnswer ?? getDefaultCorrectAnswer(graph);

  if (correctAnswer.kind === "point" && response.kind === "point") {
    const tolerance = correctAnswer.tolerance ?? 8;
    const distance = Math.hypot(response.x - correctAnswer.x, response.y - correctAnswer.y);

    return {
      correct: distance <= tolerance,
      label: `Clicked (${Math.round(response.x)}, ${Math.round(response.y)})`
    };
  }

  if (correctAnswer.kind === "shift" && response.kind === "shift") {
    return {
      correct:
        response.curve === correctAnswer.curve &&
        response.direction === correctAnswer.direction,
      label: `${response.curve} shifts ${response.direction}`
    };
  }

  if (correctAnswer.kind === "region" && response.kind === "region") {
    return {
      correct: response.region === correctAnswer.region,
      label: response.region
    };
  }

  return {
    correct: false,
    label: "Graph interaction"
  };
}

export function getEquilibriumPoint(graph: GraphConfig) {
  if (graph.highlight === "newEquilibrium") {
    return NEW_EQUILIBRIUM_POINT;
  }

  if (graph.type === "perfectCompetition") {
    return PROFIT_POINT;
  }

  return EQUILIBRIUM_POINT;
}

export function getCurveLines(graph: GraphConfig): CurveLine[] {
  return graph.curves
    .filter((curve) => curve.kind === "demand" || curve.kind === "supply")
    .map((curve) => {
      const dx = curve.shift === "right" ? 11 : curve.shift === "left" ? -11 : 0;
      const isDemand = curve.kind === "demand";

      return {
        kind: isDemand ? "demand" : "supply",
        label: curve.label,
        shift: curve.shift,
        x1: 22 + dx,
        y1: isDemand ? 22 : 80,
        x2: 82 + dx,
        y2: isDemand ? 80 : 22
      };
    });
}

export function regionLabel(region: string) {
  if (region === "deadweightLoss") {
    return "DWL";
  }

  if (region === "efficientQuantity") {
    return "Efficient quantity";
  }

  return region.charAt(0).toUpperCase() + region.slice(1);
}
