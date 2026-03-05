import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { User, Users, Settings, HelpCircle, Target, Trophy, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Logo from '@/components/brand/Logo';
import GameTitle from '@/components/brand/GameTitle';
import ScoreCard from '@/components/game/ScoreCard';
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
    if (!localStorage.getItem('empathy_onboarding_done')) {
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

  const alreadyPlayedToday = React.useMemo(() => {
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

        {/* Score Card */}
        {profile && (
          <motion.div 
            className="w-full max-w-sm mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <ScoreCard profile={profile} compact />
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

          <div className="grid grid-cols-3 gap-3">
            <Link to={createPageUrl('Practice')} className="block">
              <Button variant="ghost" className="w-full h-12 border border-[#2F2F4A] text-[#C5C1B8] hover:bg-[#252542] hover:text-[#C9943A] text-sm font-medium rounded-xl">
                <Target className="w-4 h-4 mr-1" />
                Practice
              </Button>
            </Link>
            <Link to={createPageUrl('Community')} className="block">
              <Button variant="ghost" className="w-full h-12 border border-[#2F2F4A] text-[#C5C1B8] hover:bg-[#252542] hover:text-[#C9943A] text-sm font-medium rounded-xl">
                <BookOpen className="w-4 h-4 mr-1" />
                Community
              </Button>
            </Link>
            <Link to={createPageUrl('Leaderboard')} className="block">
              <Button variant="ghost" className="w-full h-12 border border-[#2F2F4A] text-[#C5C1B8] hover:bg-[#252542] hover:text-[#C9943A] text-sm font-medium rounded-xl">
                <Trophy className="w-4 h-4 mr-1" />
                Leaderboard
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Daily Scenario Teaser */}
        <div className="w-full max-w-sm">
          <DailyScenarioTeaser scenario={dailyScenario} />
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