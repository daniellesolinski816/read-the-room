import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Users, Copy, Check, ArrowLeft, Send, Loader2, Star, RefreshCw, Heart } from 'lucide-react';

const POLL_INTERVAL = 2500;

function generateCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// ── Lobby (host waits, guest joins) ─────────────────────────────────────────
function Lobby({ room, user, profile, onRoomUpdated }) {
  const [copied, setCopied] = useState(false);
  const isHost = room.host_id === user?.email;

  const copy = () => {
    navigator.clipboard.writeText(room.room_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Guest: poll until scenario is set
  useEffect(() => {
    if (isHost) return;
    const id = setInterval(async () => {
      const updated = (await base44.entities.DuoRoom.filter({ room_code: room.room_code }))[0];
      if (updated) onRoomUpdated(updated);
    }, POLL_INTERVAL);
    return () => clearInterval(id);
  }, [isHost, room.room_code]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#1A1A2E] px-6 text-center">
      <div className="w-full max-w-sm space-y-6">
        <div>
          <div className="text-4xl mb-3">🤝</div>
          <h1 className="text-2xl font-serif text-[#E8E4DA]">Duo Mode</h1>
          <p className="text-sm text-[#C5C1B8] mt-1">Co-create one empathic response together</p>
        </div>

        <div className="bg-[#252542] border border-[#2F2F4A] rounded-2xl p-6 space-y-4">
          <p className="text-xs uppercase tracking-widest text-[#6B6B8D]">Room Code</p>
          <div className="flex items-center justify-center gap-3">
            <span className="text-4xl font-mono font-bold tracking-widest text-[#C9943A]">{room.room_code}</span>
            <button onClick={copy} className="text-[#6B6B8D] hover:text-[#C9943A] transition-colors">
              {copied ? <Check className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5" />}
            </button>
          </div>

          <div className="space-y-2 pt-2">
            <PlayerSlot name={room.host_name} label="You" filled />
            <PlayerSlot name={room.guest_name} label="Partner" filled={!!room.guest_name} />
          </div>
        </div>

        {isHost && !room.guest_id && (
          <p className="text-sm text-[#6B6B8D] animate-pulse">Waiting for your partner to join…</p>
        )}
        {isHost && room.guest_id && room.status === 'waiting' && (
          <StartButton room={room} onRoomUpdated={onRoomUpdated} />
        )}
        {!isHost && (
          <p className="text-sm text-[#6B6B8D] animate-pulse">Waiting for host to start the game…</p>
        )}

        <Link to={createPageUrl('Home')} className="block">
          <Button variant="ghost" size="sm" className="text-[#6B6B8D]">
            <ArrowLeft className="w-4 h-4 mr-1" /> Leave
          </Button>
        </Link>
      </div>
    </div>
  );
}

function PlayerSlot({ name, label, filled }) {
  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl border ${filled ? 'border-[#C9943A]/40 bg-[#C9943A]/5' : 'border-[#2F2F4A] bg-transparent'}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${filled ? 'bg-[#C9943A] text-[#1A1A2E]' : 'bg-[#2F2F4A] text-[#6B6B8D]'}`}>
        {filled ? (name?.[0]?.toUpperCase() || '?') : '?'}
      </div>
      <div className="text-left">
        <p className="text-xs text-[#6B6B8D]">{label}</p>
        <p className={`text-sm font-medium ${filled ? 'text-[#E8E4DA]' : 'text-[#2F2F4A]'}`}>{filled ? name : 'Not joined'}</p>
      </div>
    </div>
  );
}

function StartButton({ room, onRoomUpdated }) {
  const [loading, setLoading] = useState(false);

  const start = async () => {
    setLoading(true);
    const scenarios = await base44.entities.Scenario.list();
    const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];
    const updated = await base44.entities.DuoRoom.update(room.id, {
      status: 'playing',
      scenario_id: scenario.id,
      scenario_title: scenario.title,
      scenario_prompt: scenario.prompt,
    });
    onRoomUpdated({ ...room, ...updated, status: 'playing', scenario_id: scenario.id, scenario_title: scenario.title, scenario_prompt: scenario.prompt });
    setLoading(false);
  };

  return (
    <Button onClick={start} disabled={loading} className="w-full h-12 bg-[#C9943A] text-[#1A1A2E] font-serif font-semibold rounded-xl">
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Start Game →'}
    </Button>
  );
}

// ── Playing ──────────────────────────────────────────────────────────────────
function Playing({ room, user, onRoomUpdated }) {
  const [messages, setMessages] = useState(room.messages || []);
  const [draft, setDraft] = useState('');
  const [finalDraft, setFinalDraft] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showFinal, setShowFinal] = useState(false);
  const bottomRef = useRef(null);
  const isHost = room.host_id === user?.email;
  const myName = isHost ? room.host_name : room.guest_name;

  // Real-time poll for new messages
  useEffect(() => {
    const id = setInterval(async () => {
      const updated = (await base44.entities.DuoRoom.filter({ room_code: room.room_code }))[0];
      if (!updated) return;
      setMessages(updated.messages || []);
      if (updated.status !== 'playing') onRoomUpdated(updated);
    }, POLL_INTERVAL);
    return () => clearInterval(id);
  }, [room.room_code]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!draft.trim()) return;
    const msg = { sender_id: user.email, sender_name: myName, text: draft.trim(), timestamp: new Date().toISOString() };
    const newMessages = [...messages, msg];
    setMessages(newMessages);
    setDraft('');
    await base44.entities.DuoRoom.update(room.id, { messages: newMessages });
  };

  const submitFinal = async () => {
    if (!finalDraft.trim()) return;
    setSubmitting(true);
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are evaluating a co-written empathy response to the following scenario:

SCENARIO: ${room.scenario_prompt}

RESPONSE: ${finalDraft}

Score the response on four markers, each 0-25:
1. Acknowledgment: Does it recognize the other person's feelings?
2. Curiosity: Does it ask or show genuine interest?
3. Non-judgment: Does it avoid blame or criticism?
4. Door Open: Does it invite further connection?

Also write a 2-3 sentence reflection on the team's collaborative response.
Mention that this was a DUO effort.`,
      response_json_schema: {
        type: 'object',
        properties: {
          score_acknowledgment: { type: 'number' },
          score_curiosity: { type: 'number' },
          score_nonjudgment: { type: 'number' },
          score_door_open: { type: 'number' },
          ai_reflection: { type: 'string' }
        }
      }
    });
    const { score_acknowledgment, score_curiosity, score_nonjudgment, score_door_open, ai_reflection } = result;
    const total_score = (score_acknowledgment + score_curiosity + score_nonjudgment + score_door_open);
    const updatedRoom = {
      status: 'completed',
      final_response: finalDraft,
      score_acknowledgment, score_curiosity, score_nonjudgment, score_door_open,
      total_score, ai_reflection
    };
    await base44.entities.DuoRoom.update(room.id, updatedRoom);
    onRoomUpdated({ ...room, ...updatedRoom });
    setSubmitting(false);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#1A1A2E]">
      {/* Scenario header */}
      <div className="bg-[#252542] border-b border-[#2F2F4A] p-4">
        <p className="text-xs uppercase tracking-widest text-[#C9943A] mb-1">{room.scenario_title}</p>
        <p className="text-sm text-[#C5C1B8] leading-relaxed">{room.scenario_prompt}</p>
      </div>

      {/* Chat */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <p className="text-xs text-[#6B6B8D] text-center mb-4">💬 Discuss the scenario, then craft your final response together</p>
        {messages.map((msg, i) => {
          const isMe = msg.sender_id === user?.email;
          return (
            <div key={i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${isMe ? 'bg-[#C9943A] text-[#1A1A2E]' : 'bg-[#252542] text-[#E8E4DA] border border-[#2F2F4A]'}`}>
                {!isMe && <p className="text-[10px] font-semibold text-[#C9943A] mb-1">{msg.sender_name}</p>}
                <p className="text-sm">{msg.text}</p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Chat input */}
      <div className="border-t border-[#2F2F4A] p-3 bg-[#1A1A2E]">
        <div className="flex gap-2 mb-3">
          <input
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            placeholder="Chat with your partner…"
            className="flex-1 bg-[#252542] border border-[#2F2F4A] rounded-xl px-4 py-2.5 text-sm text-[#E8E4DA] placeholder-[#6B6B8D] outline-none focus:border-[#C9943A]/50"
          />
          <Button onClick={sendMessage} size="icon" className="bg-[#252542] border border-[#2F2F4A] text-[#C9943A] hover:bg-[#2F2F4A] shrink-0">
            <Send className="w-4 h-4" />
          </Button>
        </div>

        <Button
          onClick={() => setShowFinal(true)}
          className="w-full h-11 bg-[#C9943A] text-[#1A1A2E] font-serif font-semibold rounded-xl text-sm"
        >
          ✍️ Write Final Response Together
        </Button>
      </div>

      {/* Final response modal */}
      <AnimatePresence>
        {showFinal && (
          <motion.div
            className="fixed inset-0 bg-black/70 flex items-end justify-center z-50 p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-full max-w-sm bg-[#1A1A2E] border border-[#C9943A]/40 rounded-2xl p-5 space-y-4"
              initial={{ y: 60 }} animate={{ y: 0 }} exit={{ y: 60 }}
            >
              <div>
                <h2 className="font-serif text-lg text-[#E8E4DA]">Your Combined Response</h2>
                <p className="text-xs text-[#6B6B8D] mt-0.5">Write the best empathic response you two can craft together</p>
              </div>
              <textarea
                value={finalDraft}
                onChange={e => setFinalDraft(e.target.value)}
                placeholder="Type your final shared response…"
                rows={5}
                className="w-full bg-[#252542] border border-[#2F2F4A] rounded-xl px-4 py-3 text-sm text-[#E8E4DA] placeholder-[#6B6B8D] outline-none focus:border-[#C9943A]/50 resize-none"
              />
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => setShowFinal(false)} className="flex-1 text-[#6B6B8D]">Back to Chat</Button>
                <Button onClick={submitFinal} disabled={submitting || !finalDraft.trim()} className="flex-1 bg-[#C9943A] text-[#1A1A2E] font-semibold">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit & Score'}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Results ──────────────────────────────────────────────────────────────────
function Results({ room }) {
  const markers = [
    { key: 'score_acknowledgment', label: 'Acknowledgment', emoji: '🤲' },
    { key: 'score_curiosity', label: 'Curiosity', emoji: '🔍' },
    { key: 'score_nonjudgment', label: 'Non-judgment', emoji: '⚖️' },
    { key: 'score_door_open', label: 'Door Open', emoji: '🚪' },
  ];

  const pct = Math.round((room.total_score / 100) * 100);
  const color = room.total_score >= 75 ? '#4ade80' : room.total_score >= 50 ? '#C9943A' : '#f87171';

  return (
    <div className="min-h-screen bg-[#1A1A2E] flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <div className="text-5xl mb-3">🤝</div>
          <h1 className="text-2xl font-serif text-[#E8E4DA]">Duo Score</h1>
          <p className="text-sm text-[#6B6B8D]">{room.host_name} & {room.guest_name}</p>
        </div>

        {/* Big score */}
        <motion.div
          className="flex flex-col items-center justify-center h-36 rounded-2xl border-2 bg-[#252542]"
          style={{ borderColor: color }}
          initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2 }}
        >
          <span className="text-6xl font-bold" style={{ color }}>{room.total_score}</span>
          <span className="text-xs text-[#6B6B8D] mt-1">/ 100 Combined Empathy</span>
        </motion.div>

        {/* Marker breakdown */}
        <div className="bg-[#252542] border border-[#2F2F4A] rounded-2xl p-4 space-y-3">
          {markers.map(({ key, label, emoji }) => (
            <div key={key}>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-[#C5C1B8]">{emoji} {label}</span>
                <span className="text-[#C9943A] font-semibold">{room[key]}/25</span>
              </div>
              <div className="h-1.5 bg-[#1A1A2E] rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-[#C9943A]"
                  initial={{ width: 0 }}
                  animate={{ width: `${(room[key] / 25) * 100}%` }}
                  transition={{ delay: 0.4, duration: 0.6 }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Final response */}
        <div className="bg-[#252542] border border-[#2F2F4A] rounded-2xl p-4">
          <p className="text-xs uppercase tracking-widest text-[#6B6B8D] mb-2">Your Combined Response</p>
          <p className="text-sm text-[#C5C1B8] italic leading-relaxed">"{room.final_response}"</p>
        </div>

        {/* AI Reflection */}
        {room.ai_reflection && (
          <div className="bg-[#C9943A]/10 border border-[#C9943A]/30 rounded-2xl p-4">
            <p className="text-xs uppercase tracking-widest text-[#C9943A] mb-2 flex items-center gap-1.5"><Star className="w-3 h-3" /> AI Reflection</p>
            <p className="text-sm text-[#E8E4DA] leading-relaxed">{room.ai_reflection}</p>
          </div>
        )}

        <div className="flex gap-3">
          <Link to={createPageUrl('DuoMode')} className="flex-1">
            <Button variant="outline" className="w-full border-[#2F2F4A] text-[#C5C1B8]">
              <RefreshCw className="w-4 h-4 mr-2" /> Play Again
            </Button>
          </Link>
          <Link to={createPageUrl('Home')} className="flex-1">
            <Button className="w-full bg-[#C9943A] text-[#1A1A2E] font-semibold">Home</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function DuoMode() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [room, setRoom] = useState(null);
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      base44.entities.UserProfile.filter({ user_id: u.email }).then(p => setProfile(p[0] || null));
    }).catch(() => {});
  }, []);

  const myName = profile?.display_name || user?.full_name || 'Player';

  const hostRoom = async () => {
    setLoading(true);
    setError('');
    const code = generateCode();
    const created = await base44.entities.DuoRoom.create({
      room_code: code,
      host_id: user.email,
      host_name: myName,
      status: 'waiting',
      messages: [],
    });
    // Poll until guest joins
    const newRoom = { ...created, room_code: code, host_id: user.email, host_name: myName, status: 'waiting', messages: [] };
    setRoom(newRoom);
    setLoading(false);

    // Poll for guest
    const pollId = setInterval(async () => {
      const updated = (await base44.entities.DuoRoom.filter({ room_code: code }))[0];
      if (updated) setRoom(updated);
      if (updated?.status !== 'waiting') clearInterval(pollId);
    }, POLL_INTERVAL);
  };

  const joinRoom = async () => {
    const code = joinCode.trim().toUpperCase();
    if (!code) return;
    setLoading(true);
    setError('');
    const rooms = await base44.entities.DuoRoom.filter({ room_code: code });
    if (!rooms.length || rooms[0].status !== 'waiting') {
      setError('Room not found or already started.');
      setLoading(false);
      return;
    }
    const existing = rooms[0];
    if (existing.host_id === user.email) {
      setError('You cannot join your own room.');
      setLoading(false);
      return;
    }
    const updated = await base44.entities.DuoRoom.update(existing.id, {
      guest_id: user.email,
      guest_name: myName,
    });
    setRoom({ ...existing, ...updated, guest_id: user.email, guest_name: myName });
    setLoading(false);
  };

  // Route based on room status
  if (room) {
    if (room.status === 'completed') return <Results room={room} />;
    if (room.status === 'playing') return <Playing room={room} user={user} onRoomUpdated={setRoom} />;
    return <Lobby room={room} user={user} profile={profile} onRoomUpdated={setRoom} />;
  }

  // Entry screen
  return (
    <div className="min-h-screen bg-[#1A1A2E] flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <div className="text-5xl mb-3">🤝</div>
          <h1 className="text-3xl font-serif text-[#E8E4DA]">Duo Mode</h1>
          <p className="text-[#C5C1B8] text-sm mt-2 leading-relaxed">
            Two players. One scenario. One shared empathic response.<br />
            Discuss, collaborate, and be scored together.
          </p>
        </div>

        <div className="space-y-3">
          <Button
            onClick={hostRoom}
            disabled={loading || !user}
            className="w-full h-14 bg-[#C9943A] hover:bg-[#D4A94D] text-[#1A1A2E] text-base font-serif font-semibold rounded-xl"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Heart className="w-5 h-5 mr-2" /> Create Room</>}
          </Button>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-[#2F2F4A]" />
            <span className="text-xs text-[#6B6B8D]">or join</span>
            <div className="flex-1 h-px bg-[#2F2F4A]" />
          </div>

          <div className="flex gap-2">
            <input
              value={joinCode}
              onChange={e => setJoinCode(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && joinRoom()}
              placeholder="Enter room code"
              maxLength={6}
              className="flex-1 bg-[#252542] border border-[#2F2F4A] rounded-xl px-4 py-3 text-sm text-[#E8E4DA] placeholder-[#6B6B8D] outline-none focus:border-[#C9943A]/50 font-mono tracking-widest text-center uppercase"
            />
            <Button
              onClick={joinRoom}
              disabled={loading || !joinCode.trim() || !user}
              className="bg-[#252542] border border-[#C9943A]/40 text-[#C9943A] hover:bg-[#2F2F4A] px-5 rounded-xl"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Join'}
            </Button>
          </div>

          {error && <p className="text-sm text-red-400 text-center">{error}</p>}
        </div>

        <Link to={createPageUrl('Home')} className="block text-center">
          <Button variant="ghost" size="sm" className="text-[#6B6B8D]">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Home
          </Button>
        </Link>
      </div>
    </div>
  );
}