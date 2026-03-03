import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Play, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { base44 } from '@/api/base44Client';

export default function DuelWaiting({ room, myId, isHost, onRefresh }) {
  const [starting, setStarting] = useState(false);
  const otherPlayer = room.players?.find(p => p.user_id !== myId);

  const startDuel = async () => {
    setStarting(true);
    // Pick a random scenario
    const scenarios = await base44.entities.Scenario.list();
    const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];
    const players = room.players || [];
    // Host is the character (narrator), guest is the responder
    await base44.entities.DuelRoom.update(room.id, {
      status: 'playing',
      scenario_id: scenario.id,
      scenario_prompt: scenario.prompt,
      scenario_title: scenario.title,
      round: 1,
      responder_id: players[1]?.user_id,   // guest responds first
      character_id: players[0]?.user_id,   // host plays character first
    });
    onRefresh();
    setStarting(false);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <div className="text-center">
        <div className="w-14 h-14 rounded-full bg-[#C9943A]/20 flex items-center justify-center mx-auto mb-4">
          <Users className="w-7 h-7 text-[#C9943A]" />
        </div>
        <h2 className="font-serif text-2xl text-[#E8E4DA] mb-1">Empathy Duel</h2>
        <p className="text-[#6B6B8D] text-sm">One plays the character. One responds. Then you switch.</p>
      </div>

      <div className="bg-[#252542] rounded-xl p-5 border border-[#2F2F4A] space-y-3">
        {room.players?.map((p, i) => (
          <div key={p.user_id} className="flex items-center justify-between py-2 border-b border-[#1A1A2E] last:border-0">
            <span className="text-[#E8E4DA]">{p.display_name}</span>
            <div className="flex gap-2">
              {i === 0 && <Badge className="bg-[#C9943A]/20 text-[#C9943A] text-xs">Host</Badge>}
              {p.user_id === myId && <Badge className="bg-[#252542] border border-[#2F2F4A] text-[#C5C1B8] text-xs">You</Badge>}
            </div>
          </div>
        ))}
        {(!room.players || room.players.length < 2) && (
          <p className="text-[#6B6B8D] text-sm text-center py-2">Waiting for opponent to join…</p>
        )}
      </div>

      {isHost && room.players?.length >= 2 && (
        <Button
          onClick={startDuel}
          disabled={starting}
          className="w-full h-14 bg-[#C9943A] hover:bg-[#D4A94D] text-[#1A1A2E] text-lg font-serif"
        >
          {starting ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Play className="w-5 h-5 mr-2" />}
          Start Duel
        </Button>
      )}

      {!isHost && room.players?.length < 2 && (
        <p className="text-center text-[#6B6B8D] text-sm">Joined! Waiting for host to start…</p>
      )}
    </motion.div>
  );
}