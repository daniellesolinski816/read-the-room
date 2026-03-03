import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, Trophy, Users, User, Star, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Logo from '@/components/brand/Logo';
import { useQuery } from '@tanstack/react-query';

const TABS = [
  { id: 'solo', label: 'Solo', icon: User },
  { id: 'multiplayer', label: 'Multiplayer', icon: Users },
  { id: 'points', label: 'All-Time Points', icon: Star },
];

const MEDAL = ['🥇', '🥈', '🥉'];

export default function Leaderboard() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [tab, setTab] = useState('solo');

  useEffect(() => {
    base44.auth.me().then(async (u) => {
      setUser(u);
      const p = await base44.entities.UserProfile.filter({ user_id: u.email });
      setProfile(p[0] || null);
    }).catch(() => {});
  }, []);

  const { data: allProfiles = [], isLoading } = useQuery({
    queryKey: ['leaderboardProfiles'],
    queryFn: () => base44.entities.UserProfile.list('-total_points', 50),
    enabled: !!profile?.is_premium,
  });

  const ranked = (() => {
    if (tab === 'solo') {
      return [...allProfiles]
        .filter(p => (p.total_sessions || 0) >= 3)
        .sort((a, b) => (b.average_score || 0) - (a.average_score || 0));
    }
    if (tab === 'multiplayer') {
      return [...allProfiles]
        .filter(p => (p.multiplayer_sessions || 0) >= 1)
        .sort((a, b) => (b.multiplayer_avg_score || 0) - (a.multiplayer_avg_score || 0));
    }
    return [...allProfiles]
      .filter(p => (p.total_points || 0) > 0)
      .sort((a, b) => (b.total_points || 0) - (a.total_points || 0));
  })();

  const myRank = ranked.findIndex(p => p.user_id === user?.email) + 1;

  if (!profile?.is_premium) {
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
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
          <Lock className="w-10 h-10 text-[#6B6B8D] mb-4" />
          <h2 className="font-serif text-2xl text-[#E8E4DA] mb-2">Premium Feature</h2>
          <p className="text-[#6B6B8D] mb-6">Unlock leaderboards and compete with other players</p>
          <Link to={createPageUrl('Premium')}>
            <Button className="bg-[#C9943A] hover:bg-[#D4A94D] text-[#1A1A2E]">Unlock Premium</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1A1A2E]">
      <header className="p-4 flex items-center justify-between border-b border-[#2F2F4A]">
        <Link to={createPageUrl('Home')}>
          <Button variant="ghost" size="icon" className="text-[#C5C1B8] hover:text-[#C9943A]">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <Logo size="small" />
        <Trophy className="w-5 h-5 text-[#C9943A]" />
      </header>

      <main className="max-w-lg mx-auto px-4 py-6">
        <h1 className="font-serif text-3xl text-[#E8E4DA] text-center mb-6">Leaderboard</h1>

        {/* Tabs */}
        <div className="flex gap-1 bg-[#252542] rounded-xl p-1 mb-6">
          {TABS.map(t => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-medium transition-all ${
                  tab === t.id ? 'bg-[#C9943A] text-[#1A1A2E]' : 'text-[#6B6B8D] hover:text-[#C5C1B8]'
                }`}
              >
                <Icon className="w-3 h-3" />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* My rank */}
        {myRank > 0 && (
          <div className="bg-[#C9943A]/10 border border-[#C9943A]/30 rounded-xl p-3 mb-4 flex items-center justify-between">
            <span className="text-sm text-[#C5C1B8]">Your rank</span>
            <span className="font-serif text-lg text-[#C9943A] font-bold">#{myRank}</span>
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-12 text-[#6B6B8D]">Loading…</div>
        ) : ranked.length === 0 ? (
          <div className="text-center py-12 text-[#6B6B8D]">
            {tab === 'multiplayer' ? 'No multiplayer games yet' : 'Not enough data yet'}
          </div>
        ) : (
          <div className="space-y-2">
            {ranked.slice(0, 20).map((p, i) => {
              const isMe = p.user_id === user?.email;
              const score = tab === 'solo' ? p.average_score
                : tab === 'multiplayer' ? p.multiplayer_avg_score
                : p.total_points;
              return (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className={`flex items-center gap-3 p-3 rounded-xl border ${
                    isMe ? 'border-[#C9943A]/40 bg-[#C9943A]/5' : 'border-[#2F2F4A] bg-[#252542]'
                  }`}
                >
                  <span className="text-lg w-7 text-center">{MEDAL[i] || `${i + 1}`}</span>
                  <span className="text-xl">{p.avatar_emoji || '🧠'}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${isMe ? 'text-[#C9943A]' : 'text-[#E8E4DA]'}`}>
                      {p.display_name || 'Anonymous'}{isMe ? ' (You)' : ''}
                    </p>
                    <p className="text-xs text-[#6B6B8D]">
                      {tab === 'multiplayer' ? `${p.multiplayer_sessions || 0} games` : `${p.total_sessions || 0} sessions`}
                      {(p.earned_badges?.length > 0) && ` · ${p.earned_badges.length} badges`}
                    </p>
                  </div>
                  <span className="font-serif font-bold text-[#C9943A]">
                    {tab === 'points' ? `${Math.round(score || 0)}` : `${Math.round(score || 0)}`}
                    <span className="text-xs text-[#6B6B8D] ml-0.5">
                      {tab === 'points' ? 'pts' : '/100'}
                    </span>
                  </span>
                </motion.div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}