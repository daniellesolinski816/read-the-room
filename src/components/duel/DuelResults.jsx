import React from 'react';
import { motion } from 'framer-motion';
import { Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function DuelResults({ room, myId }) {
  const round1Score = room.round1_score || 0;
  const round2Score = room.round2_score || 0;
  const bothScores = [
    { responderId: room.round1_responder_id, score: round1Score, round: 1 },
    { responderId: room.round2_responder_id, score: round2Score, round: 2 },
  ];

  const myRound = bothScores.find(r => r.responderId === myId);
  const theirRound = bothScores.find(r => r.responderId !== myId);
  const theirName = room.players?.find(p => p.user_id !== myId)?.display_name;
  const winner = round1Score > round2Score ? room.round1_responder_id : round2Score > round1Score ? room.round2_responder_id : null;
  const iWon = winner === myId;
  const tied = winner === null;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 text-center">
      <div>
        <Trophy className="w-10 h-10 text-[#C9943A] mx-auto mb-3" />
        <h2 className="font-serif text-3xl text-[#E8E4DA]">Duel Complete</h2>
        <p className="text-[#6B6B8D] mt-1">
          {tied ? "It's a tie! Both equally empathic." : iWon ? "You edged it this round 🌟" : `${theirName} had the edge this time`}
        </p>
      </div>

      {/* Score cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className={`bg-[#252542] rounded-2xl p-5 border ${myRound?.responderId === winner ? 'border-[#C9943A]' : 'border-[#2F2F4A]'}`}>
          <p className="text-xs text-[#6B6B8D] mb-1">You</p>
          <p className="text-4xl font-serif font-bold text-[#C9943A]">{myRound?.score ?? '–'}</p>
          <p className="text-xs text-[#6B6B8D]">/100</p>
          <p className="text-xs text-[#C5C1B8] mt-1">Round {myRound?.round}</p>
        </div>
        <div className={`bg-[#252542] rounded-2xl p-5 border ${theirRound?.responderId === winner ? 'border-[#C9943A]' : 'border-[#2F2F4A]'}`}>
          <p className="text-xs text-[#6B6B8D] mb-1">{theirName}</p>
          <p className="text-4xl font-serif font-bold text-[#C9943A]">{theirRound?.score ?? '–'}</p>
          <p className="text-xs text-[#6B6B8D]">/100</p>
          <p className="text-xs text-[#C5C1B8] mt-1">Round {theirRound?.round}</p>
        </div>
      </div>

      {/* Peer feedback */}
      {(room.feedback_from_host || room.feedback_from_guest) && (
        <div className="space-y-3 text-left">
          <h3 className="font-serif text-lg text-[#E8E4DA]">What you said to each other</h3>
          {[
            { label: room.players?.[0]?.display_name, text: room.feedback_from_host },
            { label: room.players?.[1]?.display_name, text: room.feedback_from_guest },
          ].filter(f => f.text).map((f, i) => (
            <div key={i} className="bg-[#252542] rounded-xl p-4 border border-[#2F2F4A]">
              <p className="text-xs text-[#C9943A] mb-1">{f.label}</p>
              <p className="text-[#C5C1B8] text-sm italic">"{f.text}"</p>
            </div>
          ))}
        </div>
      )}

      <Link to={createPageUrl('Home')}>
        <Button className="bg-[#C9943A] hover:bg-[#D4A94D] text-[#1A1A2E] w-full h-12">
          Back to Home
        </Button>
      </Link>
    </motion.div>
  );
}