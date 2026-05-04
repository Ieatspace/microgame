"use client";

import { useMemo, useState } from "react";
import type { GraphConfig } from "@/lib/questionEngine";
import {
  evaluateGraphResponse,
  getCurveLines,
  getDefaultCorrectAnswer,
  getEquilibriumPoint,
  getGraphPrompt,
  regionLabel,
  type GraphEvaluation,
  type GraphResponse
} from "@/lib/graphEngine";

type InteractiveGraphProps = {
  graph: GraphConfig;
  disabled?: boolean;
  onAnswer: (response: GraphResponse, evaluation: GraphEvaluation) => void;
};

type Point = {
  x: number;
  y: number;
};

const REGIONS = [
  { id: "surplus", label: "Surplus", x: 32, y: 37, width: 33, height: 9 },
  { id: "shortage", label: "Shortage", x: 38, y: 56, width: 33, height: 9 },
  { id: "deadweightLoss", label: "DWL", x: 55, y: 41, width: 21, height: 22 },
  { id: "overproduction", label: "Overproduction", x: 56, y: 54, width: 23, height: 18 },
  { id: "underproduction", label: "Underproduction", x: 41, y: 45, width: 22, height: 18 },
  { id: "efficientQuantity", label: "Efficient Q", x: 61, y: 16, width: 8, height: 72 }
];

export default function InteractiveGraph({
  graph,
  disabled = false,
  onAnswer
}: InteractiveGraphProps) {
  const [result, setResult] = useState<GraphEvaluation | undefined>();
  const [selected, setSelected] = useState<string | undefined>();
  const [dragStart, setDragStart] = useState<Point | undefined>();
  const curves = useMemo(() => getCurveLines(graph), [graph]);
  const correctAnswer = useMemo(() => getDefaultCorrectAnswer(graph), [graph]);
  const point = getEquilibriumPoint(graph);

  const submit = (response: GraphResponse) => {
    if (disabled || result) {
      return;
    }

    const evaluation = evaluateGraphResponse(graph, response);
    setResult(evaluation);
    if (response.kind === "region") {
      setSelected(response.region);
    } else if (response.kind === "shift") {
      setSelected(`${response.curve}-${response.direction}`);
    } else {
      setSelected("point");
    }
    onAnswer(response, evaluation);
  };

  const handleGraphClick = (event: React.MouseEvent<SVGSVGElement>) => {
    if (graph.interaction !== "clickEquilibrium") {
      return;
    }

    const box = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - box.left) / box.width) * 100;
    const y = ((event.clientY - box.top) / box.height) * 100;
    submit({ kind: "point", x, y });
  };

  const handleDragEnd = (event: React.PointerEvent<SVGSVGElement>) => {
    if (graph.interaction !== "dragCurve" || !dragStart) {
      return;
    }

    const box = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - box.left) / box.width) * 100;
    const dx = x - dragStart.x;
    const answer = correctAnswer.kind === "shift" ? correctAnswer : undefined;
    submit({
      kind: "shift",
      curve: answer?.curve ?? "demand",
      direction: dx >= 0 ? "right" : "left"
    });
    setDragStart(undefined);
  };

  return (
    <div
      className={`interactive-graph border ${
        result
          ? result.correct
            ? "border-emerald-300/70"
            : "border-rose-300/70"
          : "border-amber-200/30"
      } bg-[#07111d]`}
    >
      <div className="border-b border-white/10 px-3 py-2">
        <div className="text-[10px] font-black uppercase tracking-[0.16em] text-purple-200">
          Interactive Graph
        </div>
        <div className="mt-1 text-xs leading-5 text-slate-200">{getGraphPrompt(graph)}</div>
      </div>

      <svg
        aria-label={`${graph.title} interactive graph`}
        className="block h-60 w-full touch-none"
        onClick={handleGraphClick}
        onPointerDown={(event) => {
          const box = event.currentTarget.getBoundingClientRect();
          setDragStart({
            x: ((event.clientX - box.left) / box.width) * 100,
            y: ((event.clientY - box.top) / box.height) * 100
          });
        }}
        onPointerUp={handleDragEnd}
        role="img"
        viewBox="0 0 100 100"
      >
        <defs>
          <filter id={`interactive-glow-${graph.type}`}>
            <feGaussianBlur stdDeviation="1.1" />
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <rect fill="#07111d" height="100" width="100" />
        <Axes />
        <GraphRegions graph={graph} selected={selected} result={result} submit={submit} />
        {graph.type === "monopoly" ? (
          <MonopolyCurves />
        ) : graph.type === "perfectCompetition" ? (
          <PerfectCompetitionCurves />
        ) : graph.type === "externality" ? (
          <ExternalityCurves graph={graph} />
        ) : (
          curves.map((curve) => (
            <Curve
              color={
                curve.kind === "demand"
                  ? curve.shift === "none"
                    ? "#60a5fa"
                    : "#93c5fd"
                  : curve.shift === "none"
                    ? "#34d399"
                    : "#86efac"
              }
              curve={curve}
              interactive={graph.interaction === "dragCurve"}
              key={curve.label}
            />
          ))
        )}
        {graph.interaction === "clickEquilibrium" ? (
          <circle
            className={result ? (result.correct ? "graph-correct" : "graph-wrong") : ""}
            cx={point.x}
            cy={point.y}
            fill={result?.correct ? "#34d399" : "rgba(250,204,21,0.55)"}
            r={result ? 3.2 : 2.2}
          />
        ) : null}
        <text fill="#f7e8bd" fontSize="4.3" fontWeight="700" x="13" y="8">
          {graph.title}
        </text>
      </svg>

      {graph.interaction === "shiftCurve" ? (
        <div className="grid grid-cols-2 gap-2 border-t border-white/10 p-2">
          {(["demand", "supply"] as const).flatMap((curve) =>
            (["left", "right"] as const).map((direction) => (
              <button
                className={`border px-2 py-2 text-xs font-black uppercase tracking-[0.08em] transition ${
                  selected === `${curve}-${direction}`
                    ? result?.correct
                      ? "border-emerald-300 bg-emerald-300/12 text-emerald-100"
                      : "border-rose-300 bg-rose-300/12 text-rose-100"
                    : "border-amber-200/25 bg-black/20 text-amber-100 hover:border-amber-200/70"
                }`}
                disabled={disabled || Boolean(result)}
                key={`${curve}-${direction}`}
                onClick={() => submit({ kind: "shift", curve, direction })}
                type="button"
              >
                {curve} {direction}
              </button>
            ))
          )}
        </div>
      ) : null}

      {graph.interaction === "dragCurve" ? (
        <div className="border-t border-white/10 px-3 py-2 text-xs text-slate-300">
          Drag horizontally across the graph. The game checks left vs. right movement.
        </div>
      ) : null}

      {result ? (
        <div
          className={`border-t px-3 py-2 text-xs font-black uppercase tracking-[0.12em] ${
            result.correct
              ? "border-emerald-300/30 text-emerald-100"
              : "border-rose-300/30 text-rose-100"
          }`}
        >
          {result.correct ? "Graph read accepted" : "Graph read missed"}: {result.label}
        </div>
      ) : null}
    </div>
  );
}

function Axes() {
  return (
    <>
      <path d="M12 88 H90 M12 88 V10" stroke="#d7b56d" strokeWidth="1.4" />
      <text fill="#f7e8bd" fontSize="4" x="64" y="96">
        Quantity
      </text>
      <text fill="#f7e8bd" fontSize="4" x="2.5" y="15">
        Price
      </text>
    </>
  );
}

function Curve({
  curve,
  color,
  interactive
}: {
  curve: ReturnType<typeof getCurveLines>[number];
  color: string;
  interactive: boolean;
}) {
  return (
    <>
      <path
        d={`M${curve.x1} ${curve.y1} L${curve.x2} ${curve.y2}`}
        filter="url(#interactive-glow-supplyDemand)"
        stroke={color}
        strokeDasharray={curve.shift === "none" ? undefined : "3 2"}
        strokeLinecap="square"
        strokeWidth={interactive ? "3" : "2.2"}
      />
      <text fill={color} fontSize="4" x={curve.x2 - 3} y={curve.y2 + 1}>
        {curve.label}
      </text>
    </>
  );
}

function GraphRegions({
  graph,
  selected,
  result,
  submit
}: {
  graph: GraphConfig;
  selected?: string;
  result?: GraphEvaluation;
  submit: (response: GraphResponse) => void;
}) {
  if (graph.interaction !== "regionSelect") {
    return null;
  }

  const visibleRegions = getVisibleRegions(graph);

  return (
    <>
      {REGIONS.map((region) => {
        if (!visibleRegions.includes(region.id)) {
          return null;
        }

        const isSelected = selected === region.id;
        const fill = isSelected
          ? result?.correct
            ? "rgba(52,211,153,0.38)"
            : "rgba(248,113,113,0.38)"
          : "rgba(250,204,21,0.12)";

        return (
          <g
            className="cursor-pointer"
            key={region.id}
            onClick={(event) => {
              event.stopPropagation();
              submit({ kind: "region", region: region.id });
            }}
          >
            <rect
              fill={fill}
              height={region.height}
              stroke={isSelected ? "#f7e8bd" : "rgba(250,204,21,0.5)"}
              strokeDasharray="2 2"
              width={region.width}
              x={region.x}
              y={region.y}
            />
            <text fill="#f7e8bd" fontSize="3.1" x={region.x + 1.5} y={region.y + 5.2}>
              {regionLabel(region.label)}
            </text>
          </g>
        );
      })}
    </>
  );
}

function getVisibleRegions(graph: GraphConfig) {
  if (graph.highlight === "surplus" || graph.highlight === "shortage") {
    return ["surplus", "shortage"];
  }

  if (graph.highlight === "deadweightLoss") {
    return ["deadweightLoss"];
  }

  if (graph.highlight === "underproduction") {
    return ["underproduction", "efficientQuantity"];
  }

  if (graph.highlight === "overproduction") {
    return ["overproduction", "efficientQuantity"];
  }

  if (graph.highlight === "efficientQuantity") {
    return ["efficientQuantity", "overproduction"];
  }

  return ["surplus", "shortage"];
}

function MonopolyCurves() {
  return (
    <>
      <path d="M22 20 L84 82" stroke="#60a5fa" strokeWidth="2" />
      <path d="M24 20 L62 84" stroke="#93c5fd" strokeDasharray="3 2" strokeWidth="1.8" />
      <path d="M26 78 C42 58, 58 42, 82 30" stroke="#34d399" fill="none" strokeWidth="2" />
      <path d="M25 64 C44 48, 64 50, 84 66" stroke="#c084fc" fill="none" strokeWidth="2" />
      <path d="M52 54 V88 M12 37 H52 M12 54 H52" stroke="#facc15" strokeDasharray="2 2" />
      <text fill="#93c5fd" fontSize="4" x="83" y="82">
        D
      </text>
      <text fill="#93c5fd" fontSize="4" x="60" y="84">
        MR
      </text>
      <text fill="#86efac" fontSize="4" x="82" y="31">
        MC
      </text>
    </>
  );
}

function PerfectCompetitionCurves() {
  return (
    <>
      <path d="M18 48 H88" stroke="#60a5fa" strokeWidth="2" />
      <path d="M22 78 C38 44, 54 34, 84 20" stroke="#34d399" fill="none" strokeWidth="2" />
      <path d="M20 72 C40 45, 62 45, 84 70" stroke="#c084fc" fill="none" strokeWidth="2" />
      <path d="M56 48 V88" stroke="#facc15" strokeDasharray="2 2" />
      <circle cx="56" cy="48" fill="#facc15" r="2.4" />
      <text fill="#93c5fd" fontSize="4" x="76" y="45">
        P=MR
      </text>
      <text fill="#86efac" fontSize="4" x="83" y="23">
        MC
      </text>
    </>
  );
}

function ExternalityCurves({ graph }: { graph: GraphConfig }) {
  const isNegative = graph.externality === "negativeProduction";

  return (
    <>
      <path d={isNegative ? "M26 82 L78 24" : "M24 24 L82 80"} stroke="#60a5fa" strokeWidth="2.1" />
      <path d={isNegative ? "M20 80 L72 28" : "M20 78 L78 22"} stroke="#34d399" strokeWidth="2.1" />
      <path
        d={isNegative ? "M34 80 L86 28" : "M12 78 L70 22"}
        stroke="#facc15"
        strokeDasharray="3 2"
        strokeWidth="2"
      />
    </>
  );
}
