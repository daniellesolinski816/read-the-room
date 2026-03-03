import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Copy, Check, Loader2, Users, Play, Mic2, MessageSquare, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Logo from '@/components/brand/Logo';
import DuelWaiting from '@/components/duel/DuelWaiting';
import DuelPlaying from '@/components/duel/DuelPlaying';
import DuelResults from '@/components/duel/DuelResults';
import DuelFeedback from '@/components/duel/DuelFeedback';

export default function Duel() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const roomId = urlParams.get('roomId');
  const playerIdFromUrl = urlParams.get('playerId');

  const [user, setUser] = useState(null);
  const [copied, setCopied] = useState(false);
  const qc = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const myId = playerIdFromUrl || user?.email;

  const { data: room, isLoading } = useQuery({
    queryKey: ['duelRoom', roomId],
    queryFn: () => base44.entities.DuelRoom.filter({ id: roomId }).then(r => r[0]),
    enabled: !!roomId,
    refetchInterval: 2000,
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ['duelRoom', roomId] });

  const copyCode = () => {
    navigator.clipboard.writeText(room?.room_code || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading || !room) {
    return (
      <div className="min-h-screen bg-[#1A1A2E] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#C9943A] animate-spin" />
      </div>
    );
  }

  const isHost = room.host_id === myId;
  const amResponder = room.responder_id === myId;

  return (
    <div className="min-h-screen bg-[#1A1A2E]">
      <header className="p-4 flex items-center justify-between border-b border-[#2F2F4A]">
        <Link to={createPageUrl('Multiplayer')}>
          <Button variant="ghost" size="icon" className="text-[#C5C1B8] hover:text-[#C9943A]">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <Logo size="small" />
        <Button variant="ghost" size="sm" onClick={copyCode} className="text-[#C9943A] hover:bg-[#C9943A]/10 font-mono">
          {copied ? <Check className="w-4 h-4 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
          {room.room_code}
        </Button>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6">
        <AnimatePresence mode="wait">
          {room.status === 'waiting' && (
            <DuelWaiting key="waiting" room={room} myId={myId} isHost={isHost} onRefresh={refresh} />
          )}
          {(room.status === 'playing' || room.status === 'switched') && (
            <DuelPlaying key="playing" room={room} myId={myId} isHost={isHost} amResponder={amResponder} onRefresh={refresh} />
          )}
          {room.status === 'feedback' && (
            <DuelFeedback key="feedback" room={room} myId={myId} isHost={isHost} onRefresh={refresh} />
          )}
          {room.status === 'completed' && (
            <DuelResults key="results" room={room} myId={myId} />
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}