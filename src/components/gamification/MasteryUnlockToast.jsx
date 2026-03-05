import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function MasteryUnlockToast({ masteries, onDone }) {
  useEffect(() => {
    if (!masteries?.length) return;
    const t = setTimeout(onDone, 4500);
    return () => clearTimeout(t);
  }, [masteries, onDone]);

  if (!masteries?.length) return null;

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2 pointer-events-none">
      <AnimatePresence>
        {masteries.map((m, i) => (
          <motion.div
            key={`${m.marker.key}-${m.tier}`}
            initial={{ opacity: 0, y: -20, scale: 0.85 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.9 }}
            transition={{ delay: i * 0.25 }}
            className={`flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl border ${m.tierConfig.bg} ${m.tierConfig.border} backdrop-blur`}
          >
            <span className="text-2xl">{m.marker.icon}</span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: m.tierConfig.color }}>
                {m.tierConfig.name} Unlocked
              </p>
              <p className="text-sm font-bold text-[#E8E4DA]">{m.title}</p>
              <p className="text-xs text-[#6B6B8D]">{m.marker.label}</p>
            </div>
            <span className="text-xl ml-1">🏅</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}