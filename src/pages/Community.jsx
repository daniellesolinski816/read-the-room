import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Plus, Star, Heart, Lock, Loader2, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Logo from '@/components/brand/Logo';
import CommunityScenarioCard from '@/components/community/ScenarioCard';
import SubmitScenarioModal from '@/components/community/SubmitScenarioModal';
import ModerationPanel from '@/components/community/ModerationPanel';

const CATEGORIES = ['All', 'Family', 'Community', 'Digital', 'Civic', 'Workplace', 'Personal', 'Reflection'];
const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'top_rated', label: 'Top Rated' },
  { value: 'most_favorited', label: 'Most Favorited' },
];

export default function Community() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [showSubmit, setShowSubmit] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('newest');
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const qc = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(async (u) => {
      setUser(u);
      const profiles = await base44.entities.UserProfile.filter({ user_id: u.email });
      setProfile(profiles[0] || null);
    }).catch(() => {});
  }, []);

  const { data: scenarios = [], isLoading } = useQuery({
    queryKey: ['communityScenarios', selectedCategory, sortBy],
    queryFn: async () => {
      const filter = { status: 'approved' };
      if (selectedCategory !== 'All') filter.category = selectedCategory;
      const sortMap = {
        newest: '-created_date',
        top_rated: '-avg_rating',
        most_favorited: '-favorite_count',
      };
      return base44.entities.CommunityScenario.filter(filter, sortMap[sortBy], 40);
    },
  });

  const { data: interactions = [] } = useQuery({
    queryKey: ['myInteractions', user?.email],
    queryFn: () => base44.entities.ScenarioInteraction.filter({ user_id: user.email }),
    enabled: !!user,
  });

  const interactionMap = Object.fromEntries(interactions.map(i => [i.scenario_id, i]));

  const isPremium = profile?.is_premium;
  const isAdmin = user?.role === 'admin';

  const handleSubmitted = () => {
    setShowSubmit(false);
    setSubmitSuccess(true);
    setTimeout(() => setSubmitSuccess(false), 4000);
  };

  return (
    <div className="min-h-screen bg-[#1A1A2E]">
      <header className="p-4 flex items-center justify-between border-b border-[#2F2F4A]">
        <Link to={createPageUrl('Home')}>
          <Button variant="ghost" size="icon" className="text-[#C5C1B8] hover:text-[#C9943A]">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <Logo size="small" />
        <div className="w-9" />
      </header>

      <main className="max-w-lg mx-auto px-4 py-8">
        {/* Title */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <h1 className="font-serif text-3xl text-[#E8E4DA]">Community Scenarios</h1>
          <p className="text-[#6B6B8D] text-sm mt-1">Real moments, written by real people</p>
        </motion.div>

        {/* Submit success */}
        <AnimatePresence>
          {submitSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-green-900/30 border border-green-600/30 rounded-xl p-4 mb-5 text-green-300 text-sm"
            >
              ✓ Your scenario has been submitted for review. Thank you!
            </motion.div>
          )}
        </AnimatePresence>

        {/* Premium gate */}
        {!isPremium ? (
          <div className="bg-[#252542] rounded-2xl p-8 border border-[#C9943A]/20 text-center mb-6">
            <Lock className="w-8 h-8 text-[#C9943A] mx-auto mb-3" />
            <h2 className="font-serif text-xl text-[#E8E4DA] mb-2">Premium Feature</h2>
            <p className="text-[#6B6B8D] text-sm mb-5">
              Browse, rate, and submit community scenarios with a Premium account.
            </p>
            <Link to={createPageUrl('Premium')}>
              <Button className="bg-[#C9943A] hover:bg-[#D4A94D] text-[#1A1A2E]">
                Unlock Premium
              </Button>
            </Link>
          </div>
        ) : (
          <>
            {/* Admin moderation panel */}
            {isAdmin && (
              <div className="mb-8">
                <ModerationPanel />
              </div>
            )}

            {/* Controls */}
            <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
              <div className="flex gap-2 flex-wrap">
                {SORT_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setSortBy(opt.value)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                      sortBy === opt.value
                        ? 'bg-[#C9943A] border-[#C9943A] text-[#1A1A2E] font-medium'
                        : 'border-[#2F2F4A] text-[#6B6B8D] hover:text-[#C5C1B8]'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <Button
                onClick={() => setShowSubmit(true)}
                size="sm"
                className="bg-[#C9943A] hover:bg-[#D4A94D] text-[#1A1A2E] h-8 text-xs"
              >
                <Plus className="w-3.5 h-3.5 mr-1" /> Submit
              </Button>
            </div>

            {/* Category filter */}
            <div className="flex gap-2 overflow-x-auto pb-2 mb-5 scrollbar-none">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`text-xs px-3 py-1.5 rounded-full whitespace-nowrap border transition-colors shrink-0 ${
                    selectedCategory === cat
                      ? 'bg-[#252542] border-[#C9943A] text-[#C9943A]'
                      : 'border-[#2F2F4A] text-[#6B6B8D] hover:text-[#C5C1B8]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Scenario grid */}
            {isLoading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="w-7 h-7 text-[#C9943A] animate-spin" />
              </div>
            ) : scenarios.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-[#6B6B8D] mb-3">No scenarios here yet.</p>
                <Button onClick={() => setShowSubmit(true)} size="sm" className="bg-[#C9943A]/20 hover:bg-[#C9943A]/30 text-[#C9943A] border border-[#C9943A]/30">
                  Be the first to submit
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {scenarios.map(scenario => (
                  <CommunityScenarioCard
                    key={scenario.id}
                    scenario={scenario}
                    interaction={interactionMap[scenario.id]}
                    userId={user?.email}
                    onInteractionChange={() => qc.invalidateQueries({ queryKey: ['myInteractions'] })}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </main>

      <AnimatePresence>
        {showSubmit && (
          <SubmitScenarioModal
            user={user}
            onClose={() => setShowSubmit(false)}
            onSubmitted={handleSubmitted}
          />
        )}
      </AnimatePresence>
    </div>
  );
}