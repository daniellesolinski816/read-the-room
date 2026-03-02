import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Users, Heart, ChevronRight, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

const steps = [
  {
    icon: <User className="w-8 h-8 text-[#C9943A]" />,
    title: 'Play Solo',
    body: 'Read a real-world scenario and type how you would respond. You have 60 seconds — no pressure to be perfect, just honest.',
  },
  {
    icon: <Users className="w-8 h-8 text-[#C9943A]" />,
    title: 'Play with Others',
    body: 'Create a room and invite friends or colleagues. Compare responses anonymously and vote on what felt most empathic.',
  },
  {
    icon: <Heart className="w-8 h-8 text-[#C9943A]" />,
    title: 'Empathy Markers',
    body: 'Every response is scored on four markers: Acknowledgment, Curiosity, Non-judgment, and Keeping the Door Open. Together they make up your empathy score.',
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
            <p className="text-[#C5C1B8] text-sm leading-relaxed">{steps[step].body}</p>
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