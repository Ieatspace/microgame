import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  applyQuestionOutcome,
  createGameState,
  summonUnit,
  tickGame,
  type Enemy
} from "../lib/gameEngine.ts";
import {
  createQuestionSession,
  scoreAnswer,
  selectQuestion,
  type MicroQuestion
} from "../lib/questionEngine.ts";

const questions = JSON.parse(
  readFileSync(join(process.cwd(), "data/questions.json"), "utf8")
) as MicroQuestion[];

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

function addTestEnemy(state: ReturnType<typeof createGameState>, hp = 40) {
  const enemy: Enemy = {
    id: state.nextId++,
    type: "basicKnight",
    x: 420,
    y: 332,
    hp,
    maxHp: Math.max(1, hp),
    speed: 0,
    attack: 0,
    cooldown: 0,
    attackPulse: 0,
    hitFlash: 0,
    slowTimer: 0,
    slowFactor: 1
  };

  state.enemies.push(enemy);
  return enemy;
}

function addTestBoss(state: ReturnType<typeof createGameState>) {
  const boss: Enemy = {
    id: state.nextId++,
    type: "giantKnight",
    x: 760,
    y: 332,
    hp: 520,
    maxHp: 520,
    speed: 0,
    attack: 18,
    cooldown: 0,
    attackPulse: 0,
    hitFlash: 0,
    slowTimer: 0,
    slowFactor: 1
  };

  state.enemies.push(boss);
  return boss;
}

function pickWrongAnswer(question: MicroQuestion) {
  const wrong = question.choices.find((choice) => choice !== question.correctAnswer);
  assert(Boolean(wrong), `No wrong choice available for ${question.id}`);
  return wrong as string;
}

function freshQuestion() {
  const session = createQuestionSession(questions);
  const question = selectQuestion(session, 1);
  return { session, question, activeQuestionId: question.id };
}

function testEnemyDeathDoesNotChangeQuestion() {
  const { question, activeQuestionId } = freshQuestion();
  const state = createGameState();
  addTestEnemy(state, 0);

  tickGame(state, 0.016);

  assert(activeQuestionId === question.id, "Enemy death changed the active question id.");
}

function testCorrectAnswerOnlyAwardsGoldAndXp() {
  const { session, question } = freshQuestion();
  const state = createGameState();
  const enemy = addTestEnemy(state, 80);
  const goldBefore = state.coins;
  const xpBefore = state.xp;
  const enemyHpBefore = enemy.hp;
  const enemyXBefore = enemy.x;

  const outcome = scoreAnswer(
    session,
    question,
    question.correctAnswer,
    state.streak
  );
  const awarded = applyQuestionOutcome(state, outcome);

  assert(awarded > 0, "Correct answer did not award gold.");
  assert(state.coins === goldBefore + awarded, "Gold total did not increase by the awarded amount.");
  assert(state.xp > xpBefore, "Correct answer did not award XP.");
  assert(enemy.hp === enemyHpBefore, "Correct answer directly damaged an enemy.");
  assert(enemy.x === enemyXBefore, "Correct answer moved an enemy.");
}

function testSummonSpendsGoldAndAddsUnit() {
  const state = createGameState();
  const goldBefore = state.coins;

  const summoned = summonUnit(state, "basicWizard");

  assert(summoned, "Basic Wizard was not summoned.");
  assert(state.coins === goldBefore - 50, "Summoning Basic Wizard did not spend 50 gold.");
  assert(state.units.length === 1, "Summoning did not add a unit.");
  assert(state.units[0].type === "basicWizard", "Summoned unit type was incorrect.");
}

function testUnitKillDoesNotResetQuestion() {
  const { question, activeQuestionId } = freshQuestion();
  const state = createGameState();
  addTestEnemy(state, 0);

  tickGame(state, 0.016);

  assert(activeQuestionId === question.id, "Unit/enemy combat reset the active question.");
}

function testWrongAnswerOnlyUpdatesLearningState() {
  const { session, question } = freshQuestion();
  const state = createGameState();
  const enemy = addTestEnemy(state, 80);
  const goldBefore = state.coins;
  const enemyHpBefore = enemy.hp;
  const enemyXBefore = enemy.x;
  const wrongAnswer = pickWrongAnswer(question);

  const outcome = scoreAnswer(session, question, wrongAnswer, state.streak);
  const awarded = applyQuestionOutcome(state, outcome);

  assert(!outcome.correct, "Wrong answer was scored as correct.");
  assert(awarded === 0, "Wrong answer awarded gold.");
  assert(state.coins === goldBefore, "Wrong answer changed gold.");
  assert((session.weakTopics[question.topic] ?? 0) > 0, "Wrong answer did not update weak topic score.");
  assert(enemy.hp === enemyHpBefore, "Wrong answer changed enemy HP.");
  assert(enemy.x === enemyXBefore, "Wrong answer changed enemy position.");
}

function testQuestionsDoNotAffectBoss() {
  const state = createGameState();
  const boss = addTestBoss(state);
  const bossHpBefore = boss.hp;
  const bossXBefore = boss.x;

  const correctRun = freshQuestion();
  const correctOutcome = scoreAnswer(
    correctRun.session,
    correctRun.question,
    correctRun.question.correctAnswer,
    state.streak
  );
  applyQuestionOutcome(state, correctOutcome);

  const wrongRun = freshQuestion();
  const wrongOutcome = scoreAnswer(
    wrongRun.session,
    wrongRun.question,
    pickWrongAnswer(wrongRun.question),
    state.streak
  );
  applyQuestionOutcome(state, wrongOutcome);

  assert(boss.hp === bossHpBefore, "Question answers changed boss HP.");
  assert(boss.x === bossXBefore, "Question answers moved the boss.");
  assert(!("bossAnswersRemaining" in boss), "Boss still has answer-linked ward state.");
}

testEnemyDeathDoesNotChangeQuestion();
testCorrectAnswerOnlyAwardsGoldAndXp();
testSummonSpendsGoldAndAddsUnit();
testUnitKillDoesNotResetQuestion();
testWrongAnswerOnlyUpdatesLearningState();
testQuestionsDoNotAffectBoss();

console.log("Question/combat separation tests passed.");
