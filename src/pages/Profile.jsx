import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Settings, Edit3, Check, Star, Target, Flame } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import DailyGoalRing from '@/components/profile/DailyGoalRing';
import Logo from '@/components/brand/Logo';
import ScoreCard from '@/components/game/ScoreCard';
import AnalyticsPanel from '@/components/profile/AnalyticsPanel';
import PersonalizedFeedback from '@/components/profile/PersonalizedFeedback';
import StreakCalendar from '@/components/profile/StreakCalendar';
import BadgeGrid from '@/components/gamification/BadgeGrid';
import MasteryPanel from '@/components/gamification/MasteryPanel';

const CATEGORY_LABELS = {
  Family: '👨‍👩‍👧 Family',
  Community: '🏘️ Community',
  Digital: '💻 Digital',
  Civic: '🏛️ Civic',
  Workplace: '💼 Workplace',
  Personal: '🧘 Personal',
  Reflection: '🪞 Reflection',
};

const MARKER_LABELS = {
  avg_acknowledgment: { icon: '👁️', label: 'Acknowledgment', desc: 'Recognizing feelings' },
  avg_curiosity: { icon: '🔍', label: 'Curiosity', desc: 'Genuine interest' },
  avg_nonjudgment: { icon: '⚖️', label: 'Non-judgment', desc: 'Avoiding verdicts' },
  avg_door_open: { icon: '🚪', label: 'Door Open', desc: 'Inviting dialogue' },
};

const AVATAR_OPTIONS = ['🧠','🌊','🌿','🔥','⭐','🦋','🌙','🎯','💎','🪷','🌸','🌺'];

export default function Profile() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editAvatar, setEditAvatar] = useState('🧠');
  const [saving, setSaving] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [activeTab, setActiveTab] = useState('stats');
  const [editGoal, setEditGoal] = useState('');
  const [savingGoal, setSavingGoal] = useState(false);
  const [goalCelebrated, setGoalCelebrated] = useState(false);

  useEffect(() => {
    base44.auth.me().then(async (u) => {
      setUser(u);
      const profiles = await base44.entities.UserProfile.filter({ user_id: u.email });
      if (profiles.length > 0) {
        setProfile(profiles[0]);
        setEditName(profiles[0].display_name || u.full_name || '');
        setEditBio(profiles[0].bio || '');
        setEditAvatar(profiles[0].avatar_emoji || '🧠');
        setEditGoal(profiles[0].daily_goal ? String(profiles[0].daily_goal) : '');
      }
    }).catch(() => {});
  }, []);

  const { data: sessions = [] } = useQuery({
    queryKey: ['gameSessions', user?.email],
    queryFn: () => base44.entities.GameSession.filter({ user_id: user?.email }, '-created_date', 50),
    enabled: !!user,
  });

  const saveProfile = async () => {
    if (!profile) return;
    setSaving(true);
    const updated = await base44.entities.UserProfile.update(profile.id, {
      display_name: editName,
      bio: editBio,
      avatar_emoji: editAvatar,
    });
    setProfile({ ...profile, display_name: editName, bio: editBio, avatar_emoji: editAvatar });
    setEditMode(false);
    setSaving(false);
  };

  const toggleTimer = async () => {
    if (!profile) return;
    const newVal = profile.timer_enabled === false ? true : false;
    if (newVal && !profile?.is_premium) return;
    await base44.entities.UserProfile.update(profile.id, { timer_enabled: newVal });
    setProfile({ ...profile, timer_enabled: newVal });
  };

  const earnedBadgeIds = profile?.earned_badges || [];

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#1A1A2E] flex items-center justify-center">
        <div className="text-center">
          <p className="text-[#C5C1B8] mb-4">No profile yet — play your first game!</p>
          <Link to={createPageUrl('Solo')}>
            <Button className="bg-[#C9943A] text-[#1A1A2E]">Play Now</Button>
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
        <Button variant="ghost" size="icon" onClick={() => setShowSettings(s => !s)} className="text-[#C5C1B8] hover:text-[#C9943A]">
          <Settings className="w-5 h-5" />
        </Button>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">

        {/* Settings panel */}
        <AnimatePresence>
          {showSettings && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              className="bg-[#252542] rounded-xl p-5 border border-[#2F2F4A] overflow-hidden">
              <h3 className="font-serif text-lg text-[#E8E4DA] mb-4">Settings</h3>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[#C5C1B8] text-sm">Timer in Quick Draw</p>
                  {!profile.is_premium && <p className="text-xs text-[#6B6B8D]">Premium only</p>}
                </div>
                <Button
                  size="sm"
                  variant={profile.timer_enabled !== false ? 'default' : 'outline'}
                  onClick={toggleTimer}
                  disabled={!profile.is_premium}
                  className={profile.timer_enabled !== false ? 'bg-[#C9943A] text-[#1A1A2E]' : 'border-[#2F2F4A] text-[#6B6B8D]'}
                >
                  {profile.timer_enabled !== false ? 'On' : 'Off'}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Profile card */}
        <div className="bg-[#252542] rounded-2xl p-6 border border-[#2F2F4A]">
          {editMode ? (
            <div className="space-y-4">
              <p className="text-sm text-[#C5C1B8] mb-2">Choose avatar</p>
              <div className="flex flex-wrap gap-2">
                {AVATAR_OPTIONS.map(em => (
                  <button
                    key={em}
                    onClick={() => setEditAvatar(em)}
                    className={`text-2xl p-2 rounded-lg border transition-all ${editAvatar === em ? 'border-[#C9943A] bg-[#C9943A]/20' : 'border-[#2F2F4A] hover:border-[#C9943A]/50'}`}
                  >{em}</button>
                ))}
              </div>
              <Input value={editName} onChange={e => setEditName(e.target.value)} placeholder="Display name"
                className="bg-[#1A1A2E] border-[#2F2F4A] text-[#E8E4DA]" />
              <Input value={editBio} onChange={e => setEditBio(e.target.value)} placeholder="Short bio (optional)"
                className="bg-[#1A1A2E] border-[#2F2F4A] text-[#E8E4DA]" />
              <div className="flex gap-2">
                <Button onClick={saveProfile} disabled={saving} className="bg-[#C9943A] text-[#1A1A2E] flex-1">
                  <Check className="w-4 h-4 mr-1" /> {saving ? 'Saving…' : 'Save'}
                </Button>
                <Button onClick={() => setEditMode(false)} variant="ghost" className="text-[#6B6B8D]">Cancel</Button>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-4">
              <span className="text-5xl">{profile.avatar_emoji || '🧠'}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="font-serif text-2xl text-[#E8E4DA] truncate">{profile.display_name || user?.full_name}</h2>
                  <Button variant="ghost" size="icon" onClick={() => setEditMode(true)} className="text-[#6B6B8D] hover:text-[#C9943A] w-7 h-7">
                    <Edit3 className="w-3.5 h-3.5" />
                  </Button>
                </div>
                {profile.bio && <p className="text-[#6B6B8D] text-sm mt-0.5">{profile.bio}</p>}
                <div className="flex items-center gap-4 mt-3 flex-wrap">
                  <span className="flex items-center gap-1 text-sm text-[#C9943A]">
                    <Star className="w-3.5 h-3.5 fill-current" /> {Math.round(profile.total_points || 0)} pts
                  </span>
                  <span className="flex items-center gap-1 text-sm text-[#C5C1B8]">
                    <Flame className="w-3.5 h-3.5 text-orange-400" /> {profile.current_streak || 0} day streak
                  </span>
                  <span className="flex items-center gap-1 text-sm text-[#C5C1B8]">
                    <Target className="w-3.5 h-3.5 text-blue-400" /> {profile.total_sessions || 0} sessions
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Tab nav */}
        <div className="flex gap-1 bg-[#252542] rounded-xl p-1">
          {[['stats', 'Stats'], ['badges', 'Badges'], ['mastery', 'Mastery'], ['analytics', 'Analytics']].map(([id, label]) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === id ? 'bg-[#C9943A] text-[#1A1A2E]' : 'text-[#6B6B8D] hover:text-[#C5C1B8]'}`}>
              {label}
            </button>
          ))}
        </div>

        {/* Stats tab */}
        {activeTab === 'stats' && (
          <div className="space-y-4">
            <ScoreCard profile={profile} />
            <StreakCalendar profile={profile} sessions={sessions} />
            <PersonalizedFeedback profile={profile} sessions={sessions} />
          </div>
        )}

        {/* Badges tab */}
        {activeTab === 'badges' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-lg text-[#E8E4DA]">Achievements</h3>
              <span className="text-sm text-[#6B6B8D]">{earnedBadgeIds.length} / 12 earned</span>
            </div>
            <BadgeGrid earnedBadgeIds={earnedBadgeIds} showAll={true} />
          </div>
        )}

        {/* Mastery tab */}
        {activeTab === 'mastery' && (
          <div className="space-y-4">
            <MasteryPanel profile={profile} />
          </div>
        )}

        {/* Analytics tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-4">
            {sessions.length >= 2 ? (
              <AnalyticsPanel sessions={sessions} profile={profile} />
            ) : (
              <p className="text-center text-[#6B6B8D] py-8">Play at least 2 games to unlock analytics</p>
            )}
          </div>
        )}
      </main>
    </div>
  );
}