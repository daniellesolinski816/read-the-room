import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, Flame, Zap, CheckCircle, Bell, BellOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Logo from '@/components/brand/Logo';

const MICRO_PROMPTS = [
  "A coworker cuts you off mid-sentence in a meeting — again. Others are watching.",
  "Your friend replies to your long heartfelt text with just 'lol'. You feel dismissed.",
  "A family member makes a comment about your choices at dinner. Others go quiet.",
  "Someone ahead of you in line is being rude to the cashier. You're next.",
  "A teammate takes credit for your idea in front of your manager.",
  "Your partner seems distant tonight but says 'I'm fine' when you ask.",
  "A stranger at the bus stop starts crying quietly and nobody else notices.",
  "Someone sends you a passive-aggressive email that ends with 'just a thought'.",
  "Your friend cancels plans last minute — for the third time this month.",
  "A colleague disagrees with your idea in a group chat, publicly.",
];

export default function MicroMoment() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [scenario, setScenario] = useState(null);
  const [response, setResponse] = useState('');
  const [stage, setStage] = useState('prompt'); // prompt | responding | evaluating | done
  const [tip, setTip] = useState('');
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    base44.auth.me().then(async (u) => {
      setUser(u);
      const profiles = await base44.entities.UserProfile.filter({ user_id: u.email });
      const p = profiles[0] || null;
      setProfile(p);
      if (p) setReminderEnabled(p.reminder_email_enabled || false);
    }).catch(() => {});

    // Pick a daily micro-moment (same one all day via seed from date)
    const today = new Date().toISOString().split('T')[0];
    const seed = today.split('-').reduce((a, b) => a + parseInt(b), 0);
    const idx = seed % MICRO_PROMPTS.length;
    setScenario(MICRO_PROMPTS[idx]);
  }, []);

  const today = new Date().toISOString().split('T')[0];
  const doneToday = profile?.last_micro_date === today;

  const handleStart = () => setStage('responding');

  const handleSubmit = async () => {
    if (!response.trim()) return;
    setStage('evaluating');

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are an empathy coach. A user just completed a 30-second empathy check-in.

Scenario: "${scenario}"
Their response: "${response}"

Give ONE specific, bite-sized empathy insight (2 sentences max). 
Notice something specific about their word choice or approach.
Start with what you noticed, not a verdict. Be warm and direct. No clichés.`,
    });

    setTip(result);

    // Update profile streak
    if (user && profile) {
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      const currentStreak = profile.micro_streak || 0;
      const lastDate = profile.last_micro_date;
      let newStreak = 1;
      if (lastDate === today) {
        newStreak = currentStreak; // already done, no change
      } else if (lastDate === yesterday) {
        newStreak = currentStreak + 1;
      }
      const newLongest = Math.max(newStreak, profile.micro_longest_streak || 0);
      await base44.entities.UserProfile.update(profile.id, {
        micro_streak: newStreak,
        micro_longest_streak: newLongest,
        last_micro_date: today,
      });
      setProfile(prev => ({ ...prev, micro_streak: newStreak, micro_longest_streak: newLongest, last_micro_date: today }));
    }

    setStage('done');
  };

  const handleReminderToggle = async () => {
    if (!profile) return;
    setSaving(true);
    const next = !reminderEnabled;
    setReminderEnabled(next);
    await base44.entities.UserProfile.update(profile.id, { reminder_email_enabled: next });
    setSaving(false);
  };

  const streak = profile?.micro_streak || 0;

  return (
    <div className="min-h-screen bg-[#1A1A2E] flex flex-col">
      <header className="p-4 flex items-center justify-between border-b border-[#2F2F4A]">
        <Link to={createPageUrl('Home')}>
          <Button variant="ghost" size="icon" className="text-[#C5C1B8] hover:text-[#C9943A]">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-[#C9943A]" />
          <span className="font-serif text-[#C9943A] font-semibold">Daily Micro-Moment</span>
        </div>
        {streak > 0 && (
          <div className="flex items-center gap-1 bg-[#C9943A]/10 px-2.5 py-1 rounded-full">
            <Flame className="w-3.5 h-3.5 text-[#C9943A]" />
            <span className="text-xs text-[#C9943A] font-bold">{streak}</span>
          </div>
        )}
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 pb-12 max-w-lg mx-auto w-full">
        <AnimatePresence mode="wait">

          {/* Already done today */}
          {doneToday && stage !== 'done' && (
            <motion.div key="done-already" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-6 w-full">
              <div className="text-6xl">✅</div>
              <h1 className="font-serif text-2xl text-[#E8E4DA]">Already done today!</h1>
              <p className="text-[#C5C1B8] text-sm">Come back tomorrow for a fresh moment.</p>
              {streak > 0 && (
                <div className="flex items-center justify-center gap-2 bg-[#C9943A]/10 border border-[#C9943A]/30 rounded-xl p-4">
                  <Flame className="w-5 h-5 text-[#C9943A]" />
                  <span className="text-[#C9943A] font-semibold">{streak}-day streak</span>
                </div>
              )}
              <ReminderToggle enabled={reminderEnabled} saving={saving} onToggle={handleReminderToggle} />
              <Link to={createPageUrl('Home')}>
                <Button className="w-full h-12 bg-[#C9943A] hover:bg-[#D4A94D] text-[#1A1A2E]">Back to Home</Button>
              </Link>
            </motion.div>
          )}

          {/* Intro prompt */}
          {!doneToday && stage === 'prompt' && scenario && (
            <motion.div key="intro" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="w-full space-y-6">
              <div className="text-center">
                <div className="text-5xl mb-3">🧠</div>
                <h1 className="font-serif text-2xl text-[#E8E4DA] mb-2">30-Second Check-in</h1>
                <p className="text-[#6B6B8D] text-sm">One moment. One response. One tiny shift.</p>
              </div>

              <div className="bg-[#252542] border border-[#2F2F4A] rounded-2xl p-6">
                <p className="text-xs uppercase tracking-widest text-[#6B6B8D] mb-3">Today's moment</p>
                <p className="font-serif text-lg text-[#E8E4DA] leading-relaxed">"{scenario}"</p>
              </div>

              <p className="text-xs text-[#6B6B8D] text-center">What's the first thing you'd say or do?</p>

              <Button
                onClick={handleStart}
                className="w-full h-14 bg-[#C9943A] hover:bg-[#D4A94D] text-[#1A1A2E] text-base font-serif font-semibold rounded-xl"
              >
                <Zap className="w-5 h-5 mr-2" />
                Start Check-in
              </Button>
            </motion.div>
          )}

          {/* Response input */}
          {!doneToday && stage === 'responding' && (
            <motion.div key="respond" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="w-full space-y-5">
              <div className="bg-[#252542] border border-[#2F2F4A] rounded-2xl p-5">
                <p className="text-xs uppercase tracking-widest text-[#6B6B8D] mb-2">The moment</p>
                <p className="font-serif text-[#E8E4DA] leading-relaxed">"{scenario}"</p>
              </div>

              <div>
                <label className="text-xs text-[#6B6B8D] uppercase tracking-wider block mb-2">Your response</label>
                <textarea
                  autoFocus
                  value={response}
                  onChange={e => setResponse(e.target.value)}
                  placeholder="Keep it real. 1-3 sentences is plenty."
                  rows={4}
                  className="w-full bg-[#252542] border border-[#2F2F4A] rounded-xl p-4 text-[#E8E4DA] placeholder-[#6B6B8D] text-sm resize-none outline-none focus:border-[#C9943A]/50 transition-colors"
                />
                <p className="text-xs text-[#6B6B8D] mt-1 text-right">{response.length} chars</p>
              </div>

              <Button
                onClick={handleSubmit}
                disabled={!response.trim()}
                className="w-full h-12 bg-[#C9943A] hover:bg-[#D4A94D] text-[#1A1A2E] font-semibold rounded-xl disabled:opacity-30"
              >
                Get my tip →
              </Button>
            </motion.div>
          )}

          {/* Evaluating */}
          {stage === 'evaluating' && (
            <motion.div key="eval" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center space-y-4">
              <Loader2 className="w-10 h-10 text-[#C9943A] animate-spin mx-auto" />
              <p className="font-serif text-[#C5C1B8]">Reading the moment...</p>
            </motion.div>
          )}

          {/* Done + tip */}
          {stage === 'done' && (
            <motion.div key="result" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full space-y-5">
              <div className="text-center">
                <motion.div
                  initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.1 }}
                  className="text-5xl mb-3"
                >✨</motion.div>
                <h2 className="font-serif text-xl text-[#E8E4DA]">Nice work.</h2>
                {streak > 0 && (
                  <div className="flex items-center justify-center gap-1.5 mt-2">
                    <Flame className="w-4 h-4 text-[#C9943A]" />
                    <span className="text-sm text-[#C9943A] font-semibold">{streak}-day streak</span>
                  </div>
                )}
              </div>

              <div className="bg-[#252542] rounded-xl border border-[#2F2F4A] p-4">
                <p className="text-xs uppercase tracking-widest text-[#6B6B8D] mb-2">Your response</p>
                <p className="text-[#C5C1B8] text-sm italic">"{response}"</p>
              </div>

              <div className="bg-[#C9943A]/10 border border-[#C9943A]/30 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-3.5 h-3.5 text-[#C9943A]" />
                  <span className="text-xs uppercase tracking-widest text-[#C9943A]">Today's tip</span>
                </div>
                <p className="text-[#E8E4DA] text-sm leading-relaxed">{tip}</p>
              </div>

              <ReminderToggle enabled={reminderEnabled} saving={saving} onToggle={handleReminderToggle} />

              <div className="flex gap-3 pt-1">
                <Link to={createPageUrl('Solo')} className="flex-1">
                  <Button variant="outline" className="w-full h-11 border-[#2F2F4A] text-[#C5C1B8] hover:bg-[#252542] text-sm">
                    Play a full scenario
                  </Button>
                </Link>
                <Link to={createPageUrl('Home')} className="flex-1">
                  <Button className="w-full h-11 bg-[#C9943A] hover:bg-[#D4A94D] text-[#1A1A2E] text-sm">
                    Home
                  </Button>
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

function ReminderToggle({ enabled, saving, onToggle }) {
  return (
    <button
      onClick={onToggle}
      disabled={saving}
      className={`w-full flex items-center gap-3 rounded-xl border px-4 py-3 transition-all text-left ${
        enabled
          ? 'bg-[#7C6FCD]/10 border-[#7C6FCD]/40 hover:border-[#7C6FCD]/60'
          : 'bg-[#252542] border-[#2F2F4A] hover:border-[#7C6FCD]/30'
      }`}
    >
      {enabled
        ? <Bell className="w-4 h-4 text-[#7C6FCD] flex-shrink-0" />
        : <BellOff className="w-4 h-4 text-[#6B6B8D] flex-shrink-0" />
      }
      <div className="flex-1">
        <p className={`text-sm ${enabled ? 'text-[#7C6FCD]' : 'text-[#C5C1B8]'}`}>
          {enabled ? 'Daily email reminder on' : 'Get a daily email reminder'}
        </p>
        <p className="text-xs text-[#6B6B8D]">
          {enabled ? 'Sent each morning at 8am' : 'Tap to opt in — we\'ll nudge you each morning'}
        </p>
      </div>
      <div className={`w-8 h-4 rounded-full transition-colors flex-shrink-0 ${enabled ? 'bg-[#7C6FCD]' : 'bg-[#2F2F4A]'}`}>
        <div className={`w-3 h-3 rounded-full bg-white m-0.5 transition-transform ${enabled ? 'translate-x-4' : 'translate-x-0'}`} />
      </div>
    </button>
  );
}