import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const categoryColors = {
  Family: 'text-rose-300',
  Community: 'text-emerald-300',
  Digital: 'text-blue-300',
  Civic: 'text-purple-300',
  Workplace: 'text-amber-300',
  Personal: 'text-pink-300',
  Reflection: 'text-cyan-300'
};

export default function DailyScenarioTeaser({ scenario }) {
  if (!scenario) return null;
  
  const truncatedPrompt = scenario.prompt.length > 100 
    ? scenario.prompt.substring(0, 100) + '...'
    : scenario.prompt;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
    >
      <Link to={createPageUrl('Solo') + `?scenarioId=${scenario.id}`}>
        <div className="bg-[#252542] rounded-xl p-5 border border-[#2F2F4A] hover:border-[#C9943A]/50 transition-all cursor-pointer group">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-[#C9943A]" />
            <span className="text-sm font-medium text-[#C9943A]">Scenario of the Day</span>
          </div>
          
          <h4 className={`font-serif text-lg mb-2 ${categoryColors[scenario.category]} group-hover:text-[#E8E4DA] transition-colors`}>
            {scenario.title}
          </h4>
          
          <p className="text-sm text-[#6B6B8D] leading-relaxed">
            {truncatedPrompt}
          </p>
          
          <div className="mt-4 text-xs text-[#C9943A] group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
            Play now →
          </div>
        </div>
      </Link>
    </motion.div>
  );
}