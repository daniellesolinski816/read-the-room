import React from 'react';
import { getUserLevel, getLevelProgress } from './userLevels';

export default function LevelBadge({ totalPoints = 0, showProgress = false, size = 'sm' }) {
  const { current, next, pct } = getLevelProgress(totalPoints);

  if (size === 'lg') {
    return (
      <div className="bg-[#252542] rounded-xl p-5 border border-[#2F2F4A]">
        <div className="flex items-center gap-4 mb-4">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center text-2xl border-2"
            style={{ borderColor: current.color, background: `${current.color}18` }}
          >
            {current.emoji}
          </div>
          <div>
            <p className="text-xs text-[#6B6B8D] uppercase tracking-widest mb-0.5">Level {current.level}</p>
            <p className="font-serif text-xl" style={{ color: current.color }}>{current.title}</p>
            <p className="text-xs text-[#6B6B8D] mt-0.5">{totalPoints.toLocaleString()} points</p>
          </div>
        </div>
        {next && (
          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-[#6B6B8D]">Progress to <span style={{ color: next.color }}>{next.title}</span></span>
              <span className="text-[#6B6B8D]">{pct}%</span>
            </div>
            <div className="h-2 bg-[#1A1A2E] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${pct}%`, background: current.color }}
              />
            </div>
            <p className="text-xs text-[#6B6B8D] mt-1.5">{next.minPoints - totalPoints} pts to next level</p>
          </div>
        )}
        {!next && (
          <p className="text-xs text-center" style={{ color: current.color }}>Maximum level reached ✨</p>
        )}
      </div>
    );
  }

  // Default small badge
  return (
    <span
      className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border font-medium"
      style={{ borderColor: `${current.color}50`, color: current.color, background: `${current.color}12` }}
      title={`Level ${current.level} — ${totalPoints} points`}
    >
      <span>{current.emoji}</span>
      <span>Lv.{current.level} {current.title}</span>
    </span>
  );
}