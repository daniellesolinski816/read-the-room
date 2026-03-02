import React from 'react';
import { motion } from 'framer-motion';
import Logo from '../brand/Logo';

const categoryLabels = {
  Family: '👨‍👩‍👧‍👦',
  Community: '🏘️',
  Digital: '💬',
  Civic: '🏛️',
  Workplace: '💼',
  Personal: '❤️',
  Reflection: '🪞'
};

export default function ScoreCard({ profile, compact = false }) {
  if (!profile) return null;
  
  const strongestMarker = ['acknowledgment', 'curiosity', 'nonjudgment', 'door_open']
    .reduce((a, b) => (profile[`avg_${a}`] || 0) > (profile[`avg_${b}`] || 0) ? a : b);
  
  const markerLabels = {
    acknowledgment: 'Acknowledgment',
    curiosity: 'Curiosity',
    nonjudgment: 'Non-judgment',
    door_open: 'Keeping Doors Open'
  };

  if (compact) {
    return (
      <div className="bg-[#252542] rounded-lg px-4 py-3 border border-[#2F2F4A] flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#C9943A] to-[#A67B2E] flex items-center justify-center">
          <span className="text-lg font-serif font-bold text-[#1A1A2E]">
            {Math.round(profile.average_score || 0)}
          </span>
        </div>
        <div className="text-sm">
          <span className="text-[#C5C1B8]">Empathy Score</span>
          <span className="text-[#6B6B8D] ml-2">•</span>
          <span className="text-[#C9943A] ml-2">{profile.current_streak || 0} day streak</span>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      className="bg-gradient-to-br from-[#252542] to-[#1A1A2E] rounded-2xl p-6 border border-[#C9943A]/30 gold-glow"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
    >
      <div className="text-center mb-6">
        <Logo size="small" />
        <h3 className="font-serif text-xl text-[#E8E4DA] mt-2">Your Empathy Profile</h3>
      </div>
      
      <div className="flex justify-center mb-6">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#C9943A] to-[#A67B2E] flex items-center justify-center">
          <span className="text-3xl font-serif font-bold text-[#1A1A2E]">
            {Math.round(profile.average_score || 0)}
          </span>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="text-center">
          <span className="text-2xl font-serif font-bold text-[#E8E4DA]">{profile.total_sessions || 0}</span>
          <p className="text-xs text-[#6B6B8D]">Sessions</p>
        </div>
        <div className="text-center">
          <span className="text-2xl font-serif font-bold text-[#C9943A]">{profile.current_streak || 0}</span>
          <p className="text-xs text-[#6B6B8D]">Day Streak</p>
        </div>
      </div>
      
      {profile.scores_by_category && Object.keys(profile.scores_by_category).length > 0 && (
        <div className="border-t border-[#2F2F4A] pt-4 mb-4">
          <p className="text-xs text-[#6B6B8D] mb-3 text-center">By Category</p>
          <div className="flex justify-center gap-3 flex-wrap">
            {Object.entries(profile.scores_by_category).map(([cat, score]) => (
              <div key={cat} className="text-center">
                <span className="text-lg">{categoryLabels[cat]}</span>
                <p className="text-sm font-medium text-[#E8E4DA]">{Math.round(score)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div className="text-center text-sm">
        <p className="text-[#6B6B8D]">Your strength:</p>
        <p className="text-[#C9943A] font-medium">{markerLabels[strongestMarker]}</p>
      </div>
    </motion.div>
  );
}