import React from 'react';
import { BADGES } from './badges';
import { motion } from 'framer-motion';

export default function BadgeGrid({ earnedBadgeIds = [], showAll = true }) {
  const displayBadges = showAll ? BADGES : BADGES.filter(b => earnedBadgeIds.includes(b.id));

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
      {displayBadges.map((badge, i) => {
        const earned = earnedBadgeIds.includes(badge.id);
        return (
          <motion.div
            key={badge.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.04 }}
            className={`relative flex flex-col items-center gap-1 p-3 rounded-xl border text-center transition-all ${
              earned
                ? 'border-[#C9943A]/50 bg-[#C9943A]/10'
                : 'border-[#2F2F4A] bg-[#252542] opacity-40'
            }`}
          >
            <span className="text-2xl">{badge.emoji}</span>
            <p className={`text-xs font-medium leading-tight ${earned ? 'text-[#E8E4DA]' : 'text-[#6B6B8D]'}`}>
              {badge.label}
            </p>
            <p className="text-[10px] text-[#6B6B8D] leading-tight hidden sm:block">{badge.description}</p>
            {earned && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#C9943A]" />
            )}
          </motion.div>
        );
      })}
    </div>
  );
}