"use client";

import type { GameSnapshot } from "@/lib/gameEngine";

type BattlefieldEffectsProps = {
  snapshot: GameSnapshot;
};

export default function BattlefieldEffects({ snapshot }: BattlefieldEffectsProps) {
  const latestBanner = snapshot.announcements[0];
  const castleFlashOpacity = Math.max(0, Math.min(1, snapshot.castleFlash / 0.36));
  const boss = snapshot.enemies.find(
    (enemy) => enemy.type === "giantKnight" && enemy.hp > 0
  );
  const bossHpRatio = boss ? Math.max(0, Math.min(1, boss.hp / boss.maxHp)) : 0;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {boss ? (
        <div className="absolute left-1/2 top-3 w-[min(560px,82%)] -translate-x-1/2 border border-rose-300/70 bg-black/70 p-2">
          <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-[0.16em] text-rose-100">
            <span>Giant Knight Boss</span>
            <span>{Math.ceil(boss.hp)} / {boss.maxHp} HP</span>
          </div>
          <div className="mt-2 h-3 border border-white/20 bg-black/50">
            <div
              className="h-full bg-rose-400 shadow-[0_0_14px_rgba(251,113,133,0.8)]"
              style={{ width: `${bossHpRatio * 100}%` }}
            />
          </div>
        </div>
      ) : null}

      {snapshot.paused ? (
        <div className="absolute inset-0 grid place-items-center bg-black/28">
          <div className="border border-sky-200/70 bg-slate-950/85 px-5 py-3 text-lg font-black uppercase tracking-[0.18em] text-sky-100">
            Paused
          </div>
        </div>
      ) : null}

      {castleFlashOpacity > 0 ? (
        <div
          className="absolute inset-0 bg-rose-500 mix-blend-screen"
          style={{ opacity: castleFlashOpacity * 0.24 }}
        />
      ) : null}

      {latestBanner ? (
        <div
          className={`battle-banner absolute left-1/2 top-8 -translate-x-1/2 border px-5 py-3 text-center shadow-2xl ${
            latestBanner.type === "boss"
              ? "border-rose-300/70 bg-rose-950/82 text-rose-100"
              : latestBanner.type === "level"
                ? "border-sky-300/70 bg-sky-950/80 text-sky-100"
                : "border-amber-200/70 bg-slate-950/82 text-amber-100"
          }`}
          style={{
            opacity: Math.max(0, Math.min(1, latestBanner.ttl / 0.45))
          }}
        >
          <div className="text-[10px] font-black uppercase tracking-[0.28em] text-white/70">
            {latestBanner.type === "boss" ? "Warning" : latestBanner.type}
          </div>
          <div className="mt-1 text-lg font-black uppercase tracking-[0.08em]">
            {latestBanner.text}
          </div>
        </div>
      ) : null}
    </div>
  );
}
