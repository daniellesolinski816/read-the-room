import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star } from 'lucide-react';

export default function PointsToast({ points, newBadges = [], onDone }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => { setVisible(false); setTimeout(onDone, 400); }, 2800);
    return () => clearTimeout(t);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2"
        >
          <div className="bg-[#C9943A] text-[#1A1A2E] px-5 py-3 rounded-full shadow-xl flex items-center gap-2 font-semibold">
            <Star className="w-4 h-4 fill-current" />
            +{points} points
          </div>
          {newBadges.map(b => (
            <div key={b.id} className="bg-[#252542] border border-[#C9943A]/40 text-[#E8E4DA] px-4 py-2 rounded-full text-sm flex items-center gap-2">
              <span>{b.emoji}</span> Badge unlocked: <span className="text-[#C9943A]">{b.label}</span>
            </div>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}