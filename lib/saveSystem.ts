import type { PermanentUpgrades } from "./gameEngine";

export type SavedProgress = {
  level: number;
  xp: number;
  nextLevelXp: number;
  coins: number;
  upgrades: PermanentUpgrades;
  weakTopics: Record<string, number>;
};

const SAVE_KEY = "micro-defense-save-v1";

export function loadProgress(): SavedProgress | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }

  try {
    const raw = window.localStorage.getItem(SAVE_KEY);
    if (!raw) {
      return undefined;
    }

    const parsed = JSON.parse(raw) as Partial<SavedProgress>;

    return {
      level: safeNumber(parsed.level, 1),
      xp: safeNumber(parsed.xp, 0),
      nextLevelXp: safeNumber(parsed.nextLevelXp, 100),
      coins: safeNumber(parsed.coins, 150),
      upgrades: {
        castleHp: safeNumber(parsed.upgrades?.castleHp, 0),
        coinGain: safeNumber(parsed.upgrades?.coinGain, 0),
        unitDamage: safeNumber(parsed.upgrades?.unitDamage, 0),
        fasterSpawn: safeNumber(parsed.upgrades?.fasterSpawn, 0)
      },
      weakTopics: sanitizeRecord(parsed.weakTopics)
    };
  } catch {
    return undefined;
  }
}

export function saveProgress(progress: SavedProgress) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(SAVE_KEY, JSON.stringify(progress));
}

export function clearProgress() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(SAVE_KEY);
}

function safeNumber(value: unknown, fallback: number) {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric >= 0 ? numeric : fallback;
}

function sanitizeRecord(record: unknown) {
  if (!record || typeof record !== "object") {
    return {};
  }

  return Object.fromEntries(
    Object.entries(record as Record<string, unknown>)
      .map(([key, value]): [string, number] => [key, safeNumber(value, 0)])
      .filter(([, value]) => value > 0)
  );
}
