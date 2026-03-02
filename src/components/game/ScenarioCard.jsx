import React from 'react';
import { motion } from 'framer-motion';

const categoryColors = {
  Family: 'bg-rose-900/30 text-rose-300',
  Community: 'bg-emerald-900/30 text-emerald-300',
  Digital: 'bg-blue-900/30 text-blue-300',
  Civic: 'bg-purple-900/30 text-purple-300',
  Workplace: 'bg-amber-900/30 text-amber-300',
  Personal: 'bg-pink-900/30 text-pink-300',
  Reflection: 'bg-cyan-900/30 text-cyan-300'
};

export default function ScenarioCard({ scenario, showFull = true }) {
  return (
    <motion.div 
      className="bg-[#252542] rounded-xl p-6 md:p-8 border border-[#2F2F4A] gold-glow card-reveal"
      initial={{ opacity: 0, rotateY: 90 }}
      animate={{ opacity: 1, rotateY: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <div className="flex items-center justify-between mb-4">
        <span className={`px-3 py-1 rounded-full text-xs font-medium tracking-wide ${categoryColors[scenario.category] || 'bg-[#2F2F4A] text-[#C5C1B8]'}`}>
          {scenario.category}
        </span>
        <span className="text-[#C9943A] font-serif text-sm italic">
          {scenario.title}
        </span>
      </div>
      
      <div className="border-t border-[#2F2F4A] pt-5">
        <p className="text-[#E8E4DA] text-lg md:text-xl leading-relaxed font-serif">
          {scenario.prompt}
        </p>
      </div>
    </motion.div>
  );
}