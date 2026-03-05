import React from 'react';
import { motion } from 'framer-motion';
import { Target } from 'lucide-react';

const SIZE = 120;
const STROKE = 8;
const R = (SIZE - STROKE) / 2;
const CIRC = 2 * Math.PI * R;

export default function DailyGoalRing({ sessionsToday, dailyGoal }) {
  if (!dailyGoal || dailyGoal <= 0) return null;

  const progress = Math.min(sessionsToday / dailyGoal, 1);
  const offset = CIRC * (1 - progress);
  const done = sessionsToday >= dailyGoal;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: SIZE, height: SIZE }}>
        <svg width={SIZE} height={SIZE} className="-rotate-90">
          <circle
            cx={SIZE / 2} cy={SIZE / 2} r={R}
            fill="none" stroke="#2F2F4A" strokeWidth={STROKE}
          />
          <motion.circle
            cx={SIZE / 2} cy={SIZE / 2} r={R}
            fill="none"
            stroke={done ? '#4ade80' : '#C9943A'}
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={CIRC}
            initial={{ strokeDashoffset: CIRC }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <Target className={`w-4 h-4 mb-0.5 ${done ? 'text-green-400' : 'text-[#C9943A]'}`} />
          <span className={`text-lg font-bold leading-none ${done ? 'text-green-400' : 'text-[#E8E4DA]'}`}>
            {sessionsToday}/{dailyGoal}
          </span>
        </div>
      </div>
      <p className="text-xs text-[#6B6B8D] text-center">
        {done ? '🎉 Goal complete!' : "Today's goal"}
      </p>
    </div>
  );
}