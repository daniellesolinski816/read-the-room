import React from 'react';
import { motion } from 'framer-motion';

const markers = [
  { key: 'acknowledgment', label: 'Acknowledgment', description: 'Recognized their position' },
  { key: 'curiosity', label: 'Curiosity', description: 'Showed genuine interest' },
  { key: 'nonjudgment', label: 'Non-judgment', description: 'Avoided verdicts' },
  { key: 'door_open', label: 'Door Open', description: 'Invited continued conversation' }
];

export default function EmpathyScore({ scores, showTotal = true, size = 'default' }) {
  const total = scores.acknowledgment + scores.curiosity + scores.nonjudgment + scores.door_open;
  
  return (
    <div className="space-y-4">
      {showTotal && (
        <motion.div 
          className="text-center mb-6"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, type: 'spring' }}
        >
          <span className="text-6xl md:text-7xl font-serif font-bold text-[#C9943A] score-reveal">
            {total}
          </span>
          <span className="text-2xl text-[#6B6B8D] font-serif">/100</span>
        </motion.div>
      )}
      
      <div className="grid grid-cols-2 gap-3">
        {markers.map((marker, index) => (
          <motion.div
            key={marker.key}
            className="bg-[#252542] rounded-lg p-4 border border-[#2F2F4A]"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 + 0.3 }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-[#C5C1B8] font-medium">{marker.label}</span>
              <span className="text-lg font-serif font-semibold text-[#E8E4DA]">
                {scores[marker.key]}<span className="text-[#6B6B8D] text-sm">/25</span>
              </span>
            </div>
            <div className="h-2 bg-[#1A1A2E] rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-gradient-to-r from-[#C9943A] to-[#D4A94D] rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${(scores[marker.key] / 25) * 100}%` }}
                transition={{ delay: index * 0.1 + 0.5, duration: 0.6 }}
              />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}