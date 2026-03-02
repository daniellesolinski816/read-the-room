import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { Sparkles, ChevronDown, ChevronUp, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const MARKER_INFO = {
  acknowledgment: {
    label: 'Acknowledgment',
    tips: [
      'Start your response by naming what the other person might be feeling.',
      'Use phrases like "I can see why you\'d feel..." or "That sounds really hard."',
      'Mirror back the core emotion before offering any solutions.',
    ],
    practice: 'Try a Family or Personal scenario and focus solely on naming the emotion first.',
  },
  curiosity: {
    label: 'Curiosity',
    tips: [
      'End your response with an open-ended question.',
      'Replace advice with questions: "What would feel most helpful right now?"',
      'Ask about their experience, not just the facts of the situation.',
    ],
    practice: 'In your next solo game, challenge yourself to include at least one genuine question.',
  },
  nonjudgment: {
    label: 'Non-judgment',
    tips: [
      'Avoid words like "should", "must", or "obviously".',
      'Present multiple perspectives before drawing any conclusion.',
      'Notice when you\'re labelling — try describing behavior instead.',
    ],
    practice: 'Play a Civic or Workplace scenario and write your response without any evaluative language.',
  },
  door_open: {
    label: 'Door Open',
    tips: [
      'Close with an invitation: "I\'m here whenever you want to talk."',
      'Avoid finality — phrases like "let me know" keep the dialogue alive.',
      'Offer a concrete next step without pressure.',
    ],
    practice: 'Try a Community scenario and ensure your last sentence is an open invitation.',
  },
};

export default function PersonalizedFeedback({ profile, sessions }) {
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(true);

  const weakestMarker = (() => {
    if (!profile) return null;
    const markers = ['acknowledgment', 'curiosity', 'nonjudgment', 'door_open'];
    return markers.reduce((a, b) =>
      (profile[`avg_${a}`] || 0) < (profile[`avg_${b}`] || 0) ? a : b
    );
  })();

  const generateFeedback = async () => {
    setLoading(true);
    setFeedback(null);

    const recentSessions = [...sessions].reverse().slice(-10);
    const avgTotal = sessions.reduce((s, v) => s + (v.total_score || 0), 0) / sessions.length;
    const trend = recentSessions.length >= 4
      ? recentSessions.slice(-4).reduce((s, v) => s + (v.total_score || 0), 0) / 4 - avgTotal
      : 0;

    const prompt = `You are a compassionate empathy coach. Analyze this player's performance data and give personalized, actionable feedback.

PLAYER STATS:
- Average total score: ${Math.round(avgTotal)}/100
- Sessions played: ${sessions.length}
- Avg Acknowledgment: ${Math.round(profile.avg_acknowledgment || 0)}/25
- Avg Curiosity: ${Math.round(profile.avg_curiosity || 0)}/25
- Avg Non-judgment: ${Math.round(profile.avg_nonjudgment || 0)}/25
- Avg Door Open: ${Math.round(profile.avg_door_open || 0)}/25
- Recent trend: ${trend > 2 ? 'improving' : trend < -2 ? 'declining slightly' : 'stable'}
- Weakest marker: ${MARKER_INFO[weakestMarker]?.label || weakestMarker}

Write a short, warm, specific coaching message (2-3 sentences) that:
1. Acknowledges their progress or pattern honestly
2. Identifies their biggest growth opportunity
3. Gives one concrete tip for their next session

Then provide one micro-scenario (1 sentence) they can mentally rehearse to practice their weakest marker.

Keep it personal, encouraging, and specific — not generic.`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          coaching_message: { type: 'string' },
          micro_scenario: { type: 'string' },
          focus_marker: { type: 'string' },
        },
      },
    });

    setFeedback(result);
    setLoading(false);
  };

  if (!profile || sessions.length < 3) return null;

  const markerData = MARKER_INFO[weakestMarker];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.3 }}
      className="mb-8"
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-serif text-lg text-[#E8E4DA] flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#C9943A]" />
          Personal Coach
        </h3>
        <button
          onClick={() => setExpanded(v => !v)}
          className="text-[#6B6B8D] hover:text-[#C5C1B8]"
        >
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            {/* Static tips for weakest marker */}
            {markerData && (
              <div className="bg-[#252542] rounded-xl p-5 border border-[#2F2F4A] mb-4">
                <p className="text-xs text-[#6B6B8D] uppercase tracking-wider mb-3">
                  Growth area — {markerData.label}
                </p>
                <ul className="space-y-2 mb-4">
                  {markerData.tips.map((tip, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-[#C5C1B8]">
                      <span className="text-[#C9943A] mt-0.5 shrink-0">•</span>
                      {tip}
                    </li>
                  ))}
                </ul>
                <div className="border-t border-[#2F2F4A] pt-3">
                  <p className="text-xs text-[#C9943A] font-medium mb-1">Try this:</p>
                  <p className="text-sm text-[#E8E4DA] italic">{markerData.practice}</p>
                  <Link to={createPageUrl('Practice')} className="mt-3 inline-block">
                    <Button size="sm" variant="outline" className="border-[#C9943A]/40 text-[#C9943A] hover:bg-[#C9943A]/10 text-xs h-8">
                      Practice Now →
                    </Button>
                  </Link>
                </div>
              </div>
            )}

            {/* AI Coaching Card */}
            <div className="bg-gradient-to-br from-[#252542] to-[#1A1A2E] rounded-xl p-5 border border-[#C9943A]/20">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-[#C9943A] uppercase tracking-wider font-medium">AI Coach Insight</p>
                {feedback && (
                  <button
                    onClick={generateFeedback}
                    className="text-[#6B6B8D] hover:text-[#C9943A] transition-colors"
                    title="Refresh"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {!feedback && !loading && (
                <div className="text-center py-4">
                  <p className="text-[#6B6B8D] text-sm mb-4">
                    Get a personalized coaching message based on your performance data.
                  </p>
                  <Button
                    onClick={generateFeedback}
                    className="bg-[#C9943A] hover:bg-[#D4A94D] text-[#1A1A2E] text-sm h-9"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate My Feedback
                  </Button>
                </div>
              )}

              {loading && (
                <div className="flex items-center justify-center py-6 gap-3">
                  <Loader2 className="w-5 h-5 text-[#C9943A] animate-spin" />
                  <span className="text-[#6B6B8D] text-sm">Analyzing your sessions…</span>
                </div>
              )}

              {feedback && !loading && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <p className="text-[#E8E4DA] text-sm leading-relaxed mb-4">
                    {feedback.coaching_message}
                  </p>
                  {feedback.micro_scenario && (
                    <div className="bg-[#1A1A2E] rounded-lg p-4 border border-[#C9943A]/20">
                      <p className="text-xs text-[#C9943A] font-medium mb-1">Rehearse this moment:</p>
                      <p className="text-[#C5C1B8] text-sm italic">"{feedback.micro_scenario}"</p>
                    </div>
                  )}
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}