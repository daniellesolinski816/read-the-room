import React from 'react';
import { motion } from 'framer-motion';
import { MASTERY_MARKERS, MASTERY_TIERS, getMasteryTier, getTierConfig } from './masteryLevels';

function MasteryCard({ marker, avgScore }) {
  const currentTier = getMasteryTier(avgScore);
  const nextTier = currentTier < 4 ? MASTERY_TIERS.find(t => t.tier === currentTier + 1) : null;
  const currentConfig = getTierConfig(currentTier);

  // Progress within the current tier toward next
  const prevThreshold = currentTier > 0 ? MASTERY_TIERS.find(t => t.tier === currentTier)?.threshold || 0 : 0;
  const nextThreshold = nextTier?.threshold || 25;
  const progress = nextTier
    ? Math.min(100, ((avgScore - prevThreshold) / (nextThreshold - prevThreshold)) * 100)
    : 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl p-4 border ${currentConfig ? currentConfig.bg + ' ' + currentConfig.border : 'bg-[#252542] border-[#2F2F4A]'}`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">{marker.icon}</span>
          <span className="text-sm font-medium text-[#E8E4DA]">{marker.label}</span>
        </div>
        {currentTier > 0 && currentConfig ? (
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: currentConfig.color + '22', color: currentConfig.color }}>
            {currentConfig.name}
          </span>
        ) : (
          <span className="text-xs text-[#6B6B8D]">Unranked</span>
        )}
      </div>

      {currentTier > 0 && (
        <p className="text-xs font-bold mb-2" style={{ color: marker.color }}>
          {marker.titles[currentTier]}
        </p>
      )}

      {/* Tier pips */}
      <div className="flex gap-1.5 mb-3">
        {MASTERY_TIERS.map(t => (
          <div
            key={t.tier}
            className="flex-1 h-1.5 rounded-full transition-all"
            style={{
              background: t.tier <= currentTier ? marker.color : '#2F2F4A',
              opacity: t.tier <= currentTier ? 1 : 0.4,
            }}
          />
        ))}
      </div>

      {/* Progress to next */}
      <div className="flex justify-between text-xs mb-1">
        <span className="text-[#6B6B8D]">Avg: {Math.round(avgScore * 10) / 10} / 25</span>
        {nextTier ? (
          <span className="text-[#6B6B8D]">Next: {nextTier.name} @ {nextTier.threshold}</span>
        ) : (
          <span style={{ color: marker.color }} className="font-semibold">Mastered ✓</span>
        )}
      </div>
      <div className="h-1.5 bg-[#1A1A2E] rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: marker.color }}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
    </motion.div>
  );
}

export default function MasteryPanel({ profile }) {
  if (!profile) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-1">
        <h3 className="font-serif text-lg text-[#E8E4DA]">Mastery Levels</h3>
        <span className="text-xs text-[#6B6B8D]">Avg 15→18→21→23</span>
      </div>
      {MASTERY_MARKERS.map(marker => (
        <MasteryCard
          key={marker.key}
          marker={marker}
          avgScore={profile[marker.key] || 0}
        />
      ))}

      {/* Tier legend */}
      <div className="flex gap-2 flex-wrap pt-1">
        {MASTERY_TIERS.map(t => (
          <div key={t.tier} className="flex items-center gap-1 text-xs">
            <div className="w-2 h-2 rounded-full" style={{ background: t.color }} />
            <span style={{ color: t.color }}>{t.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}