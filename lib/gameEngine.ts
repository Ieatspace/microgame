import type { QuestionOutcome } from "./questionEngine";
import { canSpendGold, grantGold, spendGold } from "./economySystem.ts";
import type { EffectSpriteKey, SpriteKey } from "./spriteSystem";

export type UnitType =
  | "basicWizard"
  | "archer"
  | "knight"
  | "catapult"
  | "strongWizard";
export type EnemyType = "basicKnight" | "shieldKnight" | "fastScout" | "giantKnight";
export type ProjectileType =
  | "arcane"
  | "arrow"
  | "slash"
  | "stone"
  | "strongMagic";
export type UpgradeType = "castleHp" | "coinGain" | "unitDamage" | "fasterSpawn";
export type VisualEffectType = EffectSpriteKey;
export type AnnouncementType = "wave" | "boss" | "level";

export type UnitDefinition = {
  label: string;
  cost: number;
  hp: number;
  attack: number;
  attackSpeed: number;
  range: number;
  speed: number;
  projectile: ProjectileType;
  sprite: SpriteKey;
  unlockLevel: number;
  summonCooldown: number;
  role: string;
};

export type EnemyDefinition = {
  label: string;
  hp: number;
  speed: number;
  attack: number;
  sprite: SpriteKey;
};

export type PermanentUpgrades = Record<UpgradeType, number>;

export type LaneUnit = {
  id: number;
  type: UnitType;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  cooldown: number;
  attackPulse: number;
  hitFlash: number;
  summonBounce: number;
  deathTimer?: number;
};

export type Enemy = {
  id: number;
  type: EnemyType;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  speed: number;
  attack: number;
  cooldown: number;
  attackPulse: number;
  hitFlash: number;
  slowTimer: number;
  slowFactor: number;
  deathTimer?: number;
};

export type Projectile = {
  id: number;
  type: ProjectileType;
  x: number;
  y: number;
  targetId: number;
  damage: number;
  speed: number;
  size: number;
};

export type FloatingText = {
  id: number;
  text: string;
  x: number;
  y: number;
  color: string;
  ttl: number;
};

export type VisualEffect = {
  id: number;
  type: VisualEffectType;
  x: number;
  y: number;
  ttl: number;
  maxTtl: number;
};

export type BattleAnnouncement = {
  id: number;
  type: AnnouncementType;
  text: string;
  ttl: number;
  maxTtl: number;
};

export type GameState = {
  width: number;
  height: number;
  time: number;
  castleHp: number;
  maxCastleHp: number;
  coins: number;
  xp: number;
  level: number;
  nextLevelXp: number;
  upgradePoints: number;
  upgrades: PermanentUpgrades;
  wave: number;
  streak: number;
  coinGainBonus: number;
  unitDamageBonus: number;
  spawnCooldownMultiplier: number;
  units: LaneUnit[];
  enemies: Enemy[];
  projectiles: Projectile[];
  floatingTexts: FloatingText[];
  visualEffects: VisualEffect[];
  announcements: BattleAnnouncement[];
  unitCooldowns: Record<UnitType, number>;
  screenShake: number;
  castleFlash: number;
  paused: boolean;
  spawnQueue: EnemyType[];
  spawnTimer: number;
  waveBreakTimer: number;
  nextId: number;
  gameOver: boolean;
};

export type GameSnapshot = Omit<
  GameState,
  "spawnQueue" | "nextId" | "unitCooldowns"
> & {
  spawnQueue: EnemyType[];
  unitCooldowns: Record<UnitType, number>;
};

export const DEFAULT_UPGRADES: PermanentUpgrades = {
  castleHp: 0,
  coinGain: 0,
  unitDamage: 0,
  fasterSpawn: 0
};

export const UNIT_ORDER: UnitType[] = [
  "basicWizard",
  "archer",
  "knight",
  "catapult",
  "strongWizard"
];

export const UNIT_DEFINITIONS: Record<UnitType, UnitDefinition> = {
  basicWizard: {
    label: "Basic Wizard",
    cost: 50,
    hp: 62,
    attack: 9,
    attackSpeed: 1.28,
    range: 160,
    speed: 14,
    projectile: "arcane",
    sprite: "basicWizard",
    unlockLevel: 1,
    summonCooldown: 0.95,
    role: "Cheap spam"
  },
  archer: {
    label: "Archer",
    cost: 75,
    hp: 54,
    attack: 7,
    attackSpeed: 2.05,
    range: 235,
    speed: 19,
    projectile: "arrow",
    sprite: "archer",
    unlockLevel: 1,
    summonCooldown: 1.8,
    role: "Fast ranged DPS"
  },
  knight: {
    label: "Knight",
    cost: 100,
    hp: 190,
    attack: 18,
    attackSpeed: 0.62,
    range: 58,
    speed: 9,
    projectile: "slash",
    sprite: "knightUnit",
    unlockLevel: 2,
    summonCooldown: 3.2,
    role: "Frontline tank"
  },
  catapult: {
    label: "Catapult",
    cost: 150,
    hp: 105,
    attack: 38,
    attackSpeed: 0.38,
    range: 300,
    speed: 5,
    projectile: "stone",
    sprite: "catapult",
    unlockLevel: 3,
    summonCooldown: 5.4,
    role: "Slow high damage"
  },
  strongWizard: {
    label: "Strong Wizard",
    cost: 200,
    hp: 92,
    attack: 44,
    attackSpeed: 0.55,
    range: 245,
    speed: 8,
    projectile: "strongMagic",
    sprite: "strongWizard",
    unlockLevel: 4,
    summonCooldown: 7,
    role: "Late burst caster"
  }
};

export const ENEMY_DEFINITIONS: Record<EnemyType, EnemyDefinition> = {
  basicKnight: {
    label: "Basic Knight",
    hp: 72,
    speed: 16,
    attack: 7,
    sprite: "basicKnight"
  },
  shieldKnight: {
    label: "Shield Knight",
    hp: 132,
    speed: 10,
    attack: 10,
    sprite: "shieldKnight"
  },
  fastScout: {
    label: "Fast Scout",
    hp: 48,
    speed: 27,
    attack: 6,
    sprite: "fastScout"
  },
  giantKnight: {
    label: "Giant Knight",
    hp: 520,
    speed: 8,
    attack: 18,
    sprite: "giantKnight"
  }
};

const CASTLE_GATE_X = 126;
const UNIT_START_X = 164;
const ENEMY_START_X = 930;
const LANE_Y = 332;
const MAX_UNITS = 22;
const MAX_ENEMIES = 18;
const MAX_PROJECTILES = 44;
const MAX_FLOATING_TEXTS = 28;
const MAX_EFFECTS = 34;

export function createGameState(
  upgrades: PermanentUpgrades = DEFAULT_UPGRADES
): GameState {
  const cleanUpgrades = {
    castleHp: upgrades.castleHp ?? 0,
    coinGain: upgrades.coinGain ?? 0,
    unitDamage: upgrades.unitDamage ?? 0,
    fasterSpawn: upgrades.fasterSpawn ?? 0
  };
  const maxCastleHp = 100 + cleanUpgrades.castleHp * 20;

  return {
    width: 960,
    height: 460,
    time: 0,
    castleHp: maxCastleHp,
    maxCastleHp,
    coins: 150 + cleanUpgrades.coinGain * 10,
    xp: 0,
    level: 1,
    nextLevelXp: 100,
    upgradePoints: 0,
    upgrades: cleanUpgrades,
    wave: 0,
    streak: 0,
    coinGainBonus: 1 + cleanUpgrades.coinGain * 0.12,
    unitDamageBonus: 1 + cleanUpgrades.unitDamage * 0.14,
    spawnCooldownMultiplier: Math.max(0.58, 1 - cleanUpgrades.fasterSpawn * 0.08),
    units: [],
    enemies: [],
    projectiles: [],
    floatingTexts: [],
    visualEffects: [],
    announcements: [],
    unitCooldowns: createUnitCooldowns(),
    screenShake: 0,
    castleFlash: 0,
    paused: false,
    spawnQueue: [],
    spawnTimer: 0,
    waveBreakTimer: 0.65,
    nextId: 1,
    gameOver: false
  };
}

export function tickGame(
  state: GameState,
  dt: number
) {
  if (state.gameOver || state.paused) {
    return;
  }

  state.time += dt;
  updateSummonCooldowns(state, dt);
  updateWave(state, dt);
  updateUnits(state, dt);
  updateEnemies(state, dt);
  updateProjectiles(state, dt);
  updateFloatingTexts(state, dt);
  updateVisualTimers(state, dt);

  if (state.castleHp <= 0) {
    state.castleHp = 0;
    state.gameOver = true;
    addFloatingText(state, "Castle fallen", 300, 130, "#fb7185");
  }
}

export function summonUnit(state: GameState, unitType: UnitType) {
  if (state.gameOver) {
    return false;
  }

  const definition = UNIT_DEFINITIONS[unitType];
  if (liveUnits(state).length >= MAX_UNITS) {
    addFloatingText(state, "Unit cap", 220, 350, "#fbbf24");
    return false;
  }

  if (state.level < definition.unlockLevel) {
    addFloatingText(state, `Unlocks Lv ${definition.unlockLevel}`, 220, 350, "#93c5fd");
    return false;
  }

  if (state.unitCooldowns[unitType] > 0) {
    addFloatingText(state, "Cooling down", 220, 350, "#fbbf24");
    return false;
  }

  if (!canSpendGold(state, definition.cost)) {
    addFloatingText(state, "Need gold", 220, 350, "#f87171");
    return false;
  }

  spendGold(state, definition.cost);
  state.unitCooldowns[unitType] =
    definition.summonCooldown * state.spawnCooldownMultiplier;
  state.units.push({
    id: state.nextId++,
    type: unitType,
    x: UNIT_START_X,
    y: LANE_Y,
    hp: definition.hp,
    maxHp: definition.hp,
    cooldown: 0,
    attackPulse: 0,
    hitFlash: 0,
    summonBounce: 0.32
  });
  addFloatingText(state, definition.label, UNIT_START_X + 20, LANE_Y - 58, "#facc15");
  return true;
}

export function applyQuestionOutcome(
  state: GameState,
  outcome: QuestionOutcome
) {
  if (state.gameOver) {
    return 0;
  }

  state.streak = outcome.streak;

  if (outcome.correct) {
    const coins = grantGold(state, outcome.coins, state.coinGainBonus);
    state.xp += outcome.xp;
    addFloatingText(state, `+${coins} gold`, 430, 112, "#facc15");
    addFloatingText(state, `+${outcome.xp} XP`, 620, 112, "#7dd3fc");
    addVisualEffect(state, "coinGain", 452, 102, 0.7);
    addVisualEffect(state, "xpGain", 642, 102, 0.7);
    levelUpIfReady(state);
    return coins;
  } else {
    addFloatingText(state, "No gold", 430, 112, "#fb7185");
  }

  return 0;
}

export function togglePause(state: GameState) {
  if (state.gameOver) {
    return;
  }

  state.paused = !state.paused;
}

export function applyUpgrade(state: GameState, upgradeType: UpgradeType) {
  if (state.gameOver) {
    return false;
  }

  const cost = getUpgradeCost(state, upgradeType);
  if (!canSpendGold(state, cost)) {
    addFloatingText(state, "Need gold", 470, 138, "#f87171");
    return false;
  }

  spendGold(state, cost);
  state.upgrades[upgradeType] += 1;

  if (upgradeType === "castleHp") {
    state.maxCastleHp += 20;
    state.castleHp = Math.min(state.maxCastleHp, state.castleHp + 20);
    addFloatingText(state, "Castle ward +20", 210, 132, "#86efac");
  }

  if (upgradeType === "coinGain") {
    state.coinGainBonus += 0.12;
    addFloatingText(state, "Gold charm up", 430, 98, "#facc15");
  }

  if (upgradeType === "unitDamage") {
    state.unitDamageBonus += 0.14;
    addFloatingText(state, "Unit damage up", 520, 134, "#c084fc");
  }

  if (upgradeType === "fasterSpawn") {
    state.spawnCooldownMultiplier = Math.max(
      0.58,
      state.spawnCooldownMultiplier - 0.08
    );
    addFloatingText(state, "Spawn faster", 520, 134, "#7dd3fc");
  }

  return true;
}

export function getUpgradeCost(
  state: Pick<GameState, "upgrades">,
  upgradeType: UpgradeType
) {
  return 120 + state.upgrades[upgradeType] * 85;
}

export function resetRun(state: GameState) {
  const next = createGameState(state.upgrades);
  Object.assign(state, next);
}

export function getSnapshot(state: GameState): GameSnapshot {
  return {
    ...state,
    upgrades: { ...state.upgrades },
    units: state.units.map((unit) => ({ ...unit })),
    enemies: state.enemies.map((enemy) => ({ ...enemy })),
    projectiles: state.projectiles.map((projectile) => ({ ...projectile })),
    floatingTexts: state.floatingTexts.map((text) => ({ ...text })),
    visualEffects: state.visualEffects.map((effect) => ({ ...effect })),
    announcements: state.announcements.map((announcement) => ({ ...announcement })),
    unitCooldowns: { ...state.unitCooldowns },
    spawnQueue: [...state.spawnQueue]
  };
}

function updateSummonCooldowns(state: GameState, dt: number) {
  for (const unitType of UNIT_ORDER) {
    state.unitCooldowns[unitType] = Math.max(0, state.unitCooldowns[unitType] - dt);
  }
}

function updateWave(
  state: GameState,
  dt: number
) {
  if (state.spawnQueue.length === 0 && liveEnemies(state).length === 0) {
    state.waveBreakTimer -= dt;
    if (state.waveBreakTimer <= 0) {
      state.wave += 1;
      state.spawnQueue = buildWavePlan(state.wave);
      state.spawnTimer = 0.4;
      state.waveBreakTimer = 4.5;
      addFloatingText(state, `Wave ${state.wave}`, 470, 92, "#facc15");
      addAnnouncement(state, "wave", `Wave ${state.wave}`, 2.1);

      if (state.spawnQueue.includes("giantKnight")) {
        addAnnouncement(state, "boss", "Giant Knight Approaches", 3);
      }
    }
  }

  if (state.spawnQueue.length > 0) {
    state.spawnTimer -= dt;
    if (state.spawnTimer <= 0) {
      const enemyType = state.spawnQueue.shift();
      if (enemyType) {
        spawnEnemy(state, enemyType);
      }
      state.spawnTimer = Math.max(1.05, 3.35 - state.wave * 0.13);
    }
  }
}

function buildWavePlan(wave: number): EnemyType[] {
  const plan: EnemyType[] = [];
  const count = wave <= 3 ? 2 + wave : wave <= 6 ? 4 + wave : Math.min(14, 6 + wave);

  for (let index = 0; index < count; index += 1) {
    if (wave >= 7 && index % 4 === 1) {
      plan.push(index % 8 === 1 ? "shieldKnight" : "fastScout");
    } else if (wave >= 4 && index % 5 === 3) {
      plan.push("shieldKnight");
    } else if (wave >= 3 && index % 4 === 2) {
      plan.push("fastScout");
    } else {
      plan.push("basicKnight");
    }
  }

  if (wave % 5 === 0) {
    plan.push("giantKnight");
  }

  return plan;
}

function spawnEnemy(state: GameState, enemyType: EnemyType) {
  if (liveEnemies(state).length >= MAX_ENEMIES) {
    return;
  }

  const definition = ENEMY_DEFINITIONS[enemyType];
  const scaling = getEnemyScaling(state.wave);
  const hp = Math.round(definition.hp * scaling.hp);

  state.enemies.push({
    id: state.nextId++,
    type: enemyType,
    x: ENEMY_START_X,
    y: LANE_Y,
    hp,
    maxHp: hp,
    speed: definition.speed * scaling.speed,
    attack: Math.round(definition.attack * scaling.attack),
    cooldown: 0.6,
    attackPulse: 0,
    hitFlash: 0,
    slowTimer: 0,
    slowFactor: 1
  });

  if (enemyType === "giantKnight") {
    addAnnouncement(state, "boss", "Boss On The Field", 2.8);
  }
}

function getEnemyScaling(wave: number) {
  if (wave <= 3) {
    return {
      hp: 0.78 + wave * 0.06,
      speed: 0.74 + wave * 0.04,
      attack: 0.82 + wave * 0.04
    };
  }

  if (wave <= 6) {
    return {
      hp: 1.05 + (wave - 4) * 0.12,
      speed: 0.96 + (wave - 4) * 0.04,
      attack: 1.05 + (wave - 4) * 0.08
    };
  }

  return {
    hp: 1.38 + (wave - 7) * 0.16,
    speed: 1.08 + (wave - 7) * 0.035,
    attack: 1.22 + (wave - 7) * 0.09
  };
}

function updateUnits(state: GameState, dt: number) {
  for (const unit of state.units) {
    tickUnitTimers(unit, dt);

    if (unit.deathTimer !== undefined) {
      unit.deathTimer -= dt;
      continue;
    }

    if (unit.hp <= 0) {
      markUnitDefeated(state, unit);
      continue;
    }

    const definition = UNIT_DEFINITIONS[unit.type];
    const target = findTargetForUnit(state, unit, definition.range);

    if (target) {
      if (unit.cooldown <= 0) {
        const damage = definition.attack * state.unitDamageBonus;
        fireProjectile(state, unit, target, definition.projectile, damage);
        unit.cooldown = 1 / definition.attackSpeed;
        unit.attackPulse = 0.22;
      }
    } else {
      unit.x = Math.min(720, unit.x + definition.speed * dt);
    }
  }

  state.units = state.units.filter(
    (unit) => unit.hp > 0 || (unit.deathTimer ?? 0) > 0
  );
}

function updateEnemies(state: GameState, dt: number) {
  for (const enemy of state.enemies) {
    tickEnemyTimers(enemy, dt);

    if (enemy.deathTimer !== undefined) {
      enemy.deathTimer -= dt;
      continue;
    }

    if (enemy.hp <= 0) {
      markEnemyDefeated(state, enemy);
      continue;
    }

    const blockingUnit = state.units
      .filter((unit) => unit.hp > 0 && unit.deathTimer === undefined)
      .filter((unit) => Math.abs(unit.x - enemy.x) < 46)
      .sort((a, b) => a.x - b.x)[0];

    if (blockingUnit) {
      if (enemy.cooldown <= 0) {
        blockingUnit.hp -= enemy.attack;
        blockingUnit.hitFlash = 0.18;
        enemy.cooldown = 1.15;
        enemy.attackPulse = 0.22;
        addFloatingText(state, `-${enemy.attack}`, blockingUnit.x, blockingUnit.y - 70, "#f87171");
        addVisualEffect(state, "hitSpark", blockingUnit.x, blockingUnit.y - 54, 0.32);

        if (blockingUnit.hp <= 0) {
          markUnitDefeated(state, blockingUnit);
        }
      }
    } else {
      const speed = enemy.speed * (enemy.slowTimer > 0 ? enemy.slowFactor : 1);
      enemy.x -= speed * dt;
    }

    if (enemy.x <= CASTLE_GATE_X) {
      damageCastle(state, enemy.attack * 2);
      markEnemyDefeated(state, enemy);
      addFloatingText(state, `-${enemy.attack * 2} HP`, 150, 148, "#fb7185");
    }
  }

  state.enemies = state.enemies.filter(
    (enemy) => enemy.hp > 0 || (enemy.deathTimer ?? 0) > 0
  );
}

function updateProjectiles(state: GameState, dt: number) {
  for (const projectile of state.projectiles) {
    const target = state.enemies.find(
      (enemy) => enemy.id === projectile.targetId && enemy.hp > 0
    );

    if (!target) {
      projectile.x += projectile.speed * dt;
      continue;
    }

    const targetY = target.y - (target.type === "giantKnight" ? 104 : 72);
    const dx = target.x - projectile.x;
    const dy = targetY - projectile.y;
    const distance = Math.hypot(dx, dy) || 1;
    const step = projectile.speed * dt;

    projectile.x += (dx / distance) * step;
    projectile.y += (dy / distance) * step;

    if (distance <= projectile.size + 8) {
      damageEnemy(state, target, projectile.damage, projectile.type);
      projectile.targetId = -1;
    }
  }

  state.projectiles = state.projectiles.filter(
    (projectile) =>
      projectile.targetId !== -1 &&
      projectile.x > -80 &&
      projectile.x < state.width + 100 &&
      projectile.y > -80 &&
      projectile.y < state.height + 80
  );
}

function updateFloatingTexts(state: GameState, dt: number) {
  for (const floatingText of state.floatingTexts) {
    floatingText.ttl -= dt;
    floatingText.y -= 22 * dt;
  }

  state.floatingTexts = state.floatingTexts.filter((text) => text.ttl > 0);
}

function updateVisualTimers(state: GameState, dt: number) {
  state.screenShake = Math.max(0, state.screenShake - dt);
  state.castleFlash = Math.max(0, state.castleFlash - dt);

  for (const effect of state.visualEffects) {
    effect.ttl -= dt;
  }

  for (const announcement of state.announcements) {
    announcement.ttl -= dt;
  }

  state.visualEffects = state.visualEffects.filter((effect) => effect.ttl > 0);
  state.announcements = state.announcements.filter(
    (announcement) => announcement.ttl > 0
  );
}

function tickUnitTimers(unit: LaneUnit, dt: number) {
  unit.cooldown = Math.max(0, unit.cooldown - dt);
  unit.attackPulse = Math.max(0, unit.attackPulse - dt);
  unit.hitFlash = Math.max(0, unit.hitFlash - dt);
  unit.summonBounce = Math.max(0, unit.summonBounce - dt);
}

function tickEnemyTimers(enemy: Enemy, dt: number) {
  enemy.cooldown = Math.max(0, enemy.cooldown - dt);
  enemy.attackPulse = Math.max(0, enemy.attackPulse - dt);
  enemy.hitFlash = Math.max(0, enemy.hitFlash - dt);
  enemy.slowTimer = Math.max(0, enemy.slowTimer - dt);
  if (enemy.slowTimer <= 0) {
    enemy.slowFactor = 1;
  }
}

function findTargetForUnit(state: GameState, unit: LaneUnit, range: number) {
  return state.enemies
    .filter((enemy) => enemy.hp > 0 && enemy.deathTimer === undefined)
    .filter((enemy) => enemy.x >= unit.x && enemy.x - unit.x <= range)
    .sort((a, b) => a.x - b.x)[0];
}

function fireProjectile(
  state: GameState,
  unit: LaneUnit,
  target: Enemy,
  type: ProjectileType,
  damage: number
) {
  const speedByType: Record<ProjectileType, number> = {
    arcane: 310,
    arrow: 395,
    slash: 520,
    stone: 235,
    strongMagic: 360
  };
  const sizeByType: Record<ProjectileType, number> = {
    arcane: 10,
    arrow: 8,
    slash: 16,
    stone: 18,
    strongMagic: 16
  };

  if (state.projectiles.length >= MAX_PROJECTILES) {
    state.projectiles.shift();
  }

  state.projectiles.push({
    id: state.nextId++,
    type,
    x: unit.x + 32,
    y: unit.y - (unit.type === "catapult" ? 84 : 92),
    targetId: target.id,
    damage,
    speed: speedByType[type],
    size: sizeByType[type]
  });
}

function damageEnemy(
  state: GameState,
  enemy: Enemy,
  damage: number,
  source: ProjectileType
) {
  enemy.hp -= damage;
  enemy.hitFlash = 0.18;

  if (source === "slash") {
    addVisualEffect(state, "hitSpark", enemy.x, enemy.y - 56, 0.34);
  } else if (source === "strongMagic") {
    addVisualEffect(state, "lightningStrike", enemy.x, enemy.y - 56, 0.38);
  } else if (source === "stone") {
    addVisualEffect(state, "fireBurst", enemy.x, enemy.y - 58, 0.4);
  } else if (source === "arrow") {
    addVisualEffect(state, "hitSpark", enemy.x, enemy.y - 62, 0.32);
  } else if (source === "arcane") {
    enemy.slowTimer = 1.35;
    enemy.slowFactor = 0.82;
    addVisualEffect(state, "iceBurst", enemy.x, enemy.y - 68, 0.45);
  } else {
    addVisualEffect(state, "hitSpark", enemy.x, enemy.y - 62, 0.32);
  }

  addFloatingText(state, `-${Math.round(damage)}`, enemy.x, enemy.y - 92, "#fef08a");

  if (enemy.hp <= 0) {
    markEnemyDefeated(state, enemy);
  }
}

function damageCastle(state: GameState, damage: number) {
  state.castleHp = Math.max(0, state.castleHp - damage);
  state.screenShake = Math.max(state.screenShake, 0.42);
  state.castleFlash = Math.max(state.castleFlash, 0.36);
  addVisualEffect(state, "castleDamage", 118, 292, 0.45);
}

function markUnitDefeated(state: GameState, unit: LaneUnit) {
  if (unit.deathTimer !== undefined) {
    return;
  }

  unit.hp = 0;
  unit.deathTimer = 0.38;
  addVisualEffect(state, "deathPoof", unit.x, unit.y - 42, 0.42);
}

function markEnemyDefeated(state: GameState, enemy: Enemy) {
  if (enemy.deathTimer !== undefined) {
    return;
  }

  enemy.hp = 0;
  enemy.deathTimer = 0.45;
  addVisualEffect(state, "deathPoof", enemy.x, enemy.y - 54, 0.5);
}

function levelUpIfReady(state: GameState) {
  while (state.xp >= state.nextLevelXp) {
    state.xp -= state.nextLevelXp;
    state.level += 1;
    state.upgradePoints += 1;
    state.nextLevelXp = Math.round(state.nextLevelXp * 1.24 + 30);
    addFloatingText(state, `Level ${state.level}`, 635, 94, "#7dd3fc");
    addAnnouncement(state, "level", `Level ${state.level}`, 2.1);
  }
}

function liveEnemies(state: GameState) {
  return state.enemies.filter(
    (enemy) => enemy.hp > 0 && enemy.deathTimer === undefined
  );
}

function addFloatingText(
  state: GameState,
  text: string,
  x: number,
  y: number,
  color: string
) {
  state.floatingTexts.push({
    id: state.nextId++,
    text,
    x,
    y,
    color,
    ttl: 1.35
  });

  if (state.floatingTexts.length > MAX_FLOATING_TEXTS) {
    state.floatingTexts.splice(0, state.floatingTexts.length - MAX_FLOATING_TEXTS);
  }
}

function addVisualEffect(
  state: GameState,
  type: VisualEffectType,
  x: number,
  y: number,
  ttl: number
) {
  state.visualEffects.push({
    id: state.nextId++,
    type,
    x,
    y,
    ttl,
    maxTtl: ttl
  });

  if (state.visualEffects.length > MAX_EFFECTS) {
    state.visualEffects.splice(0, state.visualEffects.length - MAX_EFFECTS);
  }
}

function addAnnouncement(
  state: GameState,
  type: AnnouncementType,
  text: string,
  ttl: number
) {
  state.announcements.push({
    id: state.nextId++,
    type,
    text,
    ttl,
    maxTtl: ttl
  });
}

function createUnitCooldowns(): Record<UnitType, number> {
  return {
    basicWizard: 0,
    archer: 0,
    knight: 0,
    catapult: 0,
    strongWizard: 0
  };
}

function liveUnits(state: GameState) {
  return state.units.filter(
    (unit) => unit.hp > 0 && unit.deathTimer === undefined
  );
}
