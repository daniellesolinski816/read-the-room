import React from 'react';
import { motion } from 'framer-motion';
import { Flame, Trophy, Star, Lock, ChevronRight, CalendarDays } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';

const categoryColors = {
  Family: 'text-rose-300',
  Community: 'text-emerald-300',
  Digital: 'text-blue-300',
  Civic: 'text-purple-300',
  Workplace: 'text-amber-300',
  Personal: 'text-pink-300',
  Reflection: 'text-cyan-300'
};

export default function DailyChallengeCard({ scenario, profile, todayLeaders, alreadyPlayed }) {
  if (!scenario) return null;

  const truncated = scenario.prompt.length > 110
    ? scenario.prompt.substring(0, 110) + '…'
    : scenario.prompt;

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="w-full"
    >
      {/* Header label */}
      <div className="flex items-center justify-between mb-2 px-1">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-[#C9943A]" />
          <span className="text-xs font-medium text-[#C9943A] tracking-wide uppercase">Daily Challenge</span>
        </div>
        <span className="text-xs text-[#6B6B8D]">{today}</span>
      </div>

      {/* Main card */}
      <div className="bg-gradient-to-br from-[#252542] to-[#1e1e38] rounded-2xl border border-[#C9943A]/30 overflow-hidden shadow-lg">
        {/* Scenario preview */}
        <div className="p-5">
          <h4 className={`font-serif text-lg mb-2 ${categoryColors[scenario.category] || 'text-[#E8E4DA]'}`}>
            {scenario.title}
          </h4>
          <p className="text-sm text-[#C5C1B8] leading-relaxed mb-4">{truncated}</p>

          {alreadyPlayed ? (
            <div className="flex items-center gap-2 bg-green-900/30 border border-green-700/40 rounded-lg px-3 py-2 mb-4">
              <Star className="w-4 h-4 text-green-400" fill="currentColor" />
              <span className="text-sm text-green-300 font-medium">You played today's challenge!</span>
            </div>
          ) : null}

          <Link to={createPageUrl('DailyChallenge') + `?scenarioId=${scenario.id}`}>
            <Button
              className={`w-full h-11 font-serif font-semibold text-base rounded-xl transition-all ${
                alreadyPlayed
                  ? 'bg-[#C9943A]/20 border border-[#C9943A]/40 text-[#C9943A] hover:bg-[#C9943A]/30'
                  : 'bg-[#C9943A] hover:bg-[#D4A94D] text-[#1A1A2E]'
              }`}
            >
              {alreadyPlayed ? 'Play Again' : 'Accept the Challenge'}
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>

        {/* Today's leaderboard */}
        {todayLeaders && todayLeaders.length > 0 && (
          <div className="border-t border-[#2F2F4A] px-5 py-4">
            <div className="flex items-center gap-2 mb-3">
              <Trophy className="w-4 h-4 text-[#C9943A]" />
              <span className="text-xs text-[#C9943A] font-medium tracking-wide uppercase">Today's Top Scores</span>
            </div>
            <div className="space-y-2">
              {todayLeaders.slice(0, 3).map((entry, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold w-5 ${i === 0 ? 'text-yellow-400' : i === 1 ? 'text-slate-300' : 'text-amber-600'}`}>
                      {i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}
                    </span>
                    <span className="text-sm text-[#C5C1B8] truncate max-w-[140px]">{entry.display_name || 'Anonymous'}</span>
                  </div>
                  <span className="text-sm font-semibold text-[#C9943A]">{entry.total_score}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}