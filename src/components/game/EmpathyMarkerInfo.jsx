import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronDown } from 'lucide-react';

export const MARKER_DETAILS = [
  {
    key: 'acknowledgment',
    emoji: '🫂',
    label: 'Acknowledgment',
    color: '#7C9FF5',
    short: 'Recognizing the other person\'s feelings as real and valid.',
    description: 'Acknowledgment means letting someone know you\'ve heard them — not just their words, but their emotional experience. You don\'t need to agree with them; you just need to show you see them.',
    example: '"That sounds really frustrating — I can understand why you\'d feel that way."',
    tip: 'Name the emotion you sense, not the facts of the situation. "You sound hurt" lands deeper than "I see what happened."',
  },
  {
    key: 'curiosity',
    emoji: '🔍',
    label: 'Curiosity',
    color: '#F5A623',
    short: 'Showing genuine interest in understanding their perspective.',
    description: 'Curiosity is the impulse to learn more rather than assume. It means asking open questions that invite the other person to share more — and truly listening to the answer.',
    example: '"What\'s been the hardest part of this for you?"',
    tip: 'Avoid "why" questions — they can feel interrogative. Try "what" and "how" instead: "How did that land for you?"',
  },
  {
    key: 'nonjudgment',
    emoji: '⚖️',
    label: 'Non-Judgment',
    color: '#7ED321',
    short: 'Suspending verdicts and blame.',
    description: 'Non-judgment means holding back from evaluating, labeling, or fixing. It creates the safety for someone to speak honestly without fear of being criticized or dismissed.',
    example: '"I\'m not here to judge — I just want to understand what\'s going on for you."',
    tip: 'Watch for minimizing phrases like "at least…" or "you should…" — they signal judgment even when well-intentioned.',
  },
  {
    key: 'door_open',
    emoji: '🚪',
    label: 'Door Open',
    color: '#BD10E0',
    short: 'Inviting continued dialogue and connection.',
    description: 'Keeping the door open signals that the conversation doesn\'t have to end here — that you\'re available, willing, and safe to return to. It\'s the quiet promise that this relationship can hold more.',
    example: '"Whenever you\'re ready to talk more, I\'m here."',
    tip: 'A closed door sounds like advice, silence, or resolution. An open door sounds like an invitation.',
  },
];

function MarkerCard({ marker, expanded, onToggle }) {
  return (
    <div className="bg-[#252542] rounded-xl border border-[#2F2F4A] overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-[#2F2F4A]/50 transition-colors"
      >
        <span className="text-xl">{marker.emoji}</span>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-[#E8E4DA] text-sm">{marker.label}</p>
          <p className="text-xs text-[#6B6B8D] truncate">{marker.short}</p>
        </div>
        <ChevronDown className={`w-4 h-4 text-[#6B6B8D] transition-transform shrink-0 ${expanded ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3 border-t border-[#2F2F4A] pt-3">
              <p className="text-sm text-[#C5C1B8] leading-relaxed">{marker.description}</p>
              <div className="rounded-lg p-3" style={{ background: marker.color + '15', borderLeft: `3px solid ${marker.color}` }}>
                <p className="text-xs text-[#6B6B8D] mb-1 uppercase tracking-wider">Example</p>
                <p className="text-sm italic" style={{ color: marker.color }}>{marker.example}</p>
              </div>
              <div className="bg-[#1A1A2E] rounded-lg p-3">
                <p className="text-xs text-[#6B6B8D] mb-1 uppercase tracking-wider">💡 Pro Tip</p>
                <p className="text-xs text-[#C5C1B8]">{marker.tip}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Inline expandable list — use inside modals or panels
export function EmpathyMarkerList() {
  const [expanded, setExpanded] = useState(null);
  return (
    <div className="space-y-2">
      {MARKER_DETAILS.map(m => (
        <MarkerCard
          key={m.key}
          marker={m}
          expanded={expanded === m.key}
          onToggle={() => setExpanded(expanded === m.key ? null : m.key)}
        />
      ))}
    </div>
  );
}

// Full-screen modal overlay
export default function EmpathyMarkerInfo({ onClose }) {
  const [expanded, setExpanded] = useState(null);

  return (
    <motion.div
      className="fixed inset-0 z-50 bg-black/75 flex items-end sm:items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        className="bg-[#1A1A2E] rounded-2xl border border-[#2F2F4A] w-full max-w-md max-h-[90vh] overflow-y-auto"
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="sticky top-0 bg-[#1A1A2E] flex items-center justify-between px-6 py-4 border-b border-[#2F2F4A] z-10">
          <div>
            <p className="text-xs text-[#6B6B8D] tracking-widest uppercase mb-0.5">Learn More</p>
            <h2 className="font-serif text-xl text-[#E8E4DA]">The Four Empathy Markers</h2>
          </div>
          <button onClick={onClose} className="text-[#6B6B8D] hover:text-[#E8E4DA] transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5 space-y-2">
          <p className="text-sm text-[#6B6B8D] mb-4">Every response is scored across these four dimensions — each worth up to 25 points. Tap any marker to learn more.</p>
          {MARKER_DETAILS.map(m => (
            <MarkerCard
              key={m.key}
              marker={m}
              expanded={expanded === m.key}
              onToggle={() => setExpanded(expanded === m.key ? null : m.key)}
            />
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}