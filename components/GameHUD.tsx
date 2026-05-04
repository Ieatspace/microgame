"use client";

import type { ReactNode } from "react";
import type { GameSnapshot } from "@/lib/gameEngine";

type GameHUDProps = {
  snapshot: GameSnapshot;
};

export default function GameHUD({ snapshot }: GameHUDProps) {
  const hpRatio = snapshot.castleHp / snapshot.maxCastleHp;
  const xpRatio = snapshot.xp / snapshot.nextLevelXp;

  return (
    <div className="grid gap-2 sm:grid-cols-2 xl:min-w-[820px] xl:grid-cols-5">
      <HudBlock label="Castle HP" value={`${snapshot.castleHp}/${snapshot.maxCastleHp}`}>
        <PixelMeter color="#34d399" ratio={hpRatio} />
      </HudBlock>
      <HudBlock label="Gold" tone="gold" value={`${snapshot.coins}g`} />
      <HudBlock label="XP" value={`${snapshot.xp}/${snapshot.nextLevelXp}`}>
        <PixelMeter color="#60a5fa" ratio={xpRatio} />
      </HudBlock>
      <HudBlock label="Level" tone="violet" value={`Lv ${snapshot.level}`} />
      <HudBlock label="Wave" value={snapshot.wave === 0 ? "Ready" : `${snapshot.wave}`} />
    </div>
  );
}

function HudBlock({
  label,
  value,
  tone,
  children
}: {
  label: string;
  value: string;
  tone?: "gold" | "violet";
  children?: ReactNode;
}) {
  return (
    <div className="hud-block border border-amber-100/20 bg-black/30 px-3 py-2">
      <div className="flex items-center justify-between gap-3">
        <span className="text-[10px] uppercase tracking-[0.16em] text-slate-300">
          {label}
        </span>
        <span
          className={`text-sm font-black ${
            tone === "gold"
              ? "text-amber-200"
              : tone === "violet"
                ? "text-purple-200"
                : "text-amber-50"
          }`}
        >
          {value}
        </span>
      </div>
      {children ? <div className="mt-2">{children}</div> : null}
    </div>
  );
}

function PixelMeter({ ratio, color }: { ratio: number; color: string }) {
  const width = `${Math.max(0, Math.min(1, ratio)) * 100}%`;

  return (
    <div className="h-2 border border-white/15 bg-black/45">
      <div
        className="h-full shadow-[0_0_14px_currentColor]"
        style={{ width, backgroundColor: color, color }}
      />
    </div>
  );
}
