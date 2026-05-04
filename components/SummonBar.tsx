"use client";

import PixelSprite from "@/components/PixelSprite";
import {
  UNIT_DEFINITIONS,
  UNIT_ORDER,
  type GameSnapshot,
  type UnitType
} from "@/lib/gameEngine";

type SummonBarProps = {
  snapshot: GameSnapshot;
  onSummon: (unitType: UnitType) => void;
};

export default function SummonBar({ snapshot, onSummon }: SummonBarProps) {
  return (
    <div className="pixel-frame bg-[rgba(8,13,26,0.9)] p-2">
      <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
        {UNIT_ORDER.map((unitType) => {
          const unit = UNIT_DEFINITIONS[unitType];
          const cooldown = snapshot.unitCooldowns[unitType] ?? 0;
          const locked = snapshot.level < unit.unlockLevel;
          const cooldownRatio = unit.summonCooldown
            ? Math.max(0, Math.min(1, cooldown / unit.summonCooldown))
            : 0;
          const disabled =
            snapshot.gameOver || locked || snapshot.coins < unit.cost || cooldown > 0;
          const justSummoned = cooldown > unit.summonCooldown - 0.3;

          return (
            <button
              className={`summon-card group relative min-h-[132px] overflow-hidden border p-2 text-left transition duration-150 ${
                disabled
                  ? "border-white/10 bg-slate-950/72 opacity-65"
                  : "border-amber-200/55 bg-[rgba(16,25,45,0.96)] hover:-translate-y-0.5 hover:border-amber-200"
              } ${justSummoned ? "summon-bounce" : ""}`}
              disabled={disabled}
              key={unitType}
              onClick={() => onSummon(unitType)}
              type="button"
            >
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-purple-400 via-amber-300 to-emerald-300 opacity-80" />
              {cooldown > 0 ? (
                <div
                  className="absolute inset-x-0 bottom-0 bg-purple-400/30 transition-[height]"
                  style={{ height: `${cooldownRatio * 100}%` }}
                />
              ) : null}
              {locked ? (
                <div className="absolute inset-0 z-10 grid place-items-center bg-black/58 text-center text-[11px] font-black uppercase tracking-[0.14em] text-slate-200">
                  Unlock Lv {unit.unlockLevel}
                </div>
              ) : null}

              <div className="relative z-[1] flex h-full flex-col justify-between gap-2">
                <div className="flex items-start gap-2">
                  <div className="grid h-16 w-16 shrink-0 place-items-center border border-white/10 bg-black/24">
                    <PixelSprite
                      className="block [image-rendering:pixelated]"
                      height={64}
                      scale={unitType === "catapult" ? 1.45 : unitType === "knight" ? 1.55 : 1.65}
                      sprite={unit.sprite}
                      state={cooldown > 0 ? "attack" : "idle"}
                      width={64}
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[12px] font-black uppercase leading-4 tracking-[0.06em] text-amber-100">
                      {unit.label}
                    </div>
                    <div className="mt-1 text-[10px] leading-4 text-slate-300">
                      {unit.role}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-1 text-[10px] text-slate-300">
                  <span>HP {unit.hp}</span>
                  <span>ATK {unit.attack}</span>
                  <span>SPD {unit.attackSpeed.toFixed(1)}</span>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <span className="border border-amber-300/50 bg-amber-400/10 px-2 py-1 text-sm font-black text-amber-200 shadow-coin">
                    {unit.cost}g
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-200/90">
                    {cooldown > 0 ? `${cooldown.toFixed(1)}s` : locked ? "Locked" : "Summon"}
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
