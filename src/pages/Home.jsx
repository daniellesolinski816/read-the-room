import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { User, Users, Settings, HelpCircle, Target, Trophy, BookOpen, BarChart2, FlaskConical, Sparkles, ArrowRight, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Logo from '@/components/brand/Logo';
import GameTitle from '@/components/brand/GameTitle';
import ScoreCard from '@/components/game/ScoreCard';
import { MASTERY_MARKERS, getMasteryTier, MASTERY_TIERS } from '@/components/gamification/masteryLevels';
import DailyChallengeCard from '@/components/game/DailyChallengeCard';
import StreakBanner from '@/components/game/StreakBanner';
import HowToPlay from '@/components/game/HowToPlay';
import OnboardingTour from '@/components/game/OnboardingTour';
import { AnimatePresence } from 'framer-motion';

export default function Home() {
  const [user, setUser] = useState(null);
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [showTour, setShowTour] = useState(false);
  
  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
    const params = new URLSearchParams(window.location.search);
    if (!localStorage.getItem('empathy_onboarding_done') || params.get('tour') === '1') {
      setShowTour(true);
    }
  }, []);

  const { data: profile } = useQuery({
    queryKey: ['userProfile', user?.email],
    queryFn: async () => {
      if (!user) return null;
      const profiles = await base44.entities.UserProfile.filter({ user_id: user.email });
      return profiles[0] || null;
    },
    enabled: !!user
  });

  const { data: dailyScenario } = useQuery({
    queryKey: ['dailyScenario'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const dailies = await base44.entities.Scenario.filter({ is_daily: true, daily_date: today });
      if (dailies.length > 0) return dailies[0];
      const all = await base44.entities.Scenario.list();
      return all[Math.floor(Math.random() * all.length)] || null;
    }
  });

  const { data: todayLeaders = [] } = useQuery({
    queryKey: ['todayLeaders', dailyScenario?.id],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const todayStart = new Date(today + 'T00:00:00').toISOString();
      const sessions = await base44.entities.GameSession.filter({ scenario_id: dailyScenario.id });
      const todaySessions = sessions.filter(s => s.created_date >= todayStart);
      const best = {};
      todaySessions.forEach(s => {
        if (!best[s.user_id] || s.total_score > best[s.user_id].total_score) best[s.user_id] = s;
      });
      const sorted = Object.values(best).sort((a, b) => b.total_score - a.total_score);
      const profiles = await base44.entities.UserProfile.list();
      const profileMap = {};
      profiles.forEach(p => { profileMap[p.user_id] = p.display_name || 'Anonymous'; });
      return sorted.map(s => ({ ...s, display_name: profileMap[s.user_id] || 'Anonymous' }));
    },
    enabled: !!dailyScenario?.id
  });

  const alreadyPlayedToday = useMemo(() => {
    if (!user || !dailyScenario) return false;
    const today = new Date().toISOString().split('T')[0];
    return todayLeaders.some(e => e.user_id === user.email);
  }, [todayLeaders, user, dailyScenario]);

  return (
    <div className="min-h-screen bg-[#1A1A2E] flex flex-col">
      {/* Header */}
      <header className="p-4 flex justify-between items-center">
        <Button variant="ghost" size="icon" onClick={() => setShowHowToPlay(true)} className="text-[#C5C1B8] hover:text-[#C9943A] hover:bg-[#252542]">
          <HelpCircle className="w-5 h-5" />
        </Button>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => setShowTour(true)} className="text-xs text-[#6B6B8D] hover:text-[#C9943A] hover:bg-[#252542]">
            Tutorial
          </Button>
          <Link to={createPageUrl('Profile')}>
            <Button variant="ghost" size="icon" className="text-[#C5C1B8] hover:text-[#C9943A] hover:bg-[#252542]">
              <Settings className="w-5 h-5" />
            </Button>
          </Link>
        </div>
      </header>

      <AnimatePresence>
        {showHowToPlay && <HowToPlay onClose={() => setShowHowToPlay(false)} />}
        {showTour && <OnboardingTour onDismiss={() => setShowTour(false)} />}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 pb-12">
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <Logo size="default" />
          <div className="mt-2 mb-1">
            <span className="text-xs text-[#6B6B8D] tracking-widest uppercase">presents</span>
          </div>
          <GameTitle size="large" />
          <motion.p 
            className="mt-4 text-[#C5C1B8] max-w-md mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            Practice the art of empathic communication in charged real-world moments
          </motion.p>
        </motion.div>

        {/* Streak Banner */}
        {profile?.current_streak > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}>
            <StreakBanner streak={profile.current_streak} />
          </motion.div>
        )}

        {/* Score Card */}
        {profile && (
          <motion.div 
            className="w-full max-w-sm mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <ScoreCard profile={profile} compact />
          </motion.div>
        )}

        {/* Mastery Progress Strip */}
        {profile && profile.total_sessions > 0 && (
          <motion.div
            className="w-full max-w-sm mb-6"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
          >
            <Link to={createPageUrl('Profile') + '#mastery'}>
              <div className="bg-[#252542] border border-[#2F2F4A] rounded-xl p-4 hover:border-[#C9943A]/30 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-[#6B6B8D] uppercase tracking-wider flex items-center gap-1.5"><TrendingUp className="w-3.5 h-3.5" /> Mastery Progress</span>
                  <span className="text-xs text-[#C9943A]">View all →</span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {MASTERY_MARKERS.map(marker => {
                    const score = profile[marker.key] || 0;
                    const tier = getMasteryTier(score);
                    const tierConfig = tier > 0 ? MASTERY_TIERS.find(t => t.tier === tier) : null;
                    return (
                      <div key={marker.key} className="text-center">
                        <div className="text-lg mb-0.5">{marker.icon}</div>
                        <div className="text-[10px] text-[#6B6B8D] mb-1">{marker.label.split(' ')[0]}</div>
                        {tierConfig ? (
                          <div className="text-[10px] font-semibold" style={{ color: tierConfig.color }}>{tierConfig.name}</div>
                        ) : (
                          <div className="text-[10px] text-[#2F2F4A]">—</div>
                        )}
                        <div className="h-1 bg-[#1A1A2E] rounded-full mt-1 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${Math.min(100, (score / 25) * 100)}%`,
                              background: tierConfig?.color || '#2F2F4A'
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Link>
          </motion.div>
        )}

        {/* Play Options */}
        <motion.div 
          className="w-full max-w-sm space-y-4 mb-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Link to={createPageUrl('Solo')} className="block">
            <Button className="w-full h-16 bg-[#C9943A] hover:bg-[#D4A94D] text-[#1A1A2E] text-lg font-serif font-semibold rounded-xl transition-all hover:scale-[1.02]">
              <User className="w-5 h-5 mr-3" />
              Play Solo
            </Button>
          </Link>
          
          <Link to={createPageUrl('Multiplayer')} className="block">
            <Button variant="outline" className="w-full h-16 border-[#C9943A] text-[#C9943A] hover:bg-[#C9943A]/10 text-lg font-serif font-semibold rounded-xl transition-all hover:scale-[1.02]">
              <Users className="w-5 h-5 mr-3" />
              Play with Others
            </Button>
          </Link>

          <div className="grid grid-cols-5 gap-2">
            <Link to={createPageUrl('Practice')} className="block">
              <Button variant="ghost" className="w-full h-12 border border-[#2F2F4A] text-[#C5C1B8] hover:bg-[#252542] hover:text-[#C9943A] text-xs font-medium rounded-xl flex-col gap-0.5">
                <Target className="w-4 h-4" />
                Practice
              </Button>
            </Link>
            <Link to={createPageUrl('Community')} className="block">
              <Button variant="ghost" className="w-full h-12 border border-[#2F2F4A] text-[#C5C1B8] hover:bg-[#252542] hover:text-[#C9943A] text-xs font-medium rounded-xl flex-col gap-0.5">
                <BookOpen className="w-4 h-4" />
                Community
              </Button>
            </Link>
            <Link to={createPageUrl('Leaderboard')} className="block">
              <Button variant="ghost" className="w-full h-12 border border-[#2F2F4A] text-[#C5C1B8] hover:bg-[#252542] hover:text-[#C9943A] text-xs font-medium rounded-xl flex-col gap-0.5">
                <Trophy className="w-4 h-4" />
                Leaders
              </Button>
            </Link>
            <Link to={createPageUrl('Analytics')} className="block">
              <Button variant="ghost" className="w-full h-12 border border-[#2F2F4A] text-[#C5C1B8] hover:bg-[#252542] hover:text-[#C9943A] text-xs font-medium rounded-xl flex-col gap-0.5">
                <BarChart2 className="w-4 h-4" />
                Analytics
              </Button>
            </Link>
            <Link to={createPageUrl('Science')} className="block">
              <Button variant="ghost" className="w-full h-12 border border-[#2F2F4A] text-[#C5C1B8] hover:bg-[#252542] hover:text-[#C9943A] text-xs font-medium rounded-xl flex-col gap-0.5">
                <FlaskConical className="w-4 h-4" />
                Science
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Upgrade to Premium Banner (non-premium users only) */}
        {profile && !profile.is_premium && (
          <motion.div
            className="w-full max-w-sm mb-6"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Link to={createPageUrl('Premium')}>
              <div className="flex items-center gap-3 bg-[#C9943A]/10 border border-[#C9943A]/30 rounded-xl p-4 hover:bg-[#C9943A]/15 transition-colors cursor-pointer">
                <Sparkles className="w-5 h-5 text-[#C9943A] flex-shrink-0" />
                <div>
                  <p className="text-[#C9943A] text-sm font-medium">Upgrade to Premium</p>
                  <p className="text-[#6B6B8D] text-xs">Unlock AI scenarios, custom timers, deep analytics & more</p>
                </div>
                <ArrowRight className="w-4 h-4 text-[#C9943A] ml-auto flex-shrink-0" />
              </div>
            </Link>
          </motion.div>
        )}

        {/* Daily Challenge Card */}
        <div className="w-full max-w-sm">
          <DailyChallengeCard
            scenario={dailyScenario}
            profile={profile}
            todayLeaders={todayLeaders}
            alreadyPlayed={alreadyPlayedToday}
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center">
        <p className="text-xs text-[#6B6B8D]">
          © The Empathy Enigma • Learning to listen, one moment at a time
        </p>
      </footer>
    </div>
  );
}