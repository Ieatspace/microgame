export type AnimationState = "idle" | "walk" | "attack" | "hit" | "death";

type AnimatedEntity = {
  id: number;
  attackPulse?: number;
  hitFlash?: number;
  summonBounce?: number;
  deathTimer?: number;
};

type AnimationResult = {
  state: AnimationState;
  frame: number;
  offsetY: number;
  flash: number;
};

const FRAME_RATE: Record<AnimationState, number> = {
  idle: 2.2,
  walk: 6.5,
  attack: 9,
  hit: 12,
  death: 7
};

export function getAnimationFrame(
  time: number,
  entityId: number,
  state: AnimationState
) {
  return Math.floor(time * FRAME_RATE[state] + entityId) % 4;
}

export function getUnitAnimation(
  unit: AnimatedEntity,
  options: { moving: boolean; time: number }
): AnimationResult {
  const state = getEntityAnimationState(unit, options.moving);
  const frame = getAnimationFrame(options.time, unit.id, state);
  const walkBob = state === "walk" ? (frame % 2 === 0 ? -2 : 0) : 0;
  const idleBob = state === "idle" ? (frame === 1 ? -1 : 0) : 0;
  const attackLean = state === "attack" ? (frame < 2 ? -2 : 1) : 0;
  const summonBounce = unit.summonBounce
    ? -Math.sin((1 - unit.summonBounce / 0.32) * Math.PI) * 9
    : 0;

  return {
    state,
    frame,
    offsetY: walkBob + idleBob + attackLean + summonBounce,
    flash: unit.hitFlash ? Math.min(1, unit.hitFlash / 0.18) : 0
  };
}

export function getEnemyAnimation(
  enemy: AnimatedEntity,
  options: { blocked: boolean; time: number }
): AnimationResult {
  const state = getEntityAnimationState(enemy, !options.blocked);
  const frame = getAnimationFrame(options.time, enemy.id, state);
  const walkBob = state === "walk" ? (frame % 2 === 0 ? -2 : 1) : 0;
  const attackLean = state === "attack" ? (frame < 2 ? -3 : 1) : 0;

  return {
    state,
    frame,
    offsetY: walkBob + attackLean,
    flash: enemy.hitFlash ? Math.min(1, enemy.hitFlash / 0.18) : 0
  };
}

function getEntityAnimationState(
  entity: AnimatedEntity,
  moving: boolean
): AnimationState {
  if (entity.deathTimer !== undefined) {
    return "death";
  }

  if ((entity.hitFlash ?? 0) > 0) {
    return "hit";
  }

  if ((entity.attackPulse ?? 0) > 0) {
    return "attack";
  }

  return moving ? "walk" : "idle";
}
