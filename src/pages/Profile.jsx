import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Share2, Settings, Clock, Zap, Target, Heart, Loader2, Sparkles, Trophy, BarChart2, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import Logo from '@/components/brand/Logo';
import ScoreCard from '@/components/game/ScoreCard';
import PremiumBadge from '@/components/brand/PremiumBadge';

const categoryLabels = {
  Family: { emoji: '👨‍👩‍👧‍👦', label: 'Family' },
  Community: { emoji: '🏘️', label: 'Community' },
  Digital: { emoji: '💬', label: 'Digital' },
  Civic: { emoji: '🏛️', label: 'Civic' },
  Workplace: { emoji: '💼', label: 'Workplace' },
  Personal: { emoji: '❤️', label: 'Personal' },
  Reflection: { emoji: '🪞', label: 'Reflection' }
};

const markerLabels = {
  acknowledgment: { icon: Heart, label: 'Acknowledgment', description: 'Recognizing others\' feelings' },
  curiosity: { icon: Zap, label: 'Curiosity', description: 'Showing genuine interest' },
  nonjudgment: { icon: Target, label: 'Non-judgment', description: 'Avoiding verdicts' },
  door_open: { icon: Clock, label: 'Door Open', description: 'Inviting continued dialogue' }
};

export default function Profile() {
  const [user, setUser] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [timerEnabled, setTimerEnabled] = useState(true);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: profile, isLoading, refetch } = useQuery({
    queryKey: ['userProfile', user?.email],
    queryFn: async () => {
      if (!user) return null;
      const profiles = await base44.entities.UserProfile.filter({ user_id: user.email });
      if (profiles.length > 0) {
        setTimerEnabled(profiles[0].timer_enabled !== false);
        return profiles[0];
      }
      return null;
    },
    enabled: !!user
  });

  const { data: sessions = [] } = useQuery({
    queryKey: ['sessions', user?.email],
    queryFn: () => base44.entities.GameSession.filter({ user_id: user.email }, '-created_date', 20),
    enabled: !!user
  });

  const handleTimerToggle = async (checked) => {
    setTimerEnabled(checked);
    if (profile) {
      await base44.entities.UserProfile.update(profile.id, { timer_enabled: checked });
    }
  };

  const handleShare = async () => {
    if (!profile) return;
    
    const shareText = `My Empathy Profile from Read the Room 🎭\n\nScore: ${Math.round(profile.average_score || 0)}/100\nStreak: ${profile.current_streak || 0} days\n\nPractice empathy at The Empathy Enigma`;
    
    if (navigator.share) {
      await navigator.share({ text: shareText });
    } else {
      navigator.clipboard.writeText(shareText);
      alert('Profile copied to clipboard!');
    }
  };

  const getStrongestMarker = () => {
    if (!profile) return null;
    const markers = ['acknowledgment', 'curiosity', 'nonjudgment', 'door_open'];
    return markers.reduce((a, b) => 
      (profile[`avg_${a}`] || 0) > (profile[`avg_${b}`] || 0) ? a : b
    );
  };

  const getGrowthArea = () => {
    if (!profile) return null;
    const markers = ['acknowledgment', 'curiosity', 'nonjudgment', 'door_open'];
    return markers.reduce((a, b) => 
      (profile[`avg_${a}`] || 0) < (profile[`avg_${b}`] || 0) ? a : b
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#1A1A2E] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#C9943A] animate-spin" />
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
        <Button 
          variant="ghost" 
          size="icon" 
          className="text-[#C5C1B8] hover:text-[#C9943A]"
          onClick={() => setShowSettings(!showSettings)}
        >
          <Settings className="w-5 h-5" />
        </Button>
      </header>

      <main className="max-w-lg mx-auto px-4 py-8">
        {/* Settings Panel */}
        {showSettings && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="bg-[#252542] rounded-xl p-5 border border-[#2F2F4A] mb-6"
          >
            <h3 className="font-serif text-lg text-[#E8E4DA] mb-4">Settings</h3>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#E8E4DA]">60-second timer</p>
                <p className="text-sm text-[#6B6B8D]">Adds pressure to solo mode</p>
              </div>
              <Switch 
                checked={timerEnabled} 
                onCheckedChange={handleTimerToggle}
              />
            </div>
          </motion.div>
        )}

        {/* Profile Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="font-serif text-2xl text-[#E8E4DA] mb-1">{user?.full_name || 'Player'}</h1>
          <div className="flex items-center justify-center gap-2 mt-1">
            {profile?.is_premium ? (
              <PremiumBadge />
            ) : (
              <Link to={createPageUrl('Premium')}>
                <span className="text-xs text-[#C9943A]/70 underline underline-offset-2">Upgrade to Premium</span>
              </Link>
            )}
          </div>
        </motion.div>

        {profile ? (
          <>
            {/* Main Score Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="mb-8"
            >
              <ScoreCard profile={profile} />
            </motion.div>

            {/* Marker Breakdown */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="space-y-4 mb-8"
            >
              <h3 className="font-serif text-lg text-[#E8E4DA]">Your Markers</h3>
              
              {Object.entries(markerLabels).map(([key, { icon: Icon, label, description }]) => {
                const score = profile[`avg_${key}`] || 0;
                const isStrength = key === getStrongestMarker();
                const isGrowth = key === getGrowthArea();
                
                return (
                  <div 
                    key={key}
                    className={`bg-[#252542] rounded-lg p-4 border ${
                      isStrength ? 'border-[#C9943A]' : 'border-[#2F2F4A]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          isStrength ? 'bg-[#C9943A]/20' : 'bg-[#1A1A2E]'
                        }`}>
                          <Icon className={`w-4 h-4 ${isStrength ? 'text-[#C9943A]' : 'text-[#6B6B8D]'}`} />
                        </div>
                        <div>
                          <p className="text-[#E8E4DA] font-medium">{label}</p>
                          <p className="text-xs text-[#6B6B8D]">{description}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-serif font-semibold text-[#E8E4DA]">
                          {Math.round(score)}
                        </span>
                        <span className="text-[#6B6B8D] text-sm">/25</span>
                        {isStrength && <p className="text-xs text-[#C9943A]">Strength</p>}
                        {isGrowth && <p className="text-xs text-[#6B6B8D]">Growth area</p>}
                      </div>
                    </div>
                    <div className="h-2 bg-[#1A1A2E] rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-[#C9943A] to-[#D4A94D] rounded-full transition-all"
                        style={{ width: `${(score / 25) * 100}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </motion.div>

            {/* Category Performance */}
            {profile.scores_by_category && Object.keys(profile.scores_by_category).length > 0 && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="mb-8"
              >
                <h3 className="font-serif text-lg text-[#E8E4DA] mb-4">By Category</h3>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(profile.scores_by_category).map(([category, score]) => (
                    <div 
                      key={category}
                      className="bg-[#252542] rounded-lg p-4 border border-[#2F2F4A]"
                    >
                      <span className="text-2xl">{categoryLabels[category]?.emoji || '📋'}</span>
                      <p className="text-[#C5C1B8] text-sm mt-1">{categoryLabels[category]?.label || category}</p>
                      <p className="text-xl font-serif font-semibold text-[#E8E4DA]">{Math.round(score)}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Recent Sessions */}
            {sessions.length > 0 && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="mb-8"
              >
                <h3 className="font-serif text-lg text-[#E8E4DA] mb-4">Recent Sessions</h3>
                <div className="space-y-2">
                  {sessions.slice(0, 5).map((session) => (
                    <div 
                      key={session.id}
                      className="flex items-center justify-between py-3 border-b border-[#2F2F4A] last:border-0"
                    >
                      <div className="flex items-center gap-3">
                        <span>{categoryLabels[session.scenario_category]?.emoji || '📋'}</span>
                        <span className="text-[#C5C1B8] text-sm">
                          {new Date(session.created_date).toLocaleDateString()}
                        </span>
                      </div>
                      <span className="font-serif font-semibold text-[#C9943A]">
                        {session.total_score}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Premium Quick Links */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="grid grid-cols-2 gap-3 mb-4"
            >
              <Link to={createPageUrl('Practice')}>
                <div className={`rounded-xl p-4 border text-center ${profile?.is_premium ? 'bg-[#252542] border-[#2F2F4A]' : 'bg-[#252542]/50 border-[#2F2F4A]/50 opacity-60'}`}>
                  <Target className="w-5 h-5 text-[#C9943A] mx-auto mb-1" />
                  <p className="text-[#E8E4DA] text-xs font-medium">Targeted Practice</p>
                  {!profile?.is_premium && <Lock className="w-3 h-3 text-[#6B6B8D] mx-auto mt-1" />}
                </div>
              </Link>
              <Link to={createPageUrl('Leaderboard')}>
                <div className={`rounded-xl p-4 border text-center ${profile?.is_premium ? 'bg-[#252542] border-[#2F2F4A]' : 'bg-[#252542]/50 border-[#2F2F4A]/50 opacity-60'}`}>
                  <Trophy className="w-5 h-5 text-[#C9943A] mx-auto mb-1" />
                  <p className="text-[#E8E4DA] text-xs font-medium">Leaderboard</p>
                  {!profile?.is_premium && <Lock className="w-3 h-3 text-[#6B6B8D] mx-auto mt-1" />}
                </div>
              </Link>
            </motion.div>

            {/* Share Button */}
            <Button
              onClick={handleShare}
              className="w-full h-12 bg-[#C9943A] hover:bg-[#D4A94D] text-[#1A1A2E]"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share Your Profile
            </Button>
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-[#6B6B8D] mb-4">No games played yet</p>
            <Link to={createPageUrl('Solo')}>
              <Button className="bg-[#C9943A] hover:bg-[#D4A94D] text-[#1A1A2E]">
                Play Your First Game
              </Button>
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}