import type { AnimationState } from "./animationSystem";

export type Pixel = string | null;
export type PixelMatrix = Pixel[][];

export type PixelSpriteAsset = {
  width: number;
  height: number;
  frames: PixelMatrix[];
};

export type PixelSpriteKey =
  | "wizardCastle"
  | "basicWizard"
  | "fireWizard"
  | "iceWizard"
  | "lightningWizard"
  | "catapultMage"
  | "archer"
  | "knightUnit"
  | "catapult"
  | "strongWizard"
  | "basicKnight"
  | "shieldKnight"
  | "fastScout"
  | "giantKnight"
  | "arcaneProjectile"
  | "arrowProjectile"
  | "slashProjectile"
  | "stoneProjectile"
  | "strongMagicProjectile"
  | "fireball"
  | "iceProjectile"
  | "lightningBolt"
  | "catapultOrb"
  | "coin"
  | "xp";

export type PixelEffectKey =
  | "hitSpark"
  | "deathPoof"
  | "castleDamage"
  | "fireBurst"
  | "iceBurst"
  | "lightningStrike"
  | "coinGain"
  | "xpGain";

export type PixelTileKey =
  | "skyTile"
  | "dirtPathTile"
  | "stoneRoadTile"
  | "grassTile"
  | "distantTower"
  | "villageHut"
  | "moon"
  | "spawnGate"
  | "magicCircle";

type WizardPalette = {
  robe: string;
  robeDark: string;
  trim: string;
  glow: string;
  hat: string;
  skin: string;
};

type KnightPalette = {
  armor: string;
  armorDark: string;
  trim: string;
  plume: string;
  shield?: string;
};

const OUTLINE = "#070a12";
const SHADOW = "rgba(0,0,0,0.42)";

const WIZARD_PALETTES: Record<
  "basicWizard" | "fireWizard" | "iceWizard" | "lightningWizard" | "strongWizard",
  WizardPalette
> = {
  basicWizard: {
    robe: "#7c3aed",
    robeDark: "#3b0764",
    trim: "#f7e8bd",
    glow: "#c084fc",
    hat: "#5b21b6",
    skin: "#f0c894"
  },
  fireWizard: {
    robe: "#dc2626",
    robeDark: "#7f1d1d",
    trim: "#fed7aa",
    glow: "#fb923c",
    hat: "#991b1b",
    skin: "#f0c894"
  },
  iceWizard: {
    robe: "#0891b2",
    robeDark: "#164e63",
    trim: "#cffafe",
    glow: "#67e8f9",
    hat: "#155e75",
    skin: "#f0c894"
  },
  lightningWizard: {
    robe: "#4c1d95",
    robeDark: "#1e1b4b",
    trim: "#fde68a",
    glow: "#facc15",
    hat: "#312e81",
    skin: "#f0c894"
  },
  strongWizard: {
    robe: "#9333ea",
    robeDark: "#312e81",
    trim: "#fde68a",
    glow: "#facc15",
    hat: "#581c87",
    skin: "#f0c894"
  }
};

const KNIGHT_PALETTES: Record<
  "basicKnight" | "shieldKnight" | "fastScout" | "giantKnight",
  KnightPalette
> = {
  basicKnight: {
    armor: "#cbd5e1",
    armorDark: "#475569",
    trim: "#94a3b8",
    plume: "#ef4444"
  },
  shieldKnight: {
    armor: "#d1d5db",
    armorDark: "#334155",
    trim: "#a3a3a3",
    plume: "#f59e0b",
    shield: "#78350f"
  },
  fastScout: {
    armor: "#94a3b8",
    armorDark: "#1f2937",
    trim: "#e2e8f0",
    plume: "#22d3ee"
  },
  giantKnight: {
    armor: "#e5e7eb",
    armorDark: "#374151",
    trim: "#fbbf24",
    plume: "#a855f7",
    shield: "#581c87"
  }
};

export function generatePixelSprite(
  key: PixelSpriteKey,
  state: AnimationState = "idle"
): PixelSpriteAsset {
  const frames = [0, 1, 2, 3].map((frame) => {
    if (isWizardKey(key)) {
      return createWizardSprite(key, state, frame);
    }

    if (key === "archer") {
      return createArcherSprite(state, frame);
    }

    if (key === "knightUnit") {
      return createFriendlyKnightSprite(state, frame);
    }

    if (key === "catapult") {
      return createCatapultSprite(state, frame);
    }

    if (key === "catapultMage") {
      return createCatapultMageSprite(state, frame);
    }

    if (isEnemyKey(key)) {
      return createEnemySprite(key, state, frame);
    }

    if (key === "wizardCastle") {
      return createCastleSprite(frame);
    }

    return createProjectileSprite(key, frame);
  });

  return {
    width: frames[0][0].length,
    height: frames[0].length,
    frames
  };
}

export function generatePixelEffect(key: PixelEffectKey): PixelSpriteAsset {
  const frames = [0, 1, 2, 3].map((frame) => {
    if (key === "hitSpark") {
      return createHitSpark(frame);
    }

    if (key === "deathPoof") {
      return createDeathPoof(frame);
    }

    if (key === "castleDamage") {
      return createCastleDamage(frame);
    }

    if (key === "fireBurst") {
      return createFireBurst(frame);
    }

    if (key === "iceBurst") {
      return createIceBurst(frame);
    }

    if (key === "lightningStrike") {
      return createLightningStrike(frame);
    }

    return key === "coinGain"
      ? createProjectileSprite("coin", frame)
      : createProjectileSprite("xp", frame);
  });

  return {
    width: frames[0][0].length,
    height: frames[0].length,
    frames
  };
}

export function generatePixelTile(key: PixelTileKey): PixelSpriteAsset {
  const matrix = createTile(key);

  return {
    width: matrix[0].length,
    height: matrix.length,
    frames: [matrix]
  };
}

function isWizardKey(key: PixelSpriteKey): key is keyof typeof WIZARD_PALETTES {
  return key in WIZARD_PALETTES;
}

function isEnemyKey(key: PixelSpriteKey): key is keyof typeof KNIGHT_PALETTES {
  return key in KNIGHT_PALETTES;
}

function blank(width = 32, height = 32): PixelMatrix {
  return Array.from({ length: height }, () => Array<Pixel>(width).fill(null));
}

function rect(
  matrix: PixelMatrix,
  x: number,
  y: number,
  width: number,
  height: number,
  color: string
) {
  for (let row = y; row < y + height; row += 1) {
    for (let col = x; col < x + width; col += 1) {
      setPixel(matrix, col, row, color);
    }
  }
}

function setPixel(matrix: PixelMatrix, x: number, y: number, color: string) {
  if (y < 0 || y >= matrix.length || x < 0 || x >= matrix[0].length) {
    return;
  }

  matrix[y][x] = color;
}

function line(
  matrix: PixelMatrix,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string
) {
  const dx = Math.abs(x2 - x1);
  const sx = x1 < x2 ? 1 : -1;
  const dy = -Math.abs(y2 - y1);
  const sy = y1 < y2 ? 1 : -1;
  let error = dx + dy;
  let x = x1;
  let y = y1;

  while (true) {
    setPixel(matrix, x, y, color);
    if (x === x2 && y === y2) {
      break;
    }

    const e2 = 2 * error;
    if (e2 >= dy) {
      error += dy;
      x += sx;
    }
    if (e2 <= dx) {
      error += dx;
      y += sy;
    }
  }
}

function shadow(matrix: PixelMatrix, x: number, y: number, width: number) {
  rect(matrix, x, y, width, 2, SHADOW);
  rect(matrix, x + 2, y - 1, width - 4, 1, "rgba(0,0,0,0.28)");
}

function createWizardSprite(
  key: keyof typeof WIZARD_PALETTES,
  state: AnimationState,
  frame: number
) {
  const matrix = blank();
  const palette = WIZARD_PALETTES[key];
  const walk = state === "walk" && frame % 2 === 1;
  const attack = state === "attack";
  const death = state === "death";
  const strong = key === "strongWizard";
  const sink = death ? 4 : 0;
  const glow = frame % 2 === 0 ? palette.glow : palette.trim;

  if (strong) {
    rect(matrix, 5, 12, 2, 2, "rgba(250,204,21,0.72)");
    rect(matrix, 25, 10, 2, 2, "rgba(192,132,252,0.72)");
    rect(matrix, 7, 25, 18, 1, "rgba(250,204,21,0.44)");
  }

  shadow(matrix, 8, 29, 17);
  rect(matrix, 11, 26 + sink, 4, 4, OUTLINE);
  rect(matrix, 18, 26 + (walk ? -1 : 0) + sink, 4, 4, OUTLINE);
  rect(matrix, 12, 25 + sink, 3, 4, palette.robeDark);
  rect(matrix, 18, 25 + (walk ? -1 : 0) + sink, 3, 4, palette.robeDark);

  rect(matrix, 9, 14 + sink, 15, 13, OUTLINE);
  rect(matrix, 10, 13 + sink, 13, 14, palette.robeDark);
  rect(matrix, 11, 14 + sink, 11, 12, palette.robe);
  rect(matrix, 11, 21 + sink, 11, 2, palette.trim);
  rect(matrix, 13, 15 + sink, 5, 3, "rgba(255,255,255,0.16)");

  rect(matrix, 13, 8 + sink, 7, 6, OUTLINE);
  rect(matrix, 14, 8 + sink, 5, 5, palette.skin);
  setPixel(matrix, 15, 10 + sink, "#3f2410");
  setPixel(matrix, 18, 10 + sink, "#3f2410");

  rect(matrix, 10, 6 + sink, 13, 3, OUTLINE);
  rect(matrix, 11, 5 + sink, 11, 3, palette.hat);
  rect(matrix, 13, 2 + sink, 7, 4, OUTLINE);
  rect(matrix, 14, 1 + sink, 5, 5, palette.hat);
  rect(matrix, 16, 0 + sink, 2, 2, glow);

  rect(matrix, 7, 17 + sink, 4, 8, OUTLINE);
  rect(matrix, 8, 18 + sink, 2, 6, palette.robe);
  rect(matrix, 22, 16 + sink, 3, 8, OUTLINE);
  rect(matrix, 22, 17 + sink, 2, 6, palette.robe);

  const staffX = attack ? 28 : 25;
  line(matrix, staffX, 6 + sink, staffX, 25 + sink, "#8b5a2b");
  rect(matrix, staffX - 2, 4 + sink, 5, 5, OUTLINE);
  rect(matrix, staffX - 1, 5 + sink, 3, 3, glow);
  if (attack) {
    rect(matrix, staffX - 1, 3 + sink, 7, 2, "rgba(255,255,255,0.86)");
    rect(matrix, staffX + 4, 6 + sink, 4, 3, glow);
  }

  if (death) {
    rect(matrix, 8, 25, 16, 3, "rgba(15,23,42,0.76)");
    setPixel(matrix, 6, 22, palette.glow);
    setPixel(matrix, 25, 24, palette.trim);
  }

  return matrix;
}

function createArcherSprite(state: AnimationState, frame: number) {
  const matrix = blank();
  const walk = state === "walk" && frame % 2 === 1;
  const attack = state === "attack";
  const sink = state === "death" ? 4 : 0;

  shadow(matrix, 8, 29, 17);
  rect(matrix, 11, 26 + sink, 4, 4, OUTLINE);
  rect(matrix, 18, 26 + (walk ? -1 : 0) + sink, 4, 4, OUTLINE);
  rect(matrix, 9, 14 + sink, 15, 13, OUTLINE);
  rect(matrix, 10, 14 + sink, 13, 12, "#14532d");
  rect(matrix, 11, 15 + sink, 5, 8, "#166534");
  rect(matrix, 14, 9 + sink, 7, 5, OUTLINE);
  rect(matrix, 15, 9 + sink, 5, 4, "#f0c894");
  rect(matrix, 12, 6 + sink, 11, 4, OUTLINE);
  rect(matrix, 13, 5 + sink, 9, 4, "#166534");
  rect(matrix, 7, 17 + sink, 4, 7, OUTLINE);
  rect(matrix, 23, 16 + sink, 3, 8, OUTLINE);

  line(matrix, 24, 8 + sink, 28, 16 + sink, "#92400e");
  line(matrix, 28, 16 + sink, 24, 27 + sink, "#92400e");
  line(matrix, attack ? 20 : 26, 11 + sink, attack ? 20 : 28, 25 + sink, "#f7e8bd");
  if (attack) {
    line(matrix, 21, 18 + sink, 31, 18 + sink, "#f7e8bd");
    rect(matrix, 29, 16 + sink, 3, 5, "#cbd5e1");
  }

  return matrix;
}

function createFriendlyKnightSprite(state: AnimationState, frame: number) {
  const matrix = blank();
  const walk = state === "walk" && frame % 2 === 1;
  const attack = state === "attack";
  const sink = state === "death" ? 4 : 0;
  const swordX = attack ? 28 : 24;

  shadow(matrix, 7, 29, 19);
  rect(matrix, 10, 26 + sink, 5, 4, OUTLINE);
  rect(matrix, 18, 26 + (walk ? -1 : 0) + sink, 5, 4, OUTLINE);
  rect(matrix, 9, 13 + sink, 16, 14, OUTLINE);
  rect(matrix, 11, 13 + sink, 12, 13, "#cbd5e1");
  rect(matrix, 12, 14 + sink, 4, 11, "#e5e7eb");
  rect(matrix, 12, 7 + sink, 9, 7, OUTLINE);
  rect(matrix, 13, 7 + sink, 7, 6, "#e5e7eb");
  rect(matrix, 12, 5 + sink, 10, 3, "#475569");
  rect(matrix, 6, 14 + sink, 6, 11, OUTLINE);
  rect(matrix, 7, 15 + sink, 4, 9, "#1d4ed8");
  rect(matrix, 8, 17 + sink, 2, 5, "#93c5fd");
  line(matrix, swordX, 8 + sink, swordX, 27 + sink, "#f8fafc");
  rect(matrix, swordX - 1, 7 + sink, 3, 2, "#fef3c7");
  if (attack) {
    line(matrix, 24, 9 + sink, 31, 5 + sink, "#fef3c7");
  }

  return matrix;
}

function createCatapultSprite(state: AnimationState, frame: number) {
  const matrix = blank();
  const recoil = state === "attack" ? -3 : 0;
  const wheel = frame % 2 === 0 ? "#78350f" : "#92400e";

  shadow(matrix, 4, 29, 24);
  rect(matrix, 4, 20, 24, 6, OUTLINE);
  rect(matrix, 5, 20, 22, 5, "#7c2d12");
  rect(matrix, 8, 16, 15, 4, "#a16207");
  rect(matrix, 5, 25, 6, 6, OUTLINE);
  rect(matrix, 21, 25, 6, 6, OUTLINE);
  rect(matrix, 6, 26, 4, 4, wheel);
  rect(matrix, 22, 26, 4, 4, wheel);
  line(matrix, 14 + recoil, 9, 16 + recoil, 21, "#854d0e");
  line(matrix, 9 + recoil, 8, 25 + recoil, 6, "#b45309");
  rect(matrix, 23 + recoil, 3, 5, 5, OUTLINE);
  rect(matrix, 24 + recoil, 4, 3, 3, "#64748b");
  rect(matrix, 8, 12, 5, 7, "#64748b");

  return matrix;
}

function createCatapultMageSprite(state: AnimationState, frame: number) {
  const matrix = createCatapultSprite(state, frame);
  rect(matrix, 6, 9, 6, 10, OUTLINE);
  rect(matrix, 7, 10, 4, 8, "#581c87");
  rect(matrix, 7, 6, 4, 4, "#f0c894");
  rect(matrix, 6, 4, 6, 3, "#312e81");
  return matrix;
}

function createEnemySprite(
  key: keyof typeof KNIGHT_PALETTES,
  state: AnimationState,
  frame: number
) {
  const matrix = blank();
  const palette = KNIGHT_PALETTES[key];
  const giant = key === "giantKnight";
  const scout = key === "fastScout";
  const walk = state === "walk" && frame % 2 === 1;
  const attack = state === "attack";
  const sink = state === "death" ? 4 : 0;
  const boost = giant ? 3 : 0;

  shadow(matrix, giant ? 4 : 8, 29, giant ? 24 : 17);
  rect(matrix, 10 - boost, 26 + sink, 5, 4, OUTLINE);
  rect(matrix, 18, 26 + (walk ? -1 : 0) + sink, 5 + boost, 4, OUTLINE);
  rect(matrix, 9 - boost, 13 - boost + sink, 16 + boost * 2, 14 + boost, OUTLINE);
  rect(matrix, 11 - boost, 13 - boost + sink, 12 + boost * 2, 13 + boost, palette.armor);
  rect(matrix, 12 - boost, 15 - boost + sink, 5, 8 + boost, palette.trim);
  rect(matrix, 12 - boost, 7 - boost + sink, 9 + boost * 2, 7 + boost, OUTLINE);
  rect(matrix, 13 - boost, 7 - boost + sink, 7 + boost * 2, 6 + boost, palette.armor);
  rect(matrix, 12 - boost, 5 - boost + sink, 10 + boost * 2, 3, palette.armorDark);
  rect(matrix, 15, 2 - boost + sink, 3 + boost, 4, palette.plume);
  const swordX = attack ? 28 : 24;
  line(matrix, swordX, 8 - boost + sink, swordX, 27 + sink, "#e5e7eb");

  if (palette.shield) {
    rect(matrix, 5 - boost, 14 - boost + sink, 6 + boost, 11 + boost, OUTLINE);
    rect(matrix, 6 - boost, 15 - boost + sink, 4 + boost, 9 + boost, palette.shield);
    rect(matrix, 7 - boost, 17 - boost + sink, 2 + boost, 4 + boost, palette.trim);
  }

  if (scout) {
    rect(matrix, 7, 18 + sink, 3, 7, "#0f172a");
    rect(matrix, 22, 11 + sink, 5, 3, palette.trim);
  }

  return matrix;
}

function createCastleSprite(frame: number) {
  const matrix = blank();
  const glow = frame % 2 === 0 ? "#c084fc" : "#a78bfa";

  rect(matrix, 5, 9, 22, 21, OUTLINE);
  rect(matrix, 7, 10, 18, 20, "#334155");
  rect(matrix, 3, 13, 8, 17, OUTLINE);
  rect(matrix, 4, 14, 6, 16, "#475569");
  rect(matrix, 22, 13, 8, 17, OUTLINE);
  rect(matrix, 23, 14, 6, 16, "#475569");
  rect(matrix, 2, 10, 10, 4, "#64748b");
  rect(matrix, 20, 10, 10, 4, "#64748b");
  rect(matrix, 6, 6, 20, 4, "#64748b");
  rect(matrix, 9, 2, 5, 6, "#7c3aed");
  rect(matrix, 18, 2, 5, 6, "#7c3aed");
  rect(matrix, 13, 19, 7, 11, OUTLINE);
  rect(matrix, 15, 20, 3, 10, "#24143d");
  rect(matrix, 8, 16, 3, 4, glow);
  rect(matrix, 22, 16, 3, 4, glow);
  rect(matrix, 15, 8, 3, 5, "#facc15");
  rect(matrix, 16, 4, 1, 4, "#fef08a");
  return matrix;
}

function createProjectileSprite(key: PixelSpriteKey, frame: number) {
  const matrix = blank(16, 16);
  const flicker = frame % 2 === 0;

  if (key === "arcaneProjectile") {
    rect(matrix, 2, 6, 11, 4, "rgba(168,85,247,0.35)");
    rect(matrix, 5, 4, 6, 6, flicker ? "#c084fc" : "#f0abfc");
    rect(matrix, 10, 6, 3, 3, "#f7e8bd");
    return matrix;
  }

  if (key === "arrowProjectile") {
    line(matrix, 1, 8, 13, 8, "#f7e8bd");
    rect(matrix, 12, 6, 3, 5, "#cbd5e1");
    rect(matrix, 0, 6, 3, 2, "#92400e");
    rect(matrix, 0, 9, 3, 2, "#92400e");
    return matrix;
  }

  if (key === "slashProjectile") {
    line(matrix, 8, 1, 7, 14, flicker ? "#fef3c7" : "#facc15");
    line(matrix, 9, 4, 11, 12, "rgba(255,255,255,0.72)");
    return matrix;
  }

  if (key === "stoneProjectile") {
    rect(matrix, 4, 3, 8, 9, OUTLINE);
    rect(matrix, 5, 2, 6, 3, flicker ? "#64748b" : "#475569");
    rect(matrix, 4, 6, 9, 6, "#64748b");
    return matrix;
  }

  if (key === "strongMagicProjectile") {
    rect(matrix, 2, 5, 12, 6, "rgba(168,85,247,0.35)");
    rect(matrix, 5, 3, 6, 10, flicker ? "#facc15" : "#c084fc");
    rect(matrix, 7, 1, 2, 14, "rgba(255,255,255,0.5)");
    return matrix;
  }

  if (key === "fireball") {
    rect(matrix, 0, 6, 6, 4, "rgba(248,113,113,0.5)");
    rect(matrix, 4, 4, 8, 8, "#dc2626");
    rect(matrix, 7, 5, 7, 5, "#fb923c");
    rect(matrix, flicker ? 10 : 11, 6, 3, 3, "#fef08a");
    return matrix;
  }

  if (key === "iceProjectile") {
    rect(matrix, 2, 7, 10, 2, "#0891b2");
    rect(matrix, 6, 4, 5, 7, flicker ? "#67e8f9" : "#cffafe");
    rect(matrix, 11, 6, 3, 3, "#ecfeff");
    return matrix;
  }

  if (key === "lightningBolt") {
    rect(matrix, 2, 3, 5, 3, flicker ? "#fde047" : "#fef3c7");
    rect(matrix, 5, 6, 6, 3, "#facc15");
    rect(matrix, 9, 9, 5, 3, flicker ? "#fde047" : "#ffffff");
    return matrix;
  }

  if (key === "catapultOrb") {
    rect(matrix, 4, 4, 8, 8, "#3f2410");
    rect(matrix, 6, 3, 4, 3, flicker ? "#7c3aed" : "#facc15");
    rect(matrix, 2, 7, 12, 2, "rgba(250,204,21,0.3)");
    return matrix;
  }

  if (key === "coin") {
    const thin = flicker;
    rect(matrix, thin ? 6 : 4, 3, thin ? 4 : 8, 10, "#b45309");
    rect(matrix, thin ? 7 : 5, 4, thin ? 2 : 6, 8, "#facc15");
    rect(matrix, 8, 5, 1, 6, "#fff7ed");
    return matrix;
  }

  rect(matrix, 4, 4, 8, 8, "#1e1b4b");
  rect(matrix, 5, 5, 6, 6, flicker ? "#38bdf8" : "#a78bfa");
  rect(matrix, 8, 2, 1, 12, "rgba(255,255,255,0.4)");
  return matrix;
}

function createHitSpark(frame: number) {
  const matrix = blank(16, 16);
  const reach = 3 + frame * 2;
  line(matrix, 8, 8 - reach, 8, 8 + reach, "#fef08a");
  line(matrix, 8 - reach, 8, 8 + reach, 8, "#fef08a");
  rect(matrix, 6, 6, 4, 4, "#ffffff");
  return matrix;
}

function createDeathPoof(frame: number) {
  const matrix = blank(16, 16);
  const spread = frame * 2;
  rect(matrix, 2 - spread, 6, 5, 5, "rgba(148,163,184,0.55)");
  rect(matrix, 9 + spread, 4, 5, 5, "rgba(203,213,225,0.45)");
  rect(matrix, 6, 8 + spread, 5, 4, "rgba(71,85,105,0.5)");
  return matrix;
}

function createCastleDamage(frame: number) {
  const matrix = blank(16, 16);
  rect(matrix, 4, 3, 8, 10, `rgba(251,113,133,${0.78 - frame * 0.16})`);
  rect(matrix, 10, 7, 3, 3, "#fee2e2");
  return matrix;
}

function createFireBurst(frame: number) {
  const matrix = blank(16, 16);
  rect(matrix, 2, 6, 12, 5, `rgba(220,38,38,${0.7 - frame * 0.12})`);
  rect(matrix, 5, 2 + frame, 7, 9, "#fb923c");
  rect(matrix, 7, 5, 3, 5, "#fef08a");
  return matrix;
}

function createIceBurst(frame: number) {
  const matrix = blank(16, 16);
  const reach = 4 + frame * 2;
  line(matrix, 8, 8 - reach, 8, 8 + reach, "#cffafe");
  line(matrix, 8 - reach, 8, 8 + reach, 8, "#67e8f9");
  rect(matrix, 5, 5, 6, 6, "rgba(8,145,178,0.45)");
  return matrix;
}

function createLightningStrike(frame: number) {
  const matrix = blank(16, 32);
  rect(matrix, 6, 0, 4, 12, frame % 2 === 0 ? "#fef08a" : "#ffffff");
  rect(matrix, 8, 11, 4, 8, "#facc15");
  rect(matrix, 5, 18, 5, 12, "rgba(255,255,255,0.65)");
  return matrix;
}

function createTile(key: PixelTileKey) {
  const matrix = blank();

  if (key === "skyTile") {
    rect(matrix, 0, 0, 32, 32, "#07111d");
    setPixel(matrix, 4, 5, "rgba(247,232,189,0.5)");
    setPixel(matrix, 18, 11, "rgba(247,232,189,0.32)");
    setPixel(matrix, 27, 3, "rgba(247,232,189,0.58)");
    setPixel(matrix, 11, 24, "rgba(168,85,247,0.24)");
    return matrix;
  }

  if (key === "dirtPathTile") {
    rect(matrix, 0, 0, 32, 32, "#2b263a");
    rect(matrix, 0, 0, 32, 7, "#3b3350");
    line(matrix, 4, 0, 12, 31, "rgba(255,244,191,0.08)");
    line(matrix, 20, 0, 29, 31, "rgba(255,244,191,0.07)");
    setPixel(matrix, 6, 18, "rgba(247,232,189,0.16)");
    setPixel(matrix, 23, 12, "rgba(247,232,189,0.12)");
    return matrix;
  }

  if (key === "stoneRoadTile") {
    rect(matrix, 0, 0, 32, 32, "#0b1018");
    rect(matrix, 1, 4, 29, 20, "#111827");
    rect(matrix, 4, 8, 22, 2, "rgba(168,85,247,0.14)");
    rect(matrix, 0, 0, 32, 2, "#050712");
    return matrix;
  }

  if (key === "grassTile") {
    rect(matrix, 0, 0, 32, 32, "#122019");
    rect(matrix, 0, 0, 32, 8, "#16351f");
    setPixel(matrix, 5, 6, "#2f7d32");
    setPixel(matrix, 16, 2, "#3f8f3f");
    setPixel(matrix, 25, 7, "#245c2c");
    return matrix;
  }

  if (key === "distantTower") {
    rect(matrix, 6, 7, 18, 23, "#171e2f");
    rect(matrix, 10, 2, 10, 7, "#1f2a44");
    rect(matrix, 9, 15, 2, 4, "rgba(251,191,36,0.28)");
    rect(matrix, 20, 11, 2, 4, "rgba(251,191,36,0.22)");
    return matrix;
  }

  if (key === "villageHut") {
    rect(matrix, 4, 18, 23, 9, "#472514");
    line(matrix, 3, 18, 15, 9, "#5a2a16");
    line(matrix, 15, 9, 29, 18, "#5a2a16");
    rect(matrix, 14, 21, 4, 5, "rgba(250,204,21,0.24)");
    return matrix;
  }

  if (key === "moon") {
    rect(matrix, 8, 6, 11, 11, "#f7e8bd");
    rect(matrix, 5, 8, 4, 8, "#f7e8bd");
    rect(matrix, 4, 16, 12, 3, "#f7e8bd");
    rect(matrix, 4, 4, 8, 15, "#07111d");
    return matrix;
  }

  if (key === "spawnGate") {
    rect(matrix, 8, 8, 17, 19, OUTLINE);
    rect(matrix, 10, 10, 13, 17, "#111827");
    rect(matrix, 12, 12, 9, 4, "#ef4444");
    rect(matrix, 11, 17, 3, 7, "#cbd5e1");
    rect(matrix, 19, 17, 3, 7, "#cbd5e1");
    return matrix;
  }

  rect(matrix, 5, 14, 22, 3, "rgba(168,85,247,0.72)");
  rect(matrix, 14, 5, 3, 22, "rgba(168,85,247,0.52)");
  rect(matrix, 9, 9, 14, 14, "rgba(168,85,247,0.2)");
  rect(matrix, 13, 13, 6, 6, "rgba(250,204,21,0.28)");
  return matrix;
}
