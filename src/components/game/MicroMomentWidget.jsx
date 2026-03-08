import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { createPageUrl } from '@/utils';
import { CheckCircle, Flame, Zap } from 'lucide-react';

export default function MicroMomentWidget({ profile }) {
  if (!profile) return null;

  const today = new Date().toISOString().split('T')[0];
  const doneToday = profile.last_micro_date === today;
  const streak = profile.micro_streak || 0;

  return (
    <motion.div
      className="w-full max-w-sm mb-4"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <Link to={createPageUrl('MicroMoment')}>
        <div className={`rounded-xl border p-4 flex items-center gap-4 transition-all cursor-pointer ${
          doneToday
            ? 'bg-[#4CAF82]/10 border-[#4CAF82]/40 hover:border-[#4CAF82]/60'
            : 'bg-[#C9943A]/10 border-[#C9943A]/40 hover:border-[#C9943A]/70 hover:bg-[#C9943A]/15'
        }`}>
          {/* Icon */}
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${doneToday ? 'bg-[#4CAF82]/20' : 'bg-[#C9943A]/20'}`}>
            {doneToday
              ? <CheckCircle className="w-5 h-5 text-[#4CAF82]" />
              : <Zap className="w-5 h-5 text-[#C9943A]" />
            }
          </div>

          {/* Text */}
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-medium ${doneToday ? 'text-[#4CAF82]' : 'text-[#C9943A]'}`}>
              {doneToday ? '✓ Micro-Moment done!' : '30-sec Empathy Check-in'}
            </p>
            <p className="text-xs text-[#6B6B8D]">
              {doneToday ? 'See you tomorrow.' : "Today's micro-moment is waiting"}
            </p>
          </div>

          {/* Streak */}
          {streak > 0 && (
            <div className="flex items-center gap-1 flex-shrink-0">
              <Flame className={`w-4 h-4 ${doneToday ? 'text-[#4CAF82]' : 'text-[#C9943A]'}`} />
              <span className={`text-sm font-bold ${doneToday ? 'text-[#4CAF82]' : 'text-[#C9943A]'}`}>{streak}</span>
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  );
}