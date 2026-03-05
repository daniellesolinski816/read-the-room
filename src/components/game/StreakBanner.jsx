import React from 'react';
import { motion } from 'framer-motion';
import { Flame } from 'lucide-react';

export default function StreakBanner({ streak }) {
  if (!streak || streak < 1) return null;

  const getMessage = (s) => {
    if (s >= 30) return 'Legendary streak!';
    if (s >= 14) return 'On fire! Keep it up!';
    if (s >= 7) return 'One week strong!';
    if (s >= 3) return 'Building momentum!';
    return 'Streak active!';
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex items-center justify-center gap-2 bg-orange-900/30 border border-orange-600/30 rounded-full px-4 py-1.5 mb-4"
    >
      <Flame className="w-4 h-4 text-orange-400" fill="currentColor" />
      <span className="text-sm font-semibold text-orange-300">{streak} day streak</span>
      <span className="text-xs text-orange-400/70">· {getMessage(streak)}</span>
    </motion.div>
  );
}