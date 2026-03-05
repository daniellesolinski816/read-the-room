import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Flame, Trophy } from 'lucide-react';
import { format, subDays, startOfDay, isSameDay } from 'date-fns';

export default function StreakCalendar({ profile, sessions }) {
  // Build a set of dates where the user played
  const activeDates = useMemo(() => {
    const dates = new Set();
    (sessions || []).forEach(s => {
      if (s.created_date) {
        dates.add(format(new Date(s.created_date), 'yyyy-MM-dd'));
      }
    });
    return dates;
  }, [sessions]);

  // Generate last 35 days (5 weeks)
  const days = useMemo(() => {
    const result = [];
    for (let i = 34; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const key = format(date, 'yyyy-MM-dd');
      result.push({ date, key, active: activeDates.has(key) });
    }
    return result;
  }, [activeDates]);

  const currentStreak = profile?.current_streak || 0;
  const longestStreak = profile?.longest_streak || 0;

  const weeks = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#252542] rounded-2xl p-5 border border-[#2F2F4A]"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-serif text-lg text-[#E8E4DA]">Practice Streak</h3>
        <div className="flex items-center gap-1 text-orange-400">
          <Flame className="w-4 h-4" fill="currentColor" />
          <span className="font-semibold text-sm">{currentStreak} days</span>
        </div>
      </div>

      {/* Streak stats */}
      <div className="flex gap-3 mb-5">
        <div className="flex-1 bg-[#1A1A2E] rounded-xl p-3 text-center">
          <p className="text-xs text-[#6B6B8D] mb-1">Current Streak</p>
          <div className="flex items-center justify-center gap-1">
            <Flame className="w-4 h-4 text-orange-400" fill="currentColor" />
            <span className="text-xl font-bold text-orange-300">{currentStreak}</span>
          </div>
        </div>
        <div className="flex-1 bg-[#1A1A2E] rounded-xl p-3 text-center">
          <p className="text-xs text-[#6B6B8D] mb-1">Longest Streak</p>
          <div className="flex items-center justify-center gap-1">
            <Trophy className="w-4 h-4 text-[#C9943A]" />
            <span className="text-xl font-bold text-[#C9943A]">{longestStreak}</span>
          </div>
        </div>
        <div className="flex-1 bg-[#1A1A2E] rounded-xl p-3 text-center">
          <p className="text-xs text-[#6B6B8D] mb-1">This Month</p>
          <span className="text-xl font-bold text-[#C5C1B8]">
            {days.filter(d => d.active).length}
          </span>
        </div>
      </div>

      {/* Day labels */}
      <div className="grid grid-cols-7 mb-1">
        {DAY_LABELS.map(d => (
          <div key={d} className="text-center text-[10px] text-[#6B6B8D]">{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="space-y-1">
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 gap-1">
            {week.map(({ date, key, active }) => {
              const isToday = isSameDay(date, new Date());
              return (
                <div
                  key={key}
                  title={format(date, 'MMM d')}
                  className={`
                    aspect-square rounded-md flex items-center justify-center text-[10px] transition-all
                    ${active
                      ? 'bg-orange-500/80 text-white'
                      : isToday
                      ? 'border border-[#C9943A]/50 text-[#6B6B8D]'
                      : 'bg-[#1A1A2E] text-[#3A3A5A]'
                    }
                  `}
                >
                  {format(date, 'd')}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <p className="text-center text-[10px] text-[#6B6B8D] mt-3">
        Last 35 days · {activeDates.size} total active days
      </p>
    </motion.div>
  );
}