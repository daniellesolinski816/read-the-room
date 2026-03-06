import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

const steps = [
  {
    emoji: '🎭',
    title: 'Welcome to Read the Room',
    body: 'A game about real conversations. You\'ll face charged, real-world moments and practice the one skill that changes everything — empathy.',
    highlight: null,
  },
  {
    emoji: '📋',
    title: 'Here\'s How It Works',
    body: 'Each round, you get a scenario — a tense moment between real people. Before you respond, you choose how to approach it:',
    items: [
      { icon: '✍️', label: 'Engage', desc: 'Type what you\'d actually say' },
      { icon: '🧘', label: 'Pause', desc: 'Take a breath — sometimes that\'s wisdom' },
      { icon: '🚪', label: 'Pass', desc: 'Skip this one, no judgment' },
    ],
  },
  {
    emoji: '🤖',
    title: 'Your AI Coach',
    body: 'After you respond, an AI coach scores your reply and gives you a personal reflection — what the other person might have heard, and one concrete thing to try next time.',
    highlight: '60 seconds to respond · scores out of 100',
  },
  {
    emoji: '❤️',
    title: 'Four Empathy Markers',
    body: 'Every response is scored on four dimensions:',
    items: [
      { icon: '👁️', label: 'Acknowledgment', desc: 'Did you recognize their feelings?' },
      { icon: '🔍', label: 'Curiosity', desc: 'Did you show genuine interest?' },
      { icon: '⚖️', label: 'Non-judgment', desc: 'Did you avoid passing a verdict?' },
      { icon: '🚪', label: 'Door Open', desc: 'Did you invite more dialogue?' },
    ],
  },
  {
    emoji: '⚔️',
    title: 'Play With Others',
    body: 'Take on a friend in an Empathy Duel — one of you plays the character, one responds, then you swap. Or use Quick Match to be paired with a stranger.',
    highlight: 'Duel a friend · Quick Match with strangers',
  },
  {
    emoji: '🏆',
    title: 'Grow Over Time',
    body: 'Earn points, build streaks, unlock badges, and level up from Newcomer to Empathy Enigma. Your profile tracks everything.',
    highlight: 'Levels · Streaks · Badges · Analytics',
  },
  {
    emoji: '🚀',
    title: 'You\'re Ready',
    body: 'Start with Solo to warm up. Your scores, history, and growth are always on your Profile.',
    cta: true,
  },
];

export default function OnboardingTour({ onDismiss }) {
  const [step, setStep] = useState(0);
  const current = steps[step];
  const isLast = step === steps.length - 1;

  const handleFinish = () => {
    localStorage.setItem('empathy_onboarding_done', '1');
    onDismiss();
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={handleFinish} />

      <motion.div
        className="relative bg-[#252542] border border-[#2F2F4A] rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden"
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 50, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        {/* Progress bar */}
        <div className="flex gap-1 p-4 pb-0">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= step ? 'bg-[#C9943A]' : 'bg-[#2F2F4A]'}`}
            />
          ))}
        </div>

        {/* Dismiss */}
        <button
          onClick={handleFinish}
          className="absolute top-4 right-4 text-[#6B6B8D] hover:text-[#C5C1B8] transition-colors z-10"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.2 }}
            className="p-7 pt-5"
          >
            {/* Emoji */}
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-2xl bg-[#1A1A2E] flex items-center justify-center text-4xl">
                {current.emoji}
              </div>
            </div>

            <h2 className="font-serif text-xl text-[#E8E4DA] mb-2 text-center">{current.title}</h2>
            <p className="text-[#C5C1B8] text-sm leading-relaxed text-center mb-4">{current.body}</p>

            {/* Items list */}
            {current.items && (
              <div className="space-y-2 mb-4">
                {current.items.map((item, i) => (
                  <div key={i} className="flex items-center gap-3 bg-[#1A1A2E] rounded-xl px-4 py-2.5">
                    <span className="text-xl w-7 text-center">{item.icon}</span>
                    <div>
                      <span className="text-[#E8E4DA] text-sm font-medium">{item.label}</span>
                      <span className="text-[#6B6B8D] text-xs ml-2">{item.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Highlight pill */}
            {current.highlight && (
              <div className="text-center">
                <span className="inline-block bg-[#C9943A]/15 text-[#C9943A] text-xs px-3 py-1.5 rounded-full border border-[#C9943A]/30">
                  {current.highlight}
                </span>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between px-7 pb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setStep(s => s - 1)}
            disabled={step === 0}
            className="text-[#6B6B8D] hover:text-[#C5C1B8] disabled:opacity-0"
          >
            <ChevronLeft className="w-4 h-4 mr-1" /> Back
          </Button>

          {isLast ? (
            <Button
              onClick={handleFinish}
              className="bg-[#C9943A] hover:bg-[#D4A94D] text-[#1A1A2E] font-semibold px-8"
            >
              Let's Play 🎯
            </Button>
          ) : (
            <Button
              onClick={() => setStep(s => s + 1)}
              className="bg-[#C9943A] hover:bg-[#D4A94D] text-[#1A1A2E] font-medium px-6"
            >
              Next <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}