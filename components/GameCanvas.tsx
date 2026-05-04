"use client";

import { useEffect, useRef } from "react";
import type { MutableRefObject } from "react";
import {
  ENEMY_DEFINITIONS,
  UNIT_DEFINITIONS,
  getSnapshot,
  tickGame,
  type Enemy,
  type GameSnapshot,
  type GameState,
  type LaneUnit,
  type Projectile
} from "@/lib/gameEngine";
import {
  getEnemyAnimation,
  getUnitAnimation,
  getAnimationFrame
} from "@/lib/animationSystem";
import {
  drawPixelBar,
  drawPixelBattlefield,
  drawPixelEffect,
  drawPixelPanel,
  drawPixelSprite,
  type SpriteKey
} from "@/lib/spriteSystem";

type GameCanvasProps = {
  stateRef: MutableRefObject<GameState>;
  onSnapshot: (snapshot: GameSnapshot) => void;
};

const PROJECTILE_SPRITE: Record<Projectile["type"], SpriteKey> = {
  arcane: "arcaneProjectile",
  arrow: "arrowProjectile",
  slash: "slashProjectile",
  stone: "stoneProjectile",
  strongMagic: "strongMagicProjectile"
};

export default function GameCanvas({
  stateRef,
  onSnapshot
}: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const state = stateRef.current;
    canvas.width = state.width * dpr;
    canvas.height = state.height * dpr;
    const context = canvas.getContext("2d");

    if (!context) {
      return;
    }

    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    context.imageSmoothingEnabled = false;

    let frameId = 0;
    let lastTime = performance.now();
    let lastSnapshot = 0;

    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;

      tickGame(stateRef.current, dt);
      renderGame(context, stateRef.current);

      if (now - lastSnapshot > 100) {
        onSnapshot(getSnapshot(stateRef.current));
        lastSnapshot = now;
      }

      frameId = requestAnimationFrame(loop);
    };

    frameId = requestAnimationFrame(loop);

    return () => cancelAnimationFrame(frameId);
  }, [onSnapshot, stateRef]);

  return (
    <canvas
      aria-label="Micro Defense battlefield"
      className="block aspect-[96/46] w-full bg-[#07111d] [image-rendering:pixelated]"
      height={460}
      ref={canvasRef}
      width={960}
    />
  );
}

function renderGame(context: CanvasRenderingContext2D, state: GameState) {
  context.clearRect(0, 0, state.width, state.height);

  const shakeStrength = state.screenShake > 0 ? state.screenShake / 0.42 : 0;
  const shakeX = Math.round(Math.sin(state.time * 94) * 7 * shakeStrength);
  const shakeY = Math.round(Math.cos(state.time * 71) * 4 * shakeStrength);

  context.save();
  context.translate(shakeX, shakeY);
  drawBackground(context, state);
  drawPixelSprite(context, "wizardCastle", {
    x: 94,
    y: 386,
    scale: 3.9,
    frame: getAnimationFrame(state.time, 1, "idle"),
    state: "idle",
    flash: state.castleFlash / 0.36
  });
  drawCastleWard(context, state);

  const drawables = [
    ...state.units.map((unit) => ({
      kind: "unit" as const,
      entity: unit,
      x: unit.x
    })),
    ...state.enemies.map((enemy) => ({
      kind: "enemy" as const,
      entity: enemy,
      x: enemy.x
    }))
  ].sort((a, b) => a.x - b.x);

  for (const drawable of drawables) {
    if (drawable.kind === "unit") {
      drawUnit(context, state, drawable.entity);
    } else {
      drawEnemy(context, state, drawable.entity);
    }
  }

  for (const projectile of state.projectiles) {
    drawProjectile(context, state, projectile);
  }

  for (const effect of state.visualEffects) {
    drawPixelEffect(context, effect.type, {
      x: effect.x,
      y: effect.y,
      scale: effect.type === "lightningStrike" ? 2.6 : 3,
      progress: 1 - effect.ttl / effect.maxTtl,
      alpha: Math.max(0, Math.min(1, effect.ttl / effect.maxTtl))
    });
  }

  drawFloatingTexts(context, state);
  context.restore();

  if (state.gameOver) {
    drawGameOver(context, state);
  }
}

function drawBackground(context: CanvasRenderingContext2D, state: GameState) {
  drawPixelBattlefield(context, {
    width: state.width,
    height: state.height,
    time: state.time
  });
}

function drawCastleWard(context: CanvasRenderingContext2D, state: GameState) {
  const hpRatio = state.castleHp / state.maxCastleHp;
  context.save();
  context.strokeStyle = hpRatio > 0.35 ? "rgba(168,85,247,0.64)" : "rgba(251,113,133,0.8)";
  context.lineWidth = 3;
  context.shadowColor = context.strokeStyle;
  context.shadowBlur = 18;
  context.beginPath();
  context.arc(104, 292, 48 + Math.sin(state.time * 1.8) * 3, 0, Math.PI * 2);
  context.stroke();
  context.restore();
}

function drawUnit(
  context: CanvasRenderingContext2D,
  state: GameState,
  unit: LaneUnit
) {
  const definition = UNIT_DEFINITIONS[unit.type];
  const hasTarget = state.enemies.some(
    (enemy) =>
      enemy.hp > 0 &&
      enemy.deathTimer === undefined &&
      enemy.x >= unit.x &&
      enemy.x - unit.x <= definition.range
  );
  const animation = getUnitAnimation(unit, {
    moving: !hasTarget && unit.x < 718,
    time: state.time
  });
  const scale = unit.type === "catapult" ? 3.25 : unit.type === "knight" ? 3.35 : 3.15;
  const y = unit.y + animation.offsetY;

  drawPixelSprite(context, definition.sprite, {
    x: unit.x,
    y,
    scale,
    frame: animation.frame,
    state: animation.state,
    flash: animation.flash
  });

  const barWidth = unit.type === "catapult" ? 92 : unit.type === "knight" ? 78 : 68;
  drawHealthBar(
    context,
    unit.x - barWidth / 2,
    unit.y - (unit.type === "catapult" ? 128 : 120),
    barWidth,
    unit.hp / unit.maxHp,
    "#34d399"
  );
}

function drawEnemy(
  context: CanvasRenderingContext2D,
  state: GameState,
  enemy: Enemy
) {
  const definition = ENEMY_DEFINITIONS[enemy.type];
  const blocked = state.units.some(
    (unit) =>
      unit.hp > 0 &&
      unit.deathTimer === undefined &&
      Math.abs(unit.x - enemy.x) < 46
  );
  const animation = getEnemyAnimation(enemy, {
    blocked,
    time: state.time
  });
  const scale = getEnemyScale(enemy.type);
  const y = enemy.y + animation.offsetY + (enemy.type === "giantKnight" ? 8 : 0);

  drawPixelSprite(context, definition.sprite, {
    x: enemy.x,
    y,
    scale,
    frame: animation.frame,
    state: animation.state,
    flip: true,
    flash: animation.flash
  });

  const barWidth = enemy.type === "giantKnight" ? 150 : enemy.type === "shieldKnight" ? 88 : 72;
  drawHealthBar(
    context,
    enemy.x - barWidth / 2,
    enemy.y - (enemy.type === "giantKnight" ? 170 : 122),
    barWidth,
    enemy.hp / enemy.maxHp,
    enemy.slowTimer > 0 ? "#67e8f9" : "#fb7185"
  );
}

function drawProjectile(
  context: CanvasRenderingContext2D,
  state: GameState,
  projectile: Projectile
) {
  const sprite = PROJECTILE_SPRITE[projectile.type];
  const frame = getAnimationFrame(state.time, projectile.id, "walk");
  const scale =
    projectile.type === "stone"
      ? 2.6
      : projectile.type === "strongMagic"
        ? 2.3
        : 2.4;

  drawPixelSprite(context, sprite, {
    x: projectile.x,
    y: projectile.y,
    scale,
    frame,
    state: "walk"
  });
}

function drawFloatingTexts(
  context: CanvasRenderingContext2D,
  state: GameState
) {
  for (const text of state.floatingTexts) {
    context.save();
    const alpha = Math.max(0, Math.min(1, text.ttl));
    context.globalAlpha = alpha;
    context.font = "700 14px Courier New";
    context.textAlign = "left";
    context.fillStyle = "rgba(0,0,0,0.86)";
    context.fillText(text.text, text.x + 2, text.y + 2);
    context.fillStyle = text.color;
    context.shadowColor = text.color;
    context.shadowBlur = 8;
    context.fillText(text.text, text.x, text.y);
    context.restore();
  }
}

function drawHealthBar(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  ratio: number,
  color: string
) {
  drawPixelBar(context, x, y, width, ratio, color);
}

function getEnemyScale(enemyType: Enemy["type"]) {
  if (enemyType === "giantKnight") {
    return 4.8;
  }

  if (enemyType === "shieldKnight") {
    return 3.2;
  }

  if (enemyType === "fastScout") {
    return 2.8;
  }

  return 3.05;
}

function drawGameOver(context: CanvasRenderingContext2D, state: GameState) {
  drawPixelPanel(context, 0, 0, state.width, state.height, "rgba(3,5,12,0.76)");
  context.fillStyle = "#f7e8bd";
  context.font = "900 34px Courier New";
  context.textAlign = "center";
  context.fillText("The Castle Has Fallen", state.width / 2, 190);
  context.font = "700 15px Courier New";
  context.fillStyle = "#facc15";
  context.fillText("Use your earned upgrades, then restart the run.", state.width / 2, 224);
  context.textAlign = "left";
}
