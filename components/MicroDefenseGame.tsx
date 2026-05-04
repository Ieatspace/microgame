"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import BattlefieldEffects from "@/components/BattlefieldEffects";
import GameCanvas from "@/components/GameCanvas";
import GameHUD from "@/components/GameHUD";
import QuestionPanel, { type AnswerFeedback } from "@/components/QuestionPanel";
import SummonBar from "@/components/SummonBar";
import {
  applyQuestionOutcome,
  applyUpgrade,
  createGameState,
  getUpgradeCost,
  getSnapshot,
  resetRun,
  summonUnit,
  togglePause,
  type GameSnapshot,
  type UnitType,
  type UpgradeType
} from "@/lib/gameEngine";
import type { GraphEvaluation, GraphResponse } from "@/lib/graphEngine";
import {
  createQuestionSession,
  getRecommendedUnits,
  getQuestionById,
  getWeakTopics,
  scoreAnswer,
  selectQuestion,
  UNIT_LABELS,
  type MicroQuestion
} from "@/lib/questionEngine";
import { loadProgress, saveProgress } from "@/lib/saveSystem";
import { playGameSound } from "@/lib/soundSystem";

const UPGRADE_LABELS: Record<UpgradeType, string> = {
  castleHp: "+Castle HP",
  coinGain: "+Gold Gain",
  unitDamage: "+Unit Damage",
  fasterSpawn: "+Faster Spawn"
};

type MicroDefenseGameProps = {
  questions: MicroQuestion[];
};

type RunStats = {
  coinsEarned: number;
  xpEarned: number;
};

export default function MicroDefenseGame({ questions }: MicroDefenseGameProps) {
  const stateRef = useRef(createGameState());
  const questionSessionRef = useRef(createQuestionSession(questions));
  const nextQuestionTimerRef = useRef<number | undefined>(undefined);
  const bossPresentRef = useRef(false);
  const [runStats, setRunStats] = useState<RunStats>({
    coinsEarned: 0,
    xpEarned: 0
  });
  const [snapshot, setSnapshot] = useState<GameSnapshot>(() =>
    getSnapshot(stateRef.current)
  );
  const [currentQuestionId, setCurrentQuestionId] = useState(
    questions[0]?.id ?? ""
  );
  const [answerLocked, setAnswerLocked] = useState(false);
  const [feedback, setFeedback] = useState<AnswerFeedback | undefined>();

  useEffect(() => {
    questionSessionRef.current = createQuestionSession(questions);
    const saved = loadProgress();
    if (saved) {
      Object.assign(stateRef.current, createGameState(saved.upgrades));
      stateRef.current.level = saved.level;
      stateRef.current.xp = saved.xp;
      stateRef.current.nextLevelXp = saved.nextLevelXp;
      stateRef.current.coins = saved.coins;
      questionSessionRef.current.weakTopics = {
        ...questionSessionRef.current.weakTopics,
        ...saved.weakTopics
      };
    }

    setCurrentQuestionId(selectQuestion(questionSessionRef.current, stateRef.current.wave).id);
    setSnapshot(getSnapshot(stateRef.current));

    return () => {
      if (nextQuestionTimerRef.current) {
        window.clearTimeout(nextQuestionTimerRef.current);
      }
    };
  }, [questions]);

  const activeQuestion = useMemo(
    () => getQuestionById(questionSessionRef.current, currentQuestionId),
    [currentQuestionId]
  );
  const drillTopic = questionSessionRef.current.activeDrill?.topic;

  const saveCurrentProgress = useCallback(() => {
    saveProgress({
      level: stateRef.current.level,
      xp: stateRef.current.xp,
      nextLevelXp: stateRef.current.nextLevelXp,
      coins: stateRef.current.coins,
      upgrades: stateRef.current.upgrades,
      weakTopics: questionSessionRef.current.weakTopics
    });
  }, []);

  const handleSnapshot = useCallback((nextSnapshot: GameSnapshot) => {
    setSnapshot(nextSnapshot);
    const bossPresent = nextSnapshot.enemies.some(
      (enemy) => enemy.type === "giantKnight" && enemy.hp > 0
    );
    if (bossPresent && !bossPresentRef.current) {
      playGameSound("boss");
    }
    bossPresentRef.current = bossPresent;
  }, []);

  const handleSummon = useCallback(
    (unitType: UnitType) => {
      const summoned = summonUnit(stateRef.current, unitType);
      if (summoned) {
        playGameSound("attack");
        saveCurrentProgress();
      }
      setSnapshot(getSnapshot(stateRef.current));
    },
    [saveCurrentProgress]
  );

  const resolveAnswer = useCallback(
    (selectedAnswer: string, correctOverride?: boolean) => {
      const question = getQuestionById(questionSessionRef.current, currentQuestionId);
      if (!question || answerLocked) {
        return;
      }

      const outcome = scoreAnswer(
        questionSessionRef.current,
        question,
        selectedAnswer,
        stateRef.current.streak,
        correctOverride
      );
      const coinsAwarded = applyQuestionOutcome(stateRef.current, outcome);

      playGameSound(outcome.correct ? "correct" : "wrong");
      if (outcome.correct && coinsAwarded > 0) {
        playGameSound("coin");
      }

      setAnswerLocked(true);
      setFeedback({
        questionId: question.id,
        correct: outcome.correct,
        selectedAnswer: outcome.selectedAnswer,
        correctAnswer: question.correctAnswer,
        coins: coinsAwarded,
        xp: outcome.xp,
        multiplier: outcome.multiplier,
        streakBonus: outcome.streakBonus,
        explanationSteps: outcome.explanationSteps,
        weakTopics: outcome.weakTopics,
        miniDrill: outcome.miniDrill
      });
      setRunStats((current) => ({
        coinsEarned: current.coinsEarned + coinsAwarded,
        xpEarned: current.xpEarned + outcome.xp
      }));
      setSnapshot(getSnapshot(stateRef.current));
      saveCurrentProgress();

      if (nextQuestionTimerRef.current) {
        window.clearTimeout(nextQuestionTimerRef.current);
      }

      nextQuestionTimerRef.current = window.setTimeout(() => {
        const nextQuestion = selectQuestion(
          questionSessionRef.current,
          stateRef.current.wave
        );
        setCurrentQuestionId(nextQuestion.id);
        setFeedback(undefined);
        setAnswerLocked(false);
      }, outcome.miniDrill?.active ? 750 : 1250);
    },
    [answerLocked, currentQuestionId, saveCurrentProgress]
  );

  const handleAnswer = useCallback(
    (answerIndex: number) => {
      const question = getQuestionById(questionSessionRef.current, currentQuestionId);
      if (!question) {
        return;
      }

      resolveAnswer(question.choices[answerIndex]);
    },
    [currentQuestionId, resolveAnswer]
  );

  const handleGraphAnswer = useCallback(
    (_response: GraphResponse, evaluation: GraphEvaluation) => {
      const question = getQuestionById(questionSessionRef.current, currentQuestionId);
      if (!question) {
        return;
      }

      resolveAnswer(evaluation.label, evaluation.correct);
    },
    [currentQuestionId, resolveAnswer]
  );

  const handleUpgrade = useCallback(
    (upgradeType: UpgradeType) => {
      const upgraded = applyUpgrade(stateRef.current, upgradeType);
      if (upgraded) {
        saveCurrentProgress();
        setSnapshot(getSnapshot(stateRef.current));
      }
    },
    [saveCurrentProgress]
  );

  const handlePause = useCallback(() => {
    togglePause(stateRef.current);
    setSnapshot(getSnapshot(stateRef.current));
  }, []);

  const handleReset = useCallback(() => {
    resetRun(stateRef.current);
    questionSessionRef.current = createQuestionSession(questions);
    const nextQuestion = selectQuestion(questionSessionRef.current, stateRef.current.wave);
    setCurrentQuestionId(nextQuestion.id);
    setRunStats({ coinsEarned: 0, xpEarned: 0 });
    setFeedback(undefined);
    setAnswerLocked(false);
    setSnapshot(getSnapshot(stateRef.current));
    saveCurrentProgress();
  }, [questions, saveCurrentProgress]);

  return (
    <main className="min-h-screen px-3 py-4 text-amber-50 sm:px-5 lg:px-7">
      <div className="mx-auto flex max-w-[1480px] flex-col gap-3">
        <header className="pixel-frame bg-[rgba(8,13,26,0.9)] p-3">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h1 className="font-display text-2xl font-black leading-none text-amber-100 sm:text-3xl">
                Micro Defense: Wizard&apos;s Market
              </h1>
              <div className="mt-1 text-xs uppercase tracking-[0.18em] text-purple-200">
                AP Micro lane defense
              </div>
            </div>
            <GameHUD snapshot={snapshot} />
          </div>
        </header>

        <section className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="flex min-w-0 flex-col gap-3">
            <div className="pixel-frame relative overflow-hidden bg-[#07111d]">
              <GameCanvas
                onSnapshot={handleSnapshot}
                stateRef={stateRef}
              />
              <BattlefieldEffects snapshot={snapshot} />
            </div>
            <SummonBar onSummon={handleSummon} snapshot={snapshot} />
            <UpgradeRack
              onPause={handlePause}
              onReset={handleReset}
              onUpgrade={handleUpgrade}
              snapshot={snapshot}
            />
          </div>

          {snapshot.gameOver ? (
            <ResultsSummary
              onRestart={handleReset}
              runStats={runStats}
              session={questionSessionRef.current}
            />
          ) : (
            <QuestionPanel
              drillTopic={drillTopic}
              feedback={feedback}
              locked={answerLocked}
              onAnswer={handleAnswer}
              onGraphAnswer={handleGraphAnswer}
              question={activeQuestion}
            />
          )}
        </section>
      </div>
    </main>
  );
}

function UpgradeRack({
  snapshot,
  onUpgrade,
  onPause,
  onReset
}: {
  snapshot: GameSnapshot;
  onUpgrade: (upgradeType: UpgradeType) => void;
  onPause: () => void;
  onReset: () => void;
}) {
  return (
    <div className="pixel-frame grid gap-2 bg-[rgba(8,13,26,0.88)] p-3 md:grid-cols-[1fr_auto] md:items-center">
      <div className="grid gap-2 sm:grid-cols-4">
        {(Object.keys(UPGRADE_LABELS) as UpgradeType[]).map((upgradeType) => (
          <button
            className="border border-purple-200/35 bg-purple-400/10 px-3 py-2 text-left text-xs font-black uppercase tracking-[0.08em] text-purple-100 transition hover:border-purple-200 disabled:opacity-45"
            disabled={snapshot.coins < getUpgradeCost(snapshot, upgradeType) || snapshot.gameOver}
            key={upgradeType}
            onClick={() => onUpgrade(upgradeType)}
            type="button"
          >
            <span>{UPGRADE_LABELS[upgradeType]}</span>
            <span className="ml-2 text-amber-200">
              Lv {snapshot.upgrades[upgradeType]} / {getUpgradeCost(snapshot, upgradeType)}g
            </span>
          </button>
        ))}
      </div>
      <div className="flex items-center justify-between gap-3 md:justify-end">
        <span className="text-xs text-slate-300">
          Streak: <strong className="text-amber-200">{snapshot.streak}</strong>
        </span>
        <button
          className="border border-sky-200/50 bg-sky-300/10 px-3 py-2 text-xs font-black uppercase tracking-[0.12em] text-sky-100 transition hover:border-sky-200"
          onClick={onPause}
          type="button"
        >
          {snapshot.paused ? "Resume" : "Pause"}
        </button>
        <button
          className="border border-amber-200/50 bg-amber-300/10 px-3 py-2 text-xs font-black uppercase tracking-[0.12em] text-amber-100 transition hover:border-amber-200"
          onClick={onReset}
          type="button"
        >
          Restart
        </button>
      </div>
    </div>
  );
}

function ResultsSummary({
  session,
  runStats,
  onRestart
}: {
  session: ReturnType<typeof createQuestionSession>;
  runStats: RunStats;
  onRestart: () => void;
}) {
  const accuracy =
    session.answered > 0 ? Math.round((session.correct / session.answered) * 100) : 0;
  const weakTopics = getWeakTopics(session, 5);
  const recommendations = getRecommendedUnits(session);

  return (
    <aside className="pixel-frame flex min-h-[560px] flex-col bg-[rgba(8,13,26,0.95)] p-4">
      <div className="border-b border-amber-200/25 pb-3">
        <div className="text-[11px] uppercase tracking-[0.18em] text-purple-200">
          Run Results
        </div>
        <h2 className="mt-1 font-display text-2xl font-black text-amber-100">
          Castle Report
        </h2>
      </div>

      <div className="grid grid-cols-2 gap-2 py-4">
        <ResultStat label="Score" value={`${session.correct}/${session.answered}`} />
        <ResultStat label="Accuracy" value={`${accuracy}%`} />
        <ResultStat label="Gold earned" value={`${runStats.coinsEarned}g`} />
        <ResultStat label="XP earned" value={`${runStats.xpEarned}`} />
      </div>

      <section className="border-t border-white/10 py-3">
        <h3 className="text-xs font-black uppercase tracking-[0.15em] text-amber-100">
          Questions Missed
        </h3>
        {session.missedQuestions.length > 0 ? (
          <div className="mt-2 max-h-36 space-y-2 overflow-y-auto pr-1 text-xs leading-5 text-slate-200">
            {session.missedQuestions.slice(-8).map((missed) => (
              <div key={`${missed.id}-${missed.selectedAnswer}`} className="border border-white/10 p-2">
                <div className="font-bold text-rose-100">{missed.topic}</div>
                <div className="text-slate-300">
                  Unit {missed.unit}: {UNIT_LABELS[missed.unit]}
                </div>
                <div className="mt-1 text-emerald-100">
                  Correct: {missed.correctAnswer}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-2 text-sm text-emerald-100">No misses this run.</p>
        )}
      </section>

      <section className="border-t border-white/10 py-3">
        <h3 className="text-xs font-black uppercase tracking-[0.15em] text-amber-100">
          Weakest Topics
        </h3>
        <div className="mt-2 flex flex-wrap gap-2">
          {weakTopics.length > 0 ? (
            weakTopics.map((topic) => (
              <span
                className="border border-purple-200/30 bg-purple-300/10 px-2 py-1 text-xs text-purple-100"
                key={topic.topic}
              >
                {topic.topic} ({topic.score.toFixed(1)})
              </span>
            ))
          ) : (
            <span className="text-sm text-slate-300">No persistent weak topics yet.</span>
          )}
        </div>
      </section>

      <section className="border-t border-white/10 py-3">
        <h3 className="text-xs font-black uppercase tracking-[0.15em] text-amber-100">
          Recommended Review
        </h3>
        <div className="mt-2 space-y-2">
          {recommendations.length > 0 ? (
            recommendations.map((item) => (
              <div className="border border-amber-200/20 bg-amber-300/10 p-2 text-xs" key={item.unit}>
                <div className="font-black text-amber-100">
                  Unit {item.unit}: {item.label}
                </div>
                <div className="mt-1 leading-5 text-slate-200">{item.recommendation}</div>
              </div>
            ))
          ) : (
            <div className="text-sm text-slate-300">
              Keep rotating through mixed practice.
            </div>
          )}
        </div>
      </section>

      <button
        className="mt-auto border border-amber-200/50 bg-amber-300/10 px-3 py-3 text-sm font-black uppercase tracking-[0.12em] text-amber-100 transition hover:border-amber-200"
        onClick={onRestart}
        type="button"
      >
        Start next run
      </button>
    </aside>
  );
}

function ResultStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-white/10 bg-black/25 p-2">
      <div className="text-[10px] uppercase tracking-[0.15em] text-slate-400">
        {label}
      </div>
      <div className="mt-1 text-lg font-black text-amber-100">{value}</div>
    </div>
  );
}
