import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, Sparkles, Clock, BarChart2, Target, BookOpen, Trophy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Logo from '@/components/brand/Logo';

const features = [
  {
    icon: Sparkles,
    title: 'AI Scenario Generation',
    description: 'Generate fresh, unique scenarios on demand using AI — unlimited variety.',
  },
  {
    icon: BookOpen,
    title: 'Extended Scenario Library',
    description: 'Unlock the full library of premium curated scenarios across all categories.',
  },
  {
    icon: Clock,
    title: 'Relaxed Mode',
    description: 'Disable the 60-second timer and respond at your own pace.',
  },
  {
    icon: BarChart2,
    title: 'Deep Analytics',
    description: 'Full session history, trend charts, and score evolution over time.',
  },
  {
    icon: Target,
    title: 'Targeted Practice',
    description: 'Focus on a specific empathy marker — AI tailors scenarios to your growth area.',
  },
  {
    icon: Trophy,
    title: 'Leaderboards',
    description: 'See how your empathy score ranks among other players.',
  },
];

export default function Premium() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [activating, setActivating] = useState(false);

  useEffect(() => {
    base44.auth.me().then(async (u) => {
      setUser(u);
      const profiles = await base44.entities.UserProfile.filter({ user_id: u.email });
      if (profiles[0]) setProfile(profiles[0]);
    }).catch(() => {});
  }, []);

  const isPremium = profile?.is_premium;

  const handleActivate = async () => {
    // Block checkout inside iframe (preview mode)
    if (window.self !== window.top) {
      alert('Checkout only works from the published app. Please open the app in a new tab.');
      return;
    }
    if (!profile) return;
    setActivating(true);
    try {
      const res = await base44.functions.invoke('createCheckoutSession', {
        success_url: window.location.origin + createPageUrl('Premium') + '?success=1',
        cancel_url: window.location.href,
      });
      if (res.data?.url) {
        window.location.href = res.data.url;
      }
    } catch (e) {
      console.error(e);
      setActivating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1A1A2E]">
      <header className="p-4 flex items-center justify-between border-b border-[#2F2F4A]">
        <Link to={createPageUrl('Profile')}>
          <Button variant="ghost" size="icon" className="text-[#C5C1B8] hover:text-[#C9943A]">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <Logo size="small" />
        <div className="w-10" />
      </header>

      <main className="max-w-md mx-auto px-4 py-8">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="w-14 h-14 rounded-full bg-[#C9943A]/20 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-7 h-7 text-[#C9943A]" />
          </div>
          <h1 className="font-serif text-3xl text-[#E8E4DA] mb-2">Go Premium</h1>
          <p className="text-[#C5C1B8] text-sm leading-relaxed">
            Unlock the full Read the Room experience and deepen your empathy practice.
          </p>
        </motion.div>

        {/* Already Premium */}
        {isPremium && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-[#C9943A]/10 border border-[#C9943A]/40 rounded-xl p-5 mb-6 text-center"
          >
            <Check className="w-6 h-6 text-[#C9943A] mx-auto mb-2" />
            <p className="text-[#C9943A] font-serif text-lg">You're a Premium member</p>
            <p className="text-[#C5C1B8] text-sm mt-1">All features are unlocked.</p>
          </motion.div>
        )}

        {/* Feature List */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="space-y-3 mb-8"
        >
          {features.map(({ icon: Icon, title, description }) => (
            <div key={title} className="flex items-start gap-4 bg-[#252542] rounded-xl p-4 border border-[#2F2F4A]">
              <div className="w-9 h-9 rounded-full bg-[#C9943A]/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Icon className="w-4 h-4 text-[#C9943A]" />
              </div>
              <div>
                <p className="text-[#E8E4DA] font-medium text-sm">{title}</p>
                <p className="text-[#6B6B8D] text-xs mt-0.5 leading-relaxed">{description}</p>
              </div>
            </div>
          ))}
        </motion.div>

        {/* CTA */}
        {!isPremium && !activated && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Button
              onClick={handleActivate}
              disabled={activating || !profile}
              className="w-full h-14 bg-[#C9943A] hover:bg-[#D4A94D] text-[#1A1A2E] text-lg font-serif font-semibold"
            >
              {activating ? 'Activating...' : 'Unlock Premium'}
            </Button>
            <p className="text-center text-xs text-[#6B6B8D] mt-3">
              One-time unlock · No subscription required
            </p>
          </motion.div>
        )}
      </main>
    </div>
  );
}