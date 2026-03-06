import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Eye, Clock, BarChart2, Users, ChevronRight, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import EmpathyMarkerInfo from '@/components/game/EmpathyMarkerInfo';

const steps = [
  {
    icon: Eye,
    title: 'Read the Scenario',
    body: 'A real-world charged moment appears — a dinner table argument, a difficult conversation, a moment where words matter. Read it carefully. Feel it.',
  },
  {
    icon: Clock,
    title: 'Your Options',
    body: (
      <div className="space-y-2 text-sm">
        <p className="text-[#C5C1B8]">For each scenario you have three options:</p>
        <div className="space-y-2 mt-2">
          <div className="flex gap-3 bg-[#252542] rounded-lg p-3">
            <span>✏️</span>
            <div><strong className="text-[#E8E4DA]">Respond</strong><p className="text-[#6B6B8D] text-xs mt-0.5">Type what you'd genuinely say. A 60-second timer keeps it honest.</p></div>
          </div>
          <div className="flex gap-3 bg-[#252542] rounded-lg p-3">
            <span>⏭️</span>
            <div><strong className="text-[#E8E4DA]">Pass</strong><p className="text-[#6B6B8D] text-xs mt-0.5">Skip to a new scenario — no pressure.</p></div>
          </div>
          <div className="flex gap-3 bg-[#252542] rounded-lg p-3">
            <span>🚪</span>
            <div><strong className="text-[#E8E4DA]">Disengage</strong><p className="text-[#6B6B8D] text-xs mt-0.5">Choose not to engage. This is a valid, scored response — sometimes the wisest move.</p></div>
          </div>
        </div>
      </div>
    ),
  },
  {
    icon: BarChart2,
    title: 'See Your Empathy Score',
    body: 'Your response is evaluated across four markers: Acknowledgment, Curiosity, Non-judgment, and Door Open — each scored 0–25 for a total out of 100. Tap "Learn About the Markers" below to understand each one in depth.',
  },
  {
    icon: Eye,
    title: 'Read the Mirror',
    body: "This is not a grade. It's a reflection. You'll see what your words communicated, what the other person may have heard, and one concrete thing to try differently.",
  },
  {
    icon: Users,
    title: 'Play with Others',
    body: 'In The Table mode, 2–6 players respond to the same scenario, vote on whose response shows the most empathy, then compare notes. The conversation after is half the point.',
  },
];

export default function HowToPlay({ onClose }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [showMarkerInfo, setShowMarkerInfo] = useState(false);
  const isLast = currentStep === steps.length - 1;
  const step = steps[currentStep];
  const Icon = step.icon;

  return (
    <>
    {showMarkerInfo && <EmpathyMarkerInfo onClose={() => setShowMarkerInfo(false)} />}
    <motion.div
      className="fixed inset-0 z-40 bg-black/70 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        className="bg-[#1A1A2E] rounded-2xl border border-[#2F2F4A] w-full max-w-md overflow-hidden"
        initial={{ scale: 0.92, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0, y: 20 }}
        transition={{ duration: 0.3 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-[#2F2F4A]">
          <div>
            <p className="text-xs text-[#6B6B8D] tracking-widest uppercase mb-1">How to Play</p>
            <h2 className="font-serif text-xl text-[#E8E4DA]">Read the Room</h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-[#6B6B8D] hover:text-[#E8E4DA]"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Step Content */}
        <div className="px-6 py-8 min-h-[220px] flex flex-col justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
              className="space-y-4"
            >
              <div className="w-12 h-12 rounded-full bg-[#C9943A]/15 flex items-center justify-center">
                <Icon className="w-6 h-6 text-[#C9943A]" />
              </div>
              <h3 className="font-serif text-2xl text-[#E8E4DA]">{step.title}</h3>
              <p className="text-[#C5C1B8] leading-relaxed">{step.body}</p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Step Dots + Nav */}
        <div className="px-6 pb-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              {steps.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentStep(i)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    i === currentStep ? 'bg-[#C9943A] w-4' : 'bg-[#2F2F4A]'
                  }`}
                />
              ))}
            </div>
            <Button
              onClick={() => isLast ? onClose() : setCurrentStep(s => s + 1)}
              className="bg-[#C9943A] hover:bg-[#D4A94D] text-[#1A1A2E] font-medium"
            >
              {isLast ? "Let's Play" : (
                <>Next <ChevronRight className="w-4 h-4 ml-1" /></>
              )}
            </Button>
          </div>
          <button
            onClick={() => setShowMarkerInfo(true)}
            className="w-full text-xs text-[#6B6B8D] hover:text-[#C9943A] flex items-center justify-center gap-1.5 transition-colors"
          >
            <BookOpen className="w-3.5 h-3.5" /> Learn About the Four Empathy Markers
          </button>
        </div>
      </motion.div>
    </motion.div>
    </>
  );
}