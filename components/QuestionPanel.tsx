"use client";

import InteractiveGraph from "@/components/InteractiveGraph";
import type { GraphEvaluation, GraphResponse } from "@/lib/graphEngine";
import type { GraphConfig, MicroQuestion } from "@/lib/questionEngine";
import { UNIT_LABELS } from "@/lib/questionEngine";

export type AnswerFeedback = {
  questionId: string;
  correct: boolean;
  selectedAnswer: string;
  correctAnswer: string;
  coins: number;
  xp: number;
  multiplier: number;
  streakBonus: number;
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

type QuestionPanelProps = {
  question?: MicroQuestion;
  targetName?: string;
  drillTopic?: string;
  locked?: boolean;
  feedback?: AnswerFeedback;
  onAnswer: (answerIndex: number) => void;
  onGraphAnswer: (response: GraphResponse, evaluation: GraphEvaluation) => void;
};

export default function QuestionPanel({
  question,
  targetName,
  drillTopic,
  locked = false,
  feedback,
  onAnswer,
  onGraphAnswer
}: QuestionPanelProps) {
  if (!question) {
    return (
      <aside className="pixel-frame flex min-h-[560px] flex-col justify-center bg-[rgba(8,13,26,0.94)] p-5 text-center">
        <div className="text-5xl text-purple-200 drop-shadow-[0_0_14px_rgba(168,85,247,0.9)]">
          *
        </div>
        <h2 className="mt-4 font-display text-2xl font-black text-amber-100">
          {feedback ? "Answer resolved" : "Market is quiet"}
        </h2>
        <p className="mt-3 text-sm leading-6 text-slate-300">
          The next AP Micro market challenge is loading.
        </p>
        {feedback ? (
          <div className="mt-4 text-left">
            <FeedbackBox feedback={feedback} />
          </div>
        ) : null}
      </aside>
    );
  }

  return (
    <aside className="pixel-frame question-panel flex min-h-[560px] flex-col bg-[rgba(8,13,26,0.95)] p-4">
      <div className="border-b border-amber-200/25 pb-3">
        {drillTopic ? (
          <div className="mb-3 border border-amber-300/50 bg-amber-300/10 px-3 py-2 text-xs font-black uppercase tracking-[0.12em] text-amber-100">
            ⚠ Weak Topic Drill: {drillTopic}
          </div>
        ) : null}
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-[11px] uppercase tracking-[0.18em] text-purple-200">
              Unit {question.unit}: {UNIT_LABELS[question.unit]}
            </div>
            <h2 className="mt-1 text-lg font-black leading-tight text-amber-100">
              {targetName ?? "Market Challenge"}
            </h2>
          </div>
          <div className="border border-emerald-300/40 bg-emerald-300/10 px-2 py-1 text-[11px] font-black uppercase text-emerald-100">
            {question.difficulty}
          </div>
        </div>
        <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-300">
          <span>{question.topic}</span>
          <span className="text-purple-200">/{question.type}</span>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto py-4 pr-1">
        <p className="text-base font-bold leading-7 text-amber-50">{question.question}</p>

        {question.graphConfig ? (
          <div className="mt-4">
            {question.graphConfig.interaction ? (
              <InteractiveGraph
                disabled={locked}
                graph={question.graphConfig}
                onAnswer={onGraphAnswer}
              />
            ) : (
              <GraphRenderer graph={question.graphConfig} />
            )}
          </div>
        ) : null}

        {question.graphConfig?.interaction ? null : (
        <div className="mt-4 grid gap-2">
          {question.choices.map((choice, index) => {
            const letter = String.fromCharCode(65 + index);
            const isLatestQuestion = feedback?.questionId === question.id;
            const isSelected = isLatestQuestion && feedback?.selectedAnswer === choice;
            const selectionClass = isSelected
              ? feedback.correct
                ? "answer-correct border-emerald-300/80 bg-emerald-400/20"
                : "answer-wrong border-rose-300/80 bg-rose-400/20"
              : "";

            return (
              <button
                className={`choice-button flex min-h-[52px] items-center gap-3 border border-amber-200/35 px-3 py-2 text-left text-sm font-bold text-amber-50 transition ${selectionClass}`}
                disabled={locked}
                key={`${question.id}-${choice}`}
                onClick={() => onAnswer(index)}
                type="button"
              >
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-sm border border-amber-200/60 bg-black/25 text-amber-200">
                  {letter}
                </span>
                <span>{choice}</span>
              </button>
            );
          })}
        </div>
        )}

        {feedback ? <FeedbackBox feedback={feedback} /> : null}
      </div>
    </aside>
  );
}

function FeedbackBox({ feedback }: { feedback: AnswerFeedback }) {
  return (
    <div
      className={`mt-4 border p-3 ${
        feedback.correct
          ? "feedback-correct border-emerald-300/50 bg-emerald-300/10"
          : "feedback-wrong border-rose-300/50 bg-rose-400/10"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-black text-amber-100">
          {feedback.correct ? "Last answer correct" : "Last answer correct logic"}
        </div>
        {feedback.correct ? (
          <div className="text-xs text-emerald-100">
            +{feedback.coins}g / +{feedback.xp} XP
            {feedback.streakBonus > 0 ? ` / streak +${feedback.streakBonus}g` : ""}
          </div>
        ) : (
          <div className="text-xs text-rose-100">Correct: {feedback.correctAnswer}</div>
        )}
      </div>
      <ol className="mt-2 list-decimal space-y-1 pl-5 text-xs leading-5 text-slate-200">
        {feedback.explanationSteps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
      {feedback.weakTopics.length > 0 ? (
        <div className="mt-3 border-t border-white/10 pt-2 text-[11px] text-purple-100">
          Weak topics: {feedback.weakTopics.map((topic) => topic.topic).join(", ")}
        </div>
      ) : null}
      {feedback.miniDrill ? (
        <div className="mt-3 border-t border-white/10 pt-2 text-[11px] text-amber-100">
          {feedback.miniDrill.completed
            ? feedback.miniDrill.perfect
              ? `Drill cleared: +${feedback.miniDrill.bonusCoins}g / +${feedback.miniDrill.bonusXp} XP`
              : "Drill complete. Keep practicing this topic."
            : `Drill questions left: ${feedback.miniDrill.remaining}`}
        </div>
      ) : null}
    </div>
  );
}

function GraphRenderer({ graph }: { graph: GraphConfig }) {
  return (
    <svg
      aria-label={graph.title}
      className="h-56 w-full border border-amber-200/30 bg-[#07111d]"
      role="img"
      viewBox="0 0 100 100"
    >
      <defs>
        <filter id={`glow-${graph.type}`}>
          <feGaussianBlur stdDeviation="1.1" />
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <rect fill="#07111d" height="100" width="100" />
      {graph.type === "monopoly" ? (
        <MonopolyGraph graph={graph} />
      ) : graph.type === "perfectCompetition" ? (
        <PerfectCompetitionGraph graph={graph} />
      ) : graph.type === "externality" ? (
        <ExternalityGraph graph={graph} />
      ) : (
        <SupplyDemandGraph graph={graph} />
      )}
      <text fill="#f7e8bd" fontSize="4.4" fontWeight="700" x="13" y="8">
        {graph.title}
      </text>
    </svg>
  );
}

function Axes({ yLabel = "P", xLabel = "Q" }: { yLabel?: string; xLabel?: string }) {
  return (
    <>
      <path d="M12 88 H90 M12 88 V10" stroke="#d7b56d" strokeWidth="1.4" />
      <text fill="#f7e8bd" fontSize="4.2" x="72" y="96">
        {xLabel}
      </text>
      <text fill="#f7e8bd" fontSize="4.2" x="4" y="15">
        {yLabel}
      </text>
    </>
  );
}

function SupplyDemandGraph({ graph }: { graph: GraphConfig }) {
  const demandCurves = graph.curves.filter((curve) => curve.kind === "demand");
  const supplyCurves = graph.curves.filter((curve) => curve.kind === "supply");

  return (
    <>
      <Axes />
      <Highlight highlight={graph.highlight} />
      {demandCurves.map((curve) => (
        <CurvePath
          color={curve.label.includes("2") ? "#93c5fd" : "#60a5fa"}
          key={curve.label}
          label={curve.label}
          shift={curve.shift}
          slope="down"
        />
      ))}
      {supplyCurves.map((curve) => (
        <CurvePath
          color={curve.label.includes("2") ? "#86efac" : "#34d399"}
          key={curve.label}
          label={curve.label}
          shift={curve.shift}
          slope="up"
        />
      ))}
      {graph.type === "priceControl" && graph.priceControl ? (
        <PriceControlLine config={graph.priceControl} />
      ) : null}
      <EquilibriumPoint shifted={graph.highlight === "newEquilibrium"} />
    </>
  );
}

function ExternalityGraph({ graph }: { graph: GraphConfig }) {
  const isNegative = graph.externality === "negativeProduction";

  return (
    <>
      <Axes />
      <path d={isNegative ? "M26 82 L78 24" : "M24 24 L82 80"} stroke="#60a5fa" strokeWidth="2.1" />
      <path d={isNegative ? "M20 80 L72 28" : "M20 78 L78 22"} stroke="#34d399" strokeWidth="2.1" />
      <path
        d={isNegative ? "M34 80 L86 28" : "M12 78 L70 22"}
        stroke="#facc15"
        strokeDasharray="3 2"
        strokeWidth="2"
      />
      <path d="M48 55 L63 40 L63 65 Z" fill="rgba(248,113,113,0.22)" />
      <path d="M50 54 V88 M64 43 V88" stroke="#facc15" strokeDasharray="2 2" />
      <text fill="#93c5fd" fontSize="4" x="78" y={isNegative ? "26" : "78"}>
        D
      </text>
      <text fill="#86efac" fontSize="4" x="70" y={isNegative ? "31" : "25"}>
        {isNegative ? "MPC" : "MPB"}
      </text>
      <text fill="#facc15" fontSize="4" x="80" y={isNegative ? "31" : "24"}>
        {isNegative ? "MSC" : "MSB"}
      </text>
    </>
  );
}

function MonopolyGraph({ graph }: { graph: GraphConfig }) {
  return (
    <>
      <Axes />
      <path d="M22 20 L84 82" stroke="#60a5fa" strokeWidth="2" />
      <path d="M24 20 L62 84" stroke="#93c5fd" strokeDasharray="3 2" strokeWidth="1.8" />
      <path d="M26 78 C42 58, 58 42, 82 30" stroke="#34d399" fill="none" strokeWidth="2" />
      <path d="M25 64 C44 48, 64 50, 84 66" stroke="#c084fc" fill="none" strokeWidth="2" />
      <path d="M52 54 V88 M12 37 H52 M12 54 H52" stroke="#facc15" strokeDasharray="2 2" />
      {graph.highlight === "deadweightLoss" ? (
        <path d="M53 54 L72 36 L72 66 Z" fill="rgba(248,113,113,0.25)" />
      ) : null}
      <circle cx="52" cy="54" fill="#facc15" r="2.6" />
      <text fill="#93c5fd" fontSize="4" x="83" y="82">
        D
      </text>
      <text fill="#93c5fd" fontSize="4" x="60" y="84">
        MR
      </text>
      <text fill="#86efac" fontSize="4" x="82" y="31">
        MC
      </text>
      <text fill="#c084fc" fontSize="4" x="82" y="66">
        ATC
      </text>
    </>
  );
}

function PerfectCompetitionGraph({ graph }: { graph: GraphConfig }) {
  return (
    <>
      <Axes />
      <path d="M18 48 H88" stroke="#60a5fa" strokeWidth="2" />
      <path d="M22 78 C38 44, 54 34, 84 20" stroke="#34d399" fill="none" strokeWidth="2" />
      <path d="M20 72 C40 45, 62 45, 84 70" stroke="#c084fc" fill="none" strokeWidth="2" />
      <path d="M22 82 C42 57, 62 58, 84 78" stroke="#f97316" fill="none" strokeWidth="1.7" />
      <path d="M56 48 V88" stroke="#facc15" strokeDasharray="2 2" />
      {graph.highlight === "profitMaxQuantity" || graph.highlight === "profit" ? (
        <rect fill="rgba(52,211,153,0.18)" height="17" width="28" x="28" y="48" />
      ) : null}
      {graph.highlight === "breakEven" ? (
        <circle cx="46" cy="48" fill="#facc15" r="2.6" />
      ) : null}
      <text fill="#93c5fd" fontSize="4" x="76" y="45">
        P=MR
      </text>
      <text fill="#86efac" fontSize="4" x="83" y="23">
        MC
      </text>
      <text fill="#c084fc" fontSize="4" x="82" y="69">
        ATC
      </text>
      <text fill="#fdba74" fontSize="4" x="82" y="80">
        AVC
      </text>
    </>
  );
}

function CurvePath({
  slope,
  shift,
  color,
  label
}: {
  slope: "up" | "down";
  shift: string;
  color: string;
  label: string;
}) {
  const dx = shift === "right" ? 11 : shift === "left" ? -11 : 0;
  const path = slope === "down" ? `M${22 + dx} 22 L${82 + dx} 80` : `M${22 + dx} 80 L${82 + dx} 22`;
  const labelX = slope === "down" ? 77 + dx : 78 + dx;
  const labelY = slope === "down" ? 78 : 25;

  return (
    <>
      <path
        d={path}
        filter="url(#glow-supplyDemand)"
        stroke={color}
        strokeDasharray={shift === "none" ? undefined : "3 2"}
        strokeLinecap="square"
        strokeWidth="2.1"
      />
      <text fill={color} fontSize="4" x={labelX} y={labelY}>
        {label}
      </text>
    </>
  );
}

function Highlight({ highlight }: { highlight?: string }) {
  if (highlight === "shortage") {
    return <rect fill="rgba(248,113,113,0.25)" height="7" width="31" x="38" y="56" />;
  }

  if (highlight === "surplus") {
    return <rect fill="rgba(52,211,153,0.25)" height="7" width="31" x="32" y="38" />;
  }

  if (highlight === "newEquilibrium") {
    return <path d="M52 51 L62 44 L62 58 Z" fill="rgba(250,204,21,0.2)" />;
  }

  return null;
}

function PriceControlLine({
  config
}: {
  config: NonNullable<GraphConfig["priceControl"]>;
}) {
  const y = config.kind === "ceiling" ? (config.binding ? 61 : 34) : config.binding ? 37 : 68;

  return (
    <>
      <path d={`M14 ${y} H88`} stroke="#fb7185" strokeWidth="1.8" />
      <text fill="#fecdd3" fontSize="4" x="63" y={y - 2}>
        {config.kind === "ceiling" ? "Ceiling" : "Floor"}
      </text>
    </>
  );
}

function EquilibriumPoint({ shifted }: { shifted: boolean }) {
  return (
    <>
      <circle cx={shifted ? "60" : "52"} cy={shifted ? "47" : "51"} fill="#facc15" r="2.8" />
      <path
        d={shifted ? "M60 47 V88 M12 47 H60" : "M52 51 V88 M12 51 H52"}
        stroke="#facc15"
        strokeDasharray="2 2"
      />
    </>
  );
}
