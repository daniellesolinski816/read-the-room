import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Users, Heart, ChevronRight, ChevronLeft, Zap, Swords, Star, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';

const steps = [
  {
    icon: <span className="text-4xl">🎭</span>,
    title: 'Welcome to Read the Room',
    body: 'This is a game about learning to truly listen. You\'ll be placed in charged real-world moments and asked: how would you respond?',
  },
  {
    icon: <User className="w-8 h-8 text-[#C9943A]" />,
    title: 'Read the Room',
    body: 'Each scenario presents a tense or emotionally loaded situation. Read it carefully — then type what you would actually say to that person.',
  },
  {
    icon: <Heart className="w-8 h-8 text-[#C9943A]" />,
    title: 'Four Empathy Markers',
    body: (
      <div className="text-left space-y-2 text-sm">
        <p><span className="text-[#C9943A]">👁️ Acknowledgment</span> — Did you recognize their feelings?</p>
        <p><span className="text-[#C9943A]">🔍 Curiosity</span> — Did you ask or show genuine interest?</p>
        <p><span className="text-[#C9943A]">⚖️ Non-judgment</span> — Did you avoid passing a verdict?</p>
        <p><span className="text-[#C9943A]">🚪 Door Open</span> — Did your response invite more dialogue?</p>
      </div>
    ),
  },
  {
    icon: <span className="text-4xl">🤖</span>,
    title: 'AI Feedback',
    body: 'After each response, an AI coach scores you 0–25 on each marker (100 total) and gives you a personalized reflection — what the other person might have heard, and one concrete thing to do differently. You have 60 seconds to respond (premium members can adjust this).',
  },
  {
    icon: <Swords className="w-8 h-8 text-[#C9943A]" />,
    title: 'Empathy Duel',
    body: 'Challenge a friend to a 1v1 Duel. One player is the Character, one is the Responder — then swap roles. After both rounds, give each other peer feedback.',
  },
  {
    icon: <Zap className="w-8 h-8 text-[#C9943A]" />,
    title: 'Quick Match',
    body: 'No friend available? Use Quick Match to be automatically paired with a stranger for a Duel. Build empathy across divides.',
  },
  {
    icon: <Star className="w-8 h-8 text-[#C9943A]" />,
    title: 'Points & Badges',
    body: 'Earn points for every session based on your score. Unlock badges like "Empathy Master," "Week Warrior," and "Perfect Round" as you grow.',
  },
  {
    icon: <BookOpen className="w-8 h-8 text-[#C9943A]" />,
    title: 'Ready to Play',
    body: 'Start with Solo to warm up, then jump into a Duel or Quick Match. Your scores, streaks, and badges are tracked on your profile. Good luck!',
  },
];

export default function OnboardingTour({ onDismiss }) {
  const [step, setStep] = useState(0);
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
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleFinish} />

      <motion.div
        className="relative bg-[#252542] border border-[#2F2F4A] rounded-2xl p-7 w-full max-w-sm shadow-2xl"
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        {/* Dismiss */}
        <button
          onClick={handleFinish}
          className="absolute top-4 right-4 text-[#6B6B8D] hover:text-[#C5C1B8] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Step indicator */}
        <div className="flex gap-1.5 mb-6">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= step ? 'bg-[#C9943A]' : 'bg-[#2F2F4A]'}`}
            />
          ))}
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="text-center"
          >
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-[#1A1A2E] flex items-center justify-center">
                {steps[step].icon}
              </div>
            </div>
            <h2 className="font-serif text-xl text-[#E8E4DA] mb-3">{steps[step].title}</h2>
            <div className="text-[#C5C1B8] text-sm leading-relaxed">
              {typeof steps[step].body === 'string' ? steps[step].body : steps[step].body}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-7">
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
              className="bg-[#C9943A] hover:bg-[#D4A94D] text-[#1A1A2E] font-medium px-6"
            >
              Let's Play
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