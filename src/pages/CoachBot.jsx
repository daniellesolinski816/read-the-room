import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowLeft, Send, Loader2, RefreshCw, Lightbulb, ChevronDown, ChevronUp } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import Logo from '@/components/brand/Logo';

const PERSONAS = [
  {
    id: 'calm_listener',
    emoji: '🌊',
    name: 'The Calm Listener',
    tagline: 'Unhurried. Present. Spacious.',
    description: 'Speaks slowly, mirrors back what you say, holds silence comfortably. Great for practicing when you feel unheard.',
    color: '#4CAF82',
    style: 'You are "The Calm Listener" — a warm, unhurried presence. You speak in short sentences. You reflect back what you hear before responding. You never rush. You ask one question at a time. You sit comfortably with silence and don\'t feel the need to fill it. You validate feelings without analysis.',
    starter: "I'm here. Take as much time as you need — what's going on?",
  },
  {
    id: 'direct_truth',
    emoji: '🎯',
    name: 'The Direct Truth-Teller',
    tagline: 'Honest. Clear. No sugarcoating.',
    description: 'Calls out patterns gently but plainly. Pushes back when warranted. Best for users who want real feedback, not comfort.',
    color: '#E07A5F',
    style: 'You are "The Direct Truth-Teller" — honest, clear, and warm but not soft. You name what you notice plainly. If the user is being avoidant, you say so directly but without cruelty. You push back on things that don\'t add up. You don\'t sugarcoat but you\'re never harsh. You end most exchanges with a pointed, specific question.',
    starter: "Alright, I'll be straight with you — that's how I work best. What's the situation?",
  },
  {
    id: 'gentle_questioner',
    emoji: '🌱',
    name: 'The Gentle Questioner',
    tagline: 'Curious. Exploratory. Non-directive.',
    description: 'Never tells you what to do. Opens up the conversation with layered questions. Perfect for figuring out what you actually feel.',
    color: '#7C6FCD',
    style: 'You are "The Gentle Questioner" — deeply curious, non-directive, and exploratory. You never give advice unless explicitly asked. Instead, you ask layered questions that help the user discover their own answers. Your questions are specific, not generic. You follow threads. You never moralize.',
    starter: "I'm curious about what brought you here today. What's been sitting with you?",
  },
  {
    id: 'warm_challenger',
    emoji: '🔥',
    name: 'The Warm Challenger',
    tagline: 'Supportive. Provocative. Growth-oriented.',
    description: 'Affirms your strengths while gently dismantling your blind spots. Ideal for users ready to be stretched.',
    color: '#C9943A',
    style: 'You are "The Warm Challenger" — you celebrate what\'s working and then gently dismantle what isn\'t. You notice the gap between what people say they value and how they actually behave. You are encouraging but you don\'t let people off the hook. You believe in the user\'s capacity to grow.',
    starter: "You've got more capacity than you think — let's find out where you're holding back. What's the situation?",
  },
];

const SCENARIO_STARTERS = [
  'My partner and I keep having the same argument and nothing changes.',
  'A coworker takes credit for my ideas and I don\'t know how to address it.',
  'My parent and I haven\'t spoken in months after a fight.',
  'I want to apologize to someone but I\'m not sure how to start.',
  'A friend said something that really hurt me and I can\'t let it go.',
  'I feel invisible in group conversations and I don\'t know why.',
  'Someone I care about is going through something hard and I don\'t know what to say.',
  'I lose my patience quickly and I don\'t like that about myself.',
];

function TipBubble({ tip }) {
  const [open, setOpen] = useState(true);
  if (!tip) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-4 my-2"
    >
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2 bg-[#C9943A]/10 border border-[#C9943A]/30 rounded-xl px-4 py-2.5 text-left"
      >
        <Lightbulb className="w-3.5 h-3.5 text-[#C9943A] flex-shrink-0" />
        <span className="text-xs text-[#C9943A] font-medium flex-1">Empathy tip</span>
        {open ? <ChevronUp className="w-3 h-3 text-[#C9943A]" /> : <ChevronDown className="w-3 h-3 text-[#C9943A]" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-[#C9943A]/5 border border-t-0 border-[#C9943A]/20 rounded-b-xl px-4 py-3">
              <p className="text-xs text-[#E8E4DA] leading-relaxed">{tip}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function MessageBubble({ msg }) {
  const isUser = msg.role === 'user';
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} px-4`}>
      <div className={`max-w-[82%] rounded-2xl px-4 py-2.5 ${isUser ? 'bg-[#C9943A] text-[#1A1A2E]' : 'bg-[#252542] border border-[#2F2F4A] text-[#E8E4DA]'}`}>
        <p className="text-sm leading-relaxed">{msg.content}</p>
      </div>
    </div>
  );
}

export default function CoachBot() {
  const [user, setUser] = useState(null);
  const [persona, setPersona] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [currentTip, setCurrentTip] = useState(null);
  const [loadingTip, setLoadingTip] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, currentTip]);

  const startPersona = (p) => {
    setPersona(p);
    setMessages([{ role: 'assistant', content: p.starter }]);
    setCurrentTip(null);
  };

  const reset = () => {
    setPersona(null);
    setMessages([]);
    setInput('');
    setCurrentTip(null);
  };

  const sendMessage = async (text) => {
    const userText = (text || input).trim();
    if (!userText || sending) return;
    setInput('');
    setSending(true);

    const newMessages = [...messages, { role: 'user', content: userText }];
    setMessages(newMessages);
    setCurrentTip(null);

    // Build history for the LLM
    const history = newMessages.map(m => `${m.role === 'user' ? 'USER' : 'COACH'}: ${m.content}`).join('\n');

    // Run persona reply + empathy tip in parallel
    const [replyResult, tipResult] = await Promise.all([
      base44.integrations.Core.InvokeLLM({
        prompt: `${persona.style}

This is a live back-and-forth practice dialogue. Respond as this persona ONLY — stay fully in character.
Keep replies SHORT (2-5 sentences max). Do not give a lecture. Do not list things. 
Be conversational, warm to the persona's style.

Conversation so far:
${history}

COACH:`,
      }),
      base44.integrations.Core.InvokeLLM({
        prompt: `You are an empathy coach observing a user in a live dialogue practice session.
The user just said: "${userText}"

Persona context: ${persona.name} — ${persona.tagline}

Full conversation:
${history}

Based specifically on what the user just said, give ONE bite-sized empathy tip (2-3 sentences max).
Focus on their specific phrasing, word choice, or what they avoided saying.
Be concrete and non-preachy. Don't evaluate the coach. Don't be generic.
Start with what you noticed, not advice.`,
      }),
    ]);

    setMessages(prev => [...prev, { role: 'assistant', content: replyResult }]);
    setCurrentTip(tipResult);
    setSending(false);
  };

  return (
    <div className="min-h-screen bg-[#1A1A2E] flex flex-col">
      <header className="p-4 flex items-center justify-between border-b border-[#2F2F4A]">
        {persona ? (
          <Button variant="ghost" size="icon" onClick={reset} className="text-[#C5C1B8] hover:text-[#C9943A]">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        ) : (
          <Link to={createPageUrl('Coach')}>
            <Button variant="ghost" size="icon" className="text-[#C5C1B8] hover:text-[#C9943A]">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
        )}
        <Logo size="small" />
        {persona ? (
          <Button variant="ghost" size="icon" onClick={reset} className="text-[#6B6B8D] hover:text-[#C9943A]">
            <RefreshCw className="w-4 h-4" />
          </Button>
        ) : <div className="w-9" />}
      </header>

      <AnimatePresence mode="wait">
        {!persona ? (
          /* Persona picker */
          <motion.main
            key="picker"
            className="flex-1 px-5 py-6 max-w-lg mx-auto w-full"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            <div className="mb-6">
              <h1 className="font-serif text-2xl text-[#E8E4DA] mb-1">Coach Bot</h1>
              <p className="text-[#6B6B8D] text-sm">Pick a coaching persona, then practice a real conversation. You'll get bite-sized empathy tips as you go.</p>
            </div>

            <div className="space-y-3 mb-8">
              {PERSONAS.map((p, i) => (
                <motion.button
                  key={p.id}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07 }}
                  onClick={() => startPersona(p)}
                  className="w-full text-left bg-[#252542] border border-[#2F2F4A] rounded-2xl p-5 hover:border-opacity-60 transition-all group"
                  style={{ '--hover-color': p.color }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = p.color + '60'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = ''}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0" style={{ background: p.color + '20' }}>
                      {p.emoji}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <span className="text-[#E8E4DA] font-medium">{p.name}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ color: p.color, background: p.color + '20' }}>{p.tagline}</span>
                      </div>
                      <p className="text-[#6B6B8D] text-sm leading-relaxed">{p.description}</p>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>

            {/* Starter prompts */}
            <div>
              <p className="text-xs uppercase tracking-widest text-[#6B6B8D] mb-3">Not sure where to start? Try one of these:</p>
              <div className="space-y-2">
                {SCENARIO_STARTERS.slice(0, 4).map((s, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      const defaultP = PERSONAS[0];
                      startPersona(defaultP);
                      setTimeout(() => sendMessage(s), 100);
                    }}
                    className="w-full text-left text-xs text-[#C5C1B8] bg-[#1A1A2E] border border-[#2F2F4A] rounded-xl px-4 py-3 hover:border-[#C9943A]/40 hover:text-[#E8E4DA] transition-colors"
                  >
                    "{s}"
                  </button>
                ))}
              </div>
            </div>
          </motion.main>
        ) : (
          /* Chat view */
          <motion.div
            key="chat"
            className="flex-1 flex flex-col"
            initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
          >
            {/* Persona bar */}
            <div className="px-5 py-3 border-b border-[#2F2F4A] flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xl" style={{ background: persona.color + '20' }}>
                {persona.emoji}
              </div>
              <div>
                <p className="text-[#E8E4DA] text-sm font-medium">{persona.name}</p>
                <p className="text-xs" style={{ color: persona.color }}>{persona.tagline}</p>
              </div>
              <div className="ml-auto flex items-center gap-1.5">
                <Lightbulb className="w-3 h-3 text-[#C9943A]" />
                <span className="text-[10px] text-[#6B6B8D]">Live tips on</span>
              </div>
            </div>

            {/* Messages + tips */}
            <div className="flex-1 overflow-y-auto py-5 space-y-3">
              {messages.map((msg, i) => (
                <React.Fragment key={i}>
                  <MessageBubble msg={msg} />
                  {/* Show tip after the last user message */}
                  {msg.role === 'user' && i === messages.length - 2 && currentTip && !sending && (
                    <TipBubble tip={currentTip} />
                  )}
                </React.Fragment>
              ))}
              {sending && (
                <div className="flex gap-3 px-4">
                  <div className="h-7 w-7 rounded-lg bg-[#252542] flex items-center justify-center">
                    <Loader2 className="w-3.5 h-3.5 text-[#C9943A] animate-spin" />
                  </div>
                </div>
              )}
              {/* Tip shown after latest assistant reply */}
              {messages.length > 1 && messages[messages.length - 1]?.role === 'assistant' && currentTip && !sending && (
                <TipBubble tip={currentTip} />
              )}
              <div ref={bottomRef} />
            </div>

            {/* Quick starter chips (first turn only) */}
            {messages.length === 1 && (
              <div className="px-4 pb-2 flex flex-wrap gap-2">
                {SCENARIO_STARTERS.slice(0, 3).map((s, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(s)}
                    className="text-xs text-[#C5C1B8] border border-[#2F2F4A] rounded-full px-3 py-1.5 hover:border-[#C9943A]/50 hover:text-[#E8E4DA] transition-colors bg-[#252542]"
                  >
                    {s.length > 40 ? s.slice(0, 40) + '…' : s}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div className="p-4 border-t border-[#2F2F4A]">
              <div className="flex gap-2 items-end bg-[#252542] rounded-xl border border-[#2F2F4A] p-2 focus-within:border-[#C9943A]/50 transition-colors">
                <textarea
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                  placeholder="Respond to your coach…"
                  rows={1}
                  className="flex-1 bg-transparent text-[#E8E4DA] text-sm placeholder-[#6B6B8D] resize-none outline-none px-2 py-1 max-h-32"
                  style={{ lineHeight: '1.5' }}
                />
                <Button
                  onClick={() => sendMessage()}
                  disabled={!input.trim() || sending}
                  size="icon"
                  className="bg-[#C9943A] hover:bg-[#D4A94D] text-[#1A1A2E] rounded-lg w-8 h-8 flex-shrink-0 disabled:opacity-30"
                >
                  <Send className="w-3.5 h-3.5" />
                </Button>
              </div>
              <p className="text-[#6B6B8D] text-xs text-center mt-2">Enter to send · Shift+Enter for new line</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}