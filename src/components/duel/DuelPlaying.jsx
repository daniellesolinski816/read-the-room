import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mic2, Send, Loader2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';

export default function DuelPlaying({ room, myId, isHost, amResponder, onRefresh }) {
  const [response, setResponse] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [advancing, setAdvancing] = useState(false);

  const roundKey = room.round === 1 ? 'round1' : 'round2';
  const alreadySubmitted = !!(room[`${roundKey}_response`]);
  const myResponseSubmitted = alreadySubmitted && room[`${roundKey}_responder_id`] === myId;
  const scoreReady = alreadySubmitted && room[`${roundKey}_score`] != null;

  const responderName = room.players?.find(p => p.user_id === room.responder_id)?.display_name;
  const characterName = room.players?.find(p => p.user_id === room.character_id)?.display_name;

  const submitResponse = async () => {
    if (!response.trim()) return;
    setSubmitting(true);

    // AI eval
    const prompt = `You are an empathy coach. Evaluate this response to a scenario.

SCENARIO: "${room.scenario_prompt}"
RESPONSE: "${response}"

Score on four empathy markers (0-25 each):
1. Acknowledgment — recognizing the other's feelings
2. Curiosity — showing genuine interest or asking questions
3. Non-judgment — avoiding verdicts
4. Door Open — inviting continued dialogue

Return JSON with total (0-100) and one-sentence reflection.`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          acknowledgment: { type: 'number' },
          curiosity: { type: 'number' },
          nonjudgment: { type: 'number' },
          door_open: { type: 'number' },
          reflection: { type: 'string' },
        },
      },
    });

    const total = result.acknowledgment + result.curiosity + result.nonjudgment + result.door_open;

    await base44.entities.DuelRoom.update(room.id, {
      [`${roundKey}_response`]: response,
      [`${roundKey}_responder_id`]: myId,
      [`${roundKey}_score`]: total,
      [`${roundKey}_reflection`]: result.reflection,
    });

    onRefresh();
    setSubmitting(false);
  };

  const advanceToRound2 = async () => {
    setAdvancing(true);
    await base44.entities.DuelRoom.update(room.id, {
      status: 'switched',
      round: 2,
      responder_id: room.character_id,
      character_id: room.responder_id,
    });
    onRefresh();
    setAdvancing(false);
  };

  const goToFeedback = async () => {
    setAdvancing(true);
    await base44.entities.DuelRoom.update(room.id, { status: 'feedback' });
    onRefresh();
    setAdvancing(false);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Round badge */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-[#6B6B8D] uppercase tracking-wider">
          {room.status === 'switched' ? 'Round 2 — Roles Switched' : 'Round 1'}
        </span>
        <div className="flex gap-2">
          <div className={`w-2 h-2 rounded-full ${room.round >= 1 ? 'bg-[#C9943A]' : 'bg-[#2F2F4A]'}`} />
          <div className={`w-2 h-2 rounded-full ${room.round >= 2 ? 'bg-[#C9943A]' : 'bg-[#2F2F4A]'}`} />
        </div>
      </div>

      {/* Roles display */}
      <div className="grid grid-cols-2 gap-3">
        <div className={`rounded-xl p-4 border text-center ${!amResponder ? 'border-[#C9943A] bg-[#C9943A]/10' : 'border-[#2F2F4A] bg-[#252542]'}`}>
          <Mic2 className={`w-5 h-5 mx-auto mb-1 ${!amResponder ? 'text-[#C9943A]' : 'text-[#6B6B8D]'}`} />
          <p className="text-xs text-[#6B6B8D]">The Character</p>
          <p className="text-[#E8E4DA] text-sm font-medium">{characterName}</p>
          {myId === room.character_id && <p className="text-xs text-[#C9943A] mt-0.5">You</p>}
        </div>
        <div className={`rounded-xl p-4 border text-center ${amResponder ? 'border-[#C9943A] bg-[#C9943A]/10' : 'border-[#2F2F4A] bg-[#252542]'}`}>
          <Send className={`w-5 h-5 mx-auto mb-1 ${amResponder ? 'text-[#C9943A]' : 'text-[#6B6B8D]'}`} />
          <p className="text-xs text-[#6B6B8D]">The Responder</p>
          <p className="text-[#E8E4DA] text-sm font-medium">{responderName}</p>
          {amResponder && <p className="text-xs text-[#C9943A] mt-0.5">You</p>}
        </div>
      </div>

      {/* Scenario */}
      <div className="bg-[#252542] rounded-xl p-5 border border-[#2F2F4A]">
        <p className="text-xs text-[#C9943A] uppercase tracking-wider mb-2">{room.scenario_title}</p>
        <p className="text-[#E8E4DA] leading-relaxed">{room.scenario_prompt}</p>
      </div>

      {/* Responder input */}
      {amResponder && !alreadySubmitted && (
        <div className="space-y-3">
          <p className="text-sm text-[#C5C1B8]">How do you respond?</p>
          <textarea
            className="w-full bg-[#252542] border border-[#2F2F4A] rounded-xl p-4 text-[#E8E4DA] text-sm focus:outline-none focus:border-[#C9943A] resize-none"
            rows={5}
            value={response}
            onChange={e => setResponse(e.target.value)}
            placeholder="Write your empathic response…"
          />
          <Button
            onClick={submitResponse}
            disabled={submitting || !response.trim()}
            className="w-full bg-[#C9943A] hover:bg-[#D4A94D] text-[#1A1A2E]"
          >
            {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
            Submit Response
          </Button>
        </div>
      )}

      {/* Character waiting */}
      {!amResponder && !alreadySubmitted && (
        <div className="text-center py-8">
          <Loader2 className="w-8 h-8 text-[#C9943A] animate-spin mx-auto mb-3" />
          <p className="text-[#C5C1B8]">Waiting for {responderName} to respond…</p>
          <p className="text-[#6B6B8D] text-sm mt-1">You play the character in this round</p>
        </div>
      )}

      {/* Result shown after submission */}
      {alreadySubmitted && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="bg-[#252542] rounded-xl p-5 border border-[#C9943A]/30">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[#6B6B8D] text-sm">{responderName}'s response</span>
              {scoreReady && (
                <span className="text-2xl font-serif font-bold text-[#C9943A]">{room[`${roundKey}_score`]}<span className="text-sm text-[#6B6B8D]">/100</span></span>
              )}
            </div>
            <p className="text-[#E8E4DA] italic mb-3">"{room[`${roundKey}_response`]}"</p>
            {scoreReady && room[`${roundKey}_reflection`] && (
              <p className="text-sm text-[#6B6B8D] border-t border-[#2F2F4A] pt-3">{room[`${roundKey}_reflection`]}</p>
            )}
            {!scoreReady && (
              <div className="flex items-center gap-2 text-[#6B6B8D] text-sm">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Evaluating…
              </div>
            )}
          </div>

          {isHost && scoreReady && (
            room.round === 1 ? (
              <Button
                onClick={advanceToRound2}
                disabled={advancing}
                className="w-full bg-[#C9943A] hover:bg-[#D4A94D] text-[#1A1A2E]"
              >
                {advancing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Switch Roles → Round 2
              </Button>
            ) : (
              <Button
                onClick={goToFeedback}
                disabled={advancing}
                className="w-full bg-[#C9943A] hover:bg-[#D4A94D] text-[#1A1A2E]"
              >
                Give Peer Feedback
              </Button>
            )
          )}

          {!isHost && scoreReady && room.round === 1 && (
            <p className="text-center text-[#6B6B8D] text-sm">Waiting for host to continue…</p>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}