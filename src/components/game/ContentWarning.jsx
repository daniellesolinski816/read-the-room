import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Tags that warrant a content warning
const SENSITIVE_TAGS = ['Grief', 'Shame', 'Anxiety', 'Guilt', 'Loneliness'];

export function needsWarning(scenario) {
  if (!scenario) return false;
  const tags = scenario.emotion_tags || [];
  return tags.some(t => SENSITIVE_TAGS.includes(t));
}

export function getWarningLabel(scenario) {
  if (!scenario) return null;
  const tags = (scenario.emotion_tags || []).filter(t => SENSITIVE_TAGS.includes(t));
  return tags.length > 0 ? tags.join(', ') : null;
}

export default function ContentWarning({ scenario, onContinue, onSkip }) {
  const label = getWarningLabel(scenario);

  return (
    <motion.div
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-[#1A1A2E] rounded-2xl border border-yellow-600/40 w-full max-w-sm p-6 space-y-5"
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.92, opacity: 0 }}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-yellow-600/20 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-yellow-500" />
          </div>
          <div>
            <p className="text-xs text-yellow-500/70 uppercase tracking-wider mb-0.5">Content Note</p>
            <h3 className="font-serif text-lg text-[#E8E4DA]">Sensitive Theme</h3>
          </div>
        </div>

        <p className="text-[#C5C1B8] text-sm leading-relaxed">
          This scenario explores themes of <span className="text-yellow-400 font-medium">{label}</span>. It's designed to build empathy through challenge — but if you'd prefer to skip it, that's completely okay.
        </p>

        <div className="space-y-2">
          <Button
            onClick={onContinue}
            className="w-full bg-[#C9943A] hover:bg-[#D4A94D] text-[#1A1A2E] font-medium flex items-center gap-2"
          >
            <Eye className="w-4 h-4" /> I'm ready — show the scenario
          </Button>
          <Button
            onClick={onSkip}
            variant="ghost"
            className="w-full text-[#6B6B8D] hover:text-[#C5C1B8] hover:bg-[#252542] text-sm"
          >
            Skip to a different scenario
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}