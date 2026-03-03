import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Send, Loader2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';

export default function DuelFeedback({ room, myId, isHost, onRefresh }) {
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const feedbackField = isHost ? 'feedback_from_host' : 'feedback_from_guest';
  const alreadySubmitted = !!room[feedbackField];
  const bothSubmitted = !!(room.feedback_from_host && room.feedback_from_guest);

  const otherPlayer = room.players?.find(p => p.user_id !== myId);
  const otherFeedbackField = isHost ? 'feedback_from_guest' : 'feedback_from_host';
  const theirFeedback = room[otherFeedbackField];

  const submitFeedback = async () => {
    if (!feedback.trim()) return;
    setSubmitting(true);
    await base44.entities.DuelRoom.update(room.id, { [feedbackField]: feedback });

    // If both have submitted, mark complete
    const updated = await base44.entities.DuelRoom.filter({ id: room.id }).then(r => r[0]);
    if (updated.feedback_from_host && updated.feedback_from_guest) {
      await base44.entities.DuelRoom.update(room.id, { status: 'completed' });
    }
    onRefresh();
    setSubmitting(false);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="text-center">
        <div className="w-12 h-12 rounded-full bg-[#C9943A]/20 flex items-center justify-center mx-auto mb-3">
          <MessageSquare className="w-6 h-6 text-[#C9943A]" />
        </div>
        <h2 className="font-serif text-2xl text-[#E8E4DA]">Peer Feedback</h2>
        <p className="text-[#6B6B8D] text-sm mt-1">Share one honest, kind reflection with your partner</p>
      </div>

      {/* Round summaries */}
      <div className="space-y-3">
        {[1, 2].map(r => {
          const resp = room[`round${r}_response`];
          const score = room[`round${r}_score`];
          const responderId = room[`round${r}_responder_id`];
          const name = room.players?.find(p => p.user_id === responderId)?.display_name;
          const isMe = responderId === myId;
          if (!resp) return null;
          return (
            <div key={r} className={`bg-[#252542] rounded-xl p-4 border ${isMe ? 'border-[#C9943A]/40' : 'border-[#2F2F4A]'}`}>
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-[#6B6B8D]">Round {r} · {name}{isMe ? ' (You)' : ''}</span>
                <span className="font-serif text-[#C9943A] font-bold">{score}<span className="text-xs text-[#6B6B8D]">/100</span></span>
              </div>
              <p className="text-[#C5C1B8] text-sm italic">"{resp}"</p>
            </div>
          );
        })}
      </div>

      {/* Feedback form */}
      {!alreadySubmitted ? (
        <div className="space-y-3">
          <label className="text-sm text-[#C5C1B8]">
            Your feedback for {otherPlayer?.display_name}:
          </label>
          <textarea
            className="w-full bg-[#252542] border border-[#2F2F4A] rounded-xl p-4 text-[#E8E4DA] text-sm focus:outline-none focus:border-[#C9943A] resize-none"
            rows={4}
            value={feedback}
            onChange={e => setFeedback(e.target.value)}
            placeholder="What did they do well? What might deepen their empathy next time?"
          />
          <Button
            onClick={submitFeedback}
            disabled={submitting || !feedback.trim()}
            className="w-full bg-[#C9943A] hover:bg-[#D4A94D] text-[#1A1A2E]"
          >
            {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
            Send Feedback
          </Button>
        </div>
      ) : (
        <div className="bg-green-900/20 border border-green-600/30 rounded-xl p-4 flex items-center gap-3">
          <Check className="w-5 h-5 text-green-400 shrink-0" />
          <p className="text-green-300 text-sm">Feedback sent! Waiting for {otherPlayer?.display_name}…</p>
        </div>
      )}

      {/* Their feedback to you */}
      {theirFeedback && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-[#252542] rounded-xl p-5 border border-[#C9943A]/30">
          <p className="text-xs text-[#C9943A] uppercase tracking-wider mb-2">
            {otherPlayer?.display_name}'s feedback for you
          </p>
          <p className="text-[#E8E4DA] leading-relaxed">"{theirFeedback}"</p>
        </motion.div>
      )}

      {bothSubmitted && (
        <p className="text-center text-[#6B6B8D] text-sm">Loading final results…</p>
      )}
    </motion.div>
  );
}