import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, Trophy, Loader2, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Logo from '@/components/brand/Logo';
import PremiumBadge from '@/components/brand/PremiumBadge';

export default function Leaderboard() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.auth.me().then(async (u) => {
      setUser(u);
      const myProfiles = await base44.entities.UserProfile.filter({ user_id: u.email });
      setProfile(myProfiles[0] || null);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!profile?.is_premium) { setLoading(false); return; }
    base44.entities.UserProfile.list('-average_score', 20).then(data => {
      setProfiles(data.filter(p => (p.total_sessions || 0) >= 3));
      setLoading(false);
    });
  }, [profile]);

  const isPremium = profile?.is_premium;

  if (!isPremium) {
    return (
      <div className="min-h-screen bg-[#1A1A2E]">
        <header className="p-4 flex items-center justify-between border-b border-[#2F2F4A]">
          <Link to={createPageUrl('Home')}>
            <Button variant="ghost" size="icon" className="text-[#C5C1B8] hover:text-[#C9943A]">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <Logo size="small" />
          <div className="w-10" />
        </header>
        <main className="max-w-md mx-auto px-4 py-20 text-center">
          <div className="w-14 h-14 rounded-full bg-[#C9943A]/10 flex items-center justify-center mx-auto mb-5">
            <Lock className="w-7 h-7 text-[#C9943A]/50" />
          </div>
          <h2 className="font-serif text-2xl text-[#E8E4DA] mb-3">Leaderboard</h2>
          <p className="text-[#C5C1B8] text-sm mb-6 leading-relaxed">See how your empathy score compares to other players worldwide.</p>
          <Link to={createPageUrl('Premium')}>
            <Button className="bg-[#C9943A] hover:bg-[#D4A94D] text-[#1A1A2E] font-semibold px-8 h-12">Unlock with Premium</Button>
          </Link>
        </main>
      </div>
    );
  }

  const myRank = profiles.findIndex(p => p.user_id === user?.email) + 1;

  return (
    <div className="min-h-screen bg-[#1A1A2E]">
      <header className="p-4 flex items-center justify-between border-b border-[#2F2F4A]">
        <Link to={createPageUrl('Home')}>
          <Button variant="ghost" size="icon" className="text-[#C5C1B8] hover:text-[#C9943A]">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <Logo size="small" />
        <PremiumBadge compact />
      </header>

      <main className="max-w-md mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <Trophy className="w-8 h-8 text-[#C9943A] mx-auto mb-2" />
          <h1 className="font-serif text-2xl text-[#E8E4DA]">Leaderboard</h1>
          <p className="text-[#6B6B8D] text-sm mt-1">Top empathy scores · 3+ sessions required</p>
        </motion.div>

        {myRank > 0 && (
          <div className="bg-[#C9943A]/10 border border-[#C9943A]/30 rounded-xl p-4 mb-6 flex items-center justify-between">
            <span className="text-[#C9943A] text-sm">Your rank</span>
            <span className="font-serif text-xl text-[#C9943A] font-semibold">#{myRank}</span>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 text-[#C9943A] animate-spin" />
          </div>
        ) : (
          <div className="space-y-2">
            {profiles.map((p, i) => {
              const isMe = p.user_id === user?.email;
              const medals = ['🥇', '🥈', '🥉'];
              return (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`flex items-center gap-4 p-4 rounded-xl border ${isMe ? 'bg-[#C9943A]/10 border-[#C9943A]/40' : 'bg-[#252542] border-[#2F2F4A]'}`}
                >
                  <span className="text-lg w-7 text-center">{medals[i] || `${i + 1}`}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium text-sm truncate ${isMe ? 'text-[#C9943A]' : 'text-[#E8E4DA]'}`}>
                      {p.display_name || 'Anonymous'} {isMe && '(you)'}
                    </p>
                    <p className="text-xs text-[#6B6B8D]">{p.total_sessions} sessions</p>
                  </div>
                  <span className="font-serif text-lg font-semibold text-[#E8E4DA]">{Math.round(p.average_score || 0)}</span>
                </motion.div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}