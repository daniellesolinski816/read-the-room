import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Copy, Check, Users, Play, Loader2, Vote, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Logo from '@/components/brand/Logo';
import ScenarioCard from '@/components/game/ScenarioCard';
import Timer from '@/components/game/Timer';
import ResponseInput from '@/components/game/ResponseInput';
import EmpathyScore from '@/components/game/EmpathyScore';
import GenerateScenario from '@/components/game/GenerateScenario';

export default function Room() {
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const roomId = urlParams.get('roomId');
  const playerIdFromUrl = urlParams.get('playerId');
  
  const [user, setUser] = useState(null);
  const [copied, setCopied] = useState(false);
  const [response, setResponse] = useState('');
  const [selectedVote, setSelectedVote] = useState(null);
  const [currentPlayerId, setCurrentPlayerId] = useState(playerIdFromUrl);
  const [aiScenario, setAiScenario] = useState(null);
  const [hostProfile, setHostProfile] = useState(null);

  useEffect(() => {
    if (room?.host_id) {
      base44.entities.UserProfile.filter({ user_id: room.host_id }).then(p => setHostProfile(p[0] || null));
    }
  }, [room?.host_id]);

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      if (!playerIdFromUrl) setCurrentPlayerId(u.email);
    }).catch(() => {});
  }, [playerIdFromUrl]);

  const { data: room, isLoading: loadingRoom } = useQuery({
    queryKey: ['room', roomId],
    queryFn: () => base44.entities.MultiplayerRoom.filter({ id: roomId }).then(r => r[0]),
    enabled: !!roomId,
    refetchInterval: 2000
  });

  const { data: currentScenario } = useQuery({
    queryKey: ['scenario', room?.current_scenario_id],
    queryFn: () => base44.entities.Scenario.filter({ id: room.current_scenario_id }).then(s => s[0]),
    enabled: !!room?.current_scenario_id
  });

  const { data: roundResponses = [] } = useQuery({
    queryKey: ['responses', roomId, room?.current_scenario_index],
    queryFn: () => base44.entities.MultiplayerResponse.filter({ 
      room_id: roomId, 
      round_index: room.current_scenario_index 
    }),
    enabled: !!roomId && room?.status !== 'waiting',
    refetchInterval: 2000
  });

  const isHost = room?.host_id === (user?.email || currentPlayerId);
  const currentPlayer = room?.players?.find(p => p.user_id === currentPlayerId || p.user_id === user?.email);
  const hasSubmitted = roundResponses.some(r => r.user_id === currentPlayerId || r.user_id === user?.email);
  const allSubmitted = room?.players?.length === roundResponses.length;
  const hasVoted = selectedVote !== null;
  const allVoted = roundResponses.every(r => r.votes_received?.length === room?.players?.length);

  const copyCode = () => {
    navigator.clipboard.writeText(room?.room_code || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const startGame = useMutation({
    mutationFn: async () => {
      await base44.entities.MultiplayerRoom.update(room.id, {
        status: 'playing',
        current_scenario_id: room.scenario_ids[0],
        round_start_time: new Date().toISOString()
      });
    },
    onSuccess: () => queryClient.invalidateQueries(['room', roomId])
  });

  const submitResponse = useMutation({
    mutationFn: async () => {
      const letters = 'ABCDEF';
      const anonymousId = letters[roundResponses.length];
      
      await base44.entities.MultiplayerResponse.create({
        room_id: roomId,
        scenario_id: room.current_scenario_id,
        user_id: currentPlayerId || user?.email,
        response: response,
        anonymous_id: anonymousId,
        votes_received: [],
        round_index: room.current_scenario_index
      });

      if (roundResponses.length + 1 === room.players.length) {
        await base44.entities.MultiplayerRoom.update(room.id, { status: 'voting' });
      }
    },
    onSuccess: () => {
      setResponse('');
      queryClient.invalidateQueries(['responses', roomId]);
      queryClient.invalidateQueries(['room', roomId]);
    }
  });

  const submitVote = useMutation({
    mutationFn: async (responseId) => {
      const responseToVote = roundResponses.find(r => r.id === responseId);
      const voterId = currentPlayerId || user?.email;
      
      await base44.entities.MultiplayerResponse.update(responseId, {
        votes_received: [...(responseToVote.votes_received || []), voterId]
      });

      // Check if all votes are in
      const updatedResponses = await base44.entities.MultiplayerResponse.filter({
        room_id: roomId,
        round_index: room.current_scenario_index
      });
      
      const totalVotes = updatedResponses.reduce((sum, r) => sum + (r.votes_received?.length || 0), 0);
      if (totalVotes === room.players.length) {
        await base44.entities.MultiplayerRoom.update(room.id, { status: 'revealing' });
        
        // AI evaluation for all responses
        for (const resp of updatedResponses) {
          const prompt = `You are an empathy coach evaluating a player's response to a charged real-world scenario.

SCENARIO: "${currentScenario.prompt}"
RESPONSE: "${resp.response}"

Evaluate across four markers (0-25 each):
1. Acknowledgment — did they recognize the other person's position or feelings?
2. Curiosity — did they ask a question or show genuine interest?
3. Non-judgment — did they avoid closing with a verdict?
4. Door Open — does the response invite continued conversation?

Return JSON: {"acknowledgment": <0-25>, "curiosity": <0-25>, "nonjudgment": <0-25>, "door_open": <0-25>, "reflection": "<brief feedback>"}`;

          const result = await base44.integrations.Core.InvokeLLM({
            prompt,
            response_json_schema: {
              type: "object",
              properties: {
                acknowledgment: { type: "number" },
                curiosity: { type: "number" },
                nonjudgment: { type: "number" },
                door_open: { type: "number" },
                reflection: { type: "string" }
              }
            }
          });

          await base44.entities.MultiplayerResponse.update(resp.id, {
            score_acknowledgment: result.acknowledgment,
            score_curiosity: result.curiosity,
            score_nonjudgment: result.nonjudgment,
            score_door_open: result.door_open,
            total_score: result.acknowledgment + result.curiosity + result.nonjudgment + result.door_open,
            ai_reflection: result.reflection
          });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['responses', roomId]);
      queryClient.invalidateQueries(['room', roomId]);
    }
  });

  const nextRound = useMutation({
    mutationFn: async () => {
      const nextIndex = room.current_scenario_index + 1;
      if (nextIndex >= 5) {
        // Game complete
        const allResponses = await base44.entities.MultiplayerResponse.filter({ room_id: roomId });
        const avgScore = allResponses.reduce((sum, r) => sum + (r.total_score || 0), 0) / allResponses.length;
        
        await base44.entities.MultiplayerRoom.update(room.id, {
          status: 'completed',
          group_empathy_score: avgScore
        });
      } else {
        await base44.entities.MultiplayerRoom.update(room.id, {
          status: 'playing',
          current_scenario_index: nextIndex,
          current_scenario_id: room.scenario_ids[nextIndex],
          round_start_time: new Date().toISOString()
        });
      }
    },
    onSuccess: () => {
      setSelectedVote(null);
      queryClient.invalidateQueries(['room', roomId]);
      queryClient.invalidateQueries(['responses', roomId]);
    }
  });

  if (loadingRoom) {
    return (
      <div className="min-h-screen bg-[#1A1A2E] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#C9943A] animate-spin" />
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen bg-[#1A1A2E] flex items-center justify-center">
        <p className="text-[#C5C1B8]">Room not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1A1A2E]">
      <header className="p-4 flex items-center justify-between border-b border-[#2F2F4A]">
        <Link to={createPageUrl('Multiplayer')}>
          <Button variant="ghost" size="icon" className="text-[#C5C1B8] hover:text-[#C9943A]">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <Logo size="small" />
        <Button
          variant="ghost"
          size="sm"
          onClick={copyCode}
          className="text-[#C9943A] hover:bg-[#C9943A]/10 font-mono"
        >
          {copied ? <Check className="w-4 h-4 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
          {room.room_code}
        </Button>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* Waiting Room */}
        {room.status === 'waiting' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
            <div className="text-center">
              <h2 className="font-serif text-2xl text-[#E8E4DA] mb-2">Waiting Room</h2>
              <p className="text-[#6B6B8D]">Share the code above to invite players</p>
            </div>

            <div className="bg-[#252542] rounded-xl p-6 border border-[#2F2F4A]">
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-5 h-5 text-[#C9943A]" />
                <span className="text-[#E8E4DA] font-medium">Players ({room.players.length}/6)</span>
              </div>
              <div className="space-y-2">
                {room.players.map((player, i) => (
                  <div key={player.user_id} className="flex items-center justify-between py-2 border-b border-[#2F2F4A] last:border-0">
                    <span className="text-[#E8E4DA]">{player.display_name}</span>
                    {i === 0 && <Badge className="bg-[#C9943A]/20 text-[#C9943A]">Host</Badge>}
                  </div>
                ))}
              </div>
            </div>

            {isHost && room.players.length >= 2 && (
              <Button
                onClick={() => startGame.mutate()}
                disabled={startGame.isPending}
                className="w-full h-14 bg-[#C9943A] hover:bg-[#D4A94D] text-[#1A1A2E] text-lg font-serif"
              >
                <Play className="w-5 h-5 mr-2" />
                Start Game
              </Button>
            )}

            {room.players.length < 2 && (
              <p className="text-center text-[#6B6B8D]">Need at least 2 players to start</p>
            )}
          </motion.div>
        )}

        {/* Playing Phase */}
        {room.status === 'playing' && currentScenario && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="flex items-center justify-between">
              <span className="text-[#6B6B8D]">Round {room.current_scenario_index + 1} of 5</span>
              <div className="flex items-center gap-3">
                {isHost && (
                  <GenerateScenario
                    isPremium={hostProfile?.is_premium}
                    onScenarioGenerated={(s) => setAiScenario(s)}
                  />
                )}
                <Timer duration={60} isRunning={!hasSubmitted} />
              </div>
            </div>

            <ScenarioCard scenario={aiScenario || currentScenario} />

            {!hasSubmitted ? (
              <ResponseInput
                value={response}
                onChange={setResponse}
                onSubmit={() => submitResponse.mutate()}
                disabled={submitResponse.isPending}
              />
            ) : (
              <div className="text-center py-8">
                <Check className="w-12 h-12 text-[#C9943A] mx-auto mb-4" />
                <p className="text-[#E8E4DA] font-serif text-lg">Response submitted!</p>
                <p className="text-[#6B6B8D] text-sm mt-2">
                  Waiting for {room.players.length - roundResponses.length} more player(s)...
                </p>
              </div>
            )}
          </motion.div>
        )}

        {/* Voting Phase */}
        {room.status === 'voting' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="text-center">
              <Vote className="w-10 h-10 text-[#C9943A] mx-auto mb-3" />
              <h2 className="font-serif text-2xl text-[#E8E4DA]">Vote for Empathy</h2>
              <p className="text-[#6B6B8D]">Which response shows the most empathy?</p>
            </div>

            <div className="space-y-4">
              {roundResponses.map((resp) => (
                <button
                  key={resp.id}
                  onClick={() => {
                    if (!hasVoted && resp.user_id !== (currentPlayerId || user?.email)) {
                      setSelectedVote(resp.id);
                      submitVote.mutate(resp.id);
                    }
                  }}
                  disabled={hasVoted || resp.user_id === (currentPlayerId || user?.email)}
                  className={`w-full text-left p-5 rounded-xl border transition-all ${
                    selectedVote === resp.id 
                      ? 'bg-[#C9943A]/20 border-[#C9943A]' 
                      : 'bg-[#252542] border-[#2F2F4A] hover:border-[#C9943A]/50'
                  } ${resp.user_id === (currentPlayerId || user?.email) ? 'opacity-50' : ''}`}
                >
                  <div className="flex items-start gap-3">
                    <span className="w-8 h-8 rounded-full bg-[#1A1A2E] flex items-center justify-center text-[#C9943A] font-mono font-bold">
                      {resp.anonymous_id}
                    </span>
                    <p className="text-[#E8E4DA] italic flex-1">"{resp.response}"</p>
                  </div>
                </button>
              ))}
            </div>

            {hasVoted && (
              <p className="text-center text-[#6B6B8D]">
                Waiting for others to vote...
              </p>
            )}
          </motion.div>
        )}

        {/* Revealing Phase */}
        {room.status === 'revealing' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="font-serif text-2xl text-[#E8E4DA]">The Results</h2>
            </div>

            <div className="space-y-6">
              {roundResponses
                .sort((a, b) => (b.total_score || 0) - (a.total_score || 0))
                .map((resp, i) => {
                  const isOwn = resp.user_id === (currentPlayerId || user?.email);
                  const player = room.players.find(p => p.user_id === resp.user_id);
                  
                  return (
                    <motion.div
                      key={resp.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.2 }}
                      className={`bg-[#252542] rounded-xl p-5 border ${isOwn ? 'border-[#C9943A]' : 'border-[#2F2F4A]'}`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="w-8 h-8 rounded-full bg-[#1A1A2E] flex items-center justify-center text-[#C9943A] font-mono font-bold">
                            {resp.anonymous_id}
                          </span>
                          <span className="text-[#C5C1B8] text-sm">{player?.display_name}</span>
                          {isOwn && <Badge className="bg-[#C9943A]/20 text-[#C9943A]">You</Badge>}
                        </div>
                        <div className="text-right">
                          <span className="text-3xl font-serif font-bold text-[#C9943A]">{resp.total_score}</span>
                          <span className="text-[#6B6B8D]">/100</span>
                        </div>
                      </div>
                      
                      <p className="text-[#E8E4DA] italic mb-3">"{resp.response}"</p>
                      
                      {resp.ai_reflection && (
                        <p className="text-sm text-[#6B6B8D] border-t border-[#2F2F4A] pt-3 mt-3">
                          {resp.ai_reflection}
                        </p>
                      )}

                      <div className="flex items-center gap-1 mt-2">
                        <span className="text-xs text-[#6B6B8D]">Votes received:</span>
                        <span className="text-xs text-[#C9943A] font-medium">{resp.votes_received?.length || 0}</span>
                      </div>
                    </motion.div>
                  );
                })}
            </div>

            <div className="bg-[#1A1A2E] rounded-xl p-5 border border-[#C9943A]/30">
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare className="w-4 h-4 text-[#C9943A]" />
                <span className="text-[#C9943A] font-medium">Discussion</span>
              </div>
              <p className="text-[#E8E4DA] font-serif italic">
                "Which response surprised you most and why?"
              </p>
            </div>

            {isHost && (
              <Button
                onClick={() => nextRound.mutate()}
                disabled={nextRound.isPending}
                className="w-full h-12 bg-[#C9943A] hover:bg-[#D4A94D] text-[#1A1A2E]"
              >
                {room.current_scenario_index >= 4 ? 'See Final Results' : 'Next Round'}
              </Button>
            )}
          </motion.div>
        )}

        {/* Game Complete */}
        {room.status === 'completed' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center space-y-8">
            <div>
              <h2 className="font-serif text-3xl text-[#E8E4DA] mb-2">Game Complete!</h2>
              <p className="text-[#6B6B8D]">5 scenarios explored together</p>
            </div>

            <div className="bg-gradient-to-br from-[#252542] to-[#1A1A2E] rounded-2xl p-8 border border-[#C9943A]/30">
              <p className="text-[#6B6B8D] mb-2">Group Empathy Score</p>
              <span className="text-6xl font-serif font-bold text-[#C9943A]">
                {Math.round(room.group_empathy_score || 0)}
              </span>
              <span className="text-2xl text-[#6B6B8D] font-serif">/100</span>
            </div>

            <Link to={createPageUrl('Home')}>
              <Button className="bg-[#C9943A] hover:bg-[#D4A94D] text-[#1A1A2E]">
                Back to Home
              </Button>
            </Link>
          </motion.div>
        )}
      </main>
    </div>
  );
}