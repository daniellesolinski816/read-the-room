import React from 'react';
import { motion } from 'framer-motion';

export default function DecisionStep({ onDecision }) {
  const options = [
    {
      key: 'engage',
      label: 'Engage',
      subtitle: 'Stay in the conversation',
      style: 'bg-[#C9943A] hover:bg-[#D4A94D] text-[#1A1A2E]',
    },
    {
      key: 'pause',
      label: 'Pause',
      subtitle: 'Step back intentionally',
      style: 'bg-transparent border border-[#C9943A] text-[#C9943A] hover:bg-[#C9943A]/10',
    },
    {
      key: 'pass',
      label: 'Pass',
      subtitle: "This one isn't worth it today",
      style: 'bg-transparent text-[#6B6B8D] hover:text-[#C5C1B8] hover:bg-[#252542]',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3"
    >
      <div className="text-center mb-6">
        <h2 className="font-serif text-2xl text-[#E8E4DA]">How do you want to handle this?</h2>
      </div>
      {options.map((opt) => (
        <button
          key={opt.key}
          onClick={() => onDecision(opt.key)}
          className={`w-full rounded-xl px-6 py-4 flex flex-col items-center gap-0.5 transition-all ${opt.style}`}
        >
          <span className="font-serif text-lg font-semibold">{opt.label}</span>
          <span className="text-xs opacity-75">{opt.subtitle}</span>
        </button>
      ))}
    </motion.div>
  );
}