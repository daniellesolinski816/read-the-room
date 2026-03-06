import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowLeft, Send, Loader2 } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import Logo from '@/components/brand/Logo';
import MessageBubble from '@/components/game/ChatBubble';

const AGENTS = [
  {
    id: 'empathy_coach',
    emoji: '🧠',
    title: 'Empathy Coach',
    subtitle: 'Navigate a real-life situation',
    description: 'Describe something you\'re struggling with — a conflict, a hard conversation, or a moment you\'re not sure how to handle. Get personal, practical advice.',
    color: '#C9943A',
  },
  {
    id: 'progress_reviewer',
    emoji: '📊',
    title: 'Progress Review',
    subtitle: 'Understand your growth',
    description: 'Ask "how am I doing?" and get an honest analysis of your empathy scores, patterns, and one focused thing to work on next.',
    color: '#7C6FCD',
  },
  {
    id: 'scenario_suggester',
    emoji: '🎯',
    title: 'Scenario Finder',
    subtitle: 'Find scenarios for your life',
    description: 'Tell me about your life context — who you clash with, what situations stress you — and I\'ll suggest the best scenarios to practice.',
    color: '#4CAF82',
  },
  {
    id: 'scenario_writer',
    emoji: '✍️',
    title: 'Scenario Writer',
    subtitle: 'Turn your story into a scenario',
    description: 'Have a real situation you\'ve lived through? I\'ll help you shape it into a community scenario others can learn from.',
    color: '#E07A5F',
  },
];

export default function Coach() {
  const [user, setUser] = useState(null);
  const [activeAgent, setActiveAgent] = useState(null);
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!conversation) return;
    const unsub = base44.agents.subscribeToConversation(conversation.id, (data) => {
      setMessages(data.messages || []);
    });
    return unsub;
  }, [conversation?.id]);

  const startAgent = async (agent) => {
    setActiveAgent(agent);
    setMessages([]);
    setInput('');
    const conv = await base44.agents.createConversation({
      agent_name: agent.id,
      metadata: { name: agent.title },
    });
    setConversation(conv);
    setMessages(conv.messages || []);
  };

  const sendMessage = async () => {
    if (!input.trim() || sending || !conversation) return;
    const text = input.trim();
    setInput('');
    setSending(true);
    await base44.agents.addMessage(conversation, { role: 'user', content: text });
    setSending(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const goBack = () => {
    setActiveAgent(null);
    setConversation(null);
    setMessages([]);
    setInput('');
  };

  return (
    <div className="min-h-screen bg-[#1A1A2E] flex flex-col">
      <header className="p-4 flex items-center justify-between border-b border-[#2F2F4A]">
        {activeAgent ? (
          <Button variant="ghost" size="icon" onClick={goBack} className="text-[#C5C1B8] hover:text-[#C9943A]">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        ) : (
          <Link to={createPageUrl('Home')}>
            <Button variant="ghost" size="icon" className="text-[#C5C1B8] hover:text-[#C9943A]">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
        )}
        <Logo size="small" />
        <div className="w-9" />
      </header>

      <AnimatePresence mode="wait">
        {!activeAgent ? (
          /* Agent picker */
          <motion.main
            key="picker"
            className="flex-1 px-5 py-6 max-w-lg mx-auto w-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="mb-6">
              <h1 className="font-serif text-2xl text-[#E8E4DA] mb-1">AI Coaches</h1>
              <p className="text-[#6B6B8D] text-sm">Choose a coach to get started. Each one focuses on a different kind of help.</p>
            </div>

            <div className="space-y-3">
              {AGENTS.map((agent, i) => (
                <motion.button
                  key={agent.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07 }}
                  onClick={() => startAgent(agent)}
                  className="w-full text-left bg-[#252542] border border-[#2F2F4A] rounded-2xl p-5 hover:border-[#C9943A]/40 transition-all hover:bg-[#252542]/80 group"
                >
                  <div className="flex items-start gap-4">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                      style={{ background: agent.color + '20' }}
                    >
                      {agent.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[#E8E4DA] font-medium">{agent.title}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ color: agent.color, background: agent.color + '20' }}>
                          {agent.subtitle}
                        </span>
                      </div>
                      <p className="text-[#6B6B8D] text-sm leading-relaxed">{agent.description}</p>
                    </div>
                    <ArrowLeft className="w-4 h-4 text-[#2F2F4A] group-hover:text-[#C9943A] rotate-180 transition-all flex-shrink-0 mt-1" />
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.main>
        ) : (
          /* Chat view */
          <motion.div
            key="chat"
            className="flex-1 flex flex-col"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
          >
            {/* Agent header */}
            <div className="px-5 py-3 border-b border-[#2F2F4A] flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center text-xl"
                style={{ background: activeAgent.color + '20' }}
              >
                {activeAgent.emoji}
              </div>
              <div>
                <p className="text-[#E8E4DA] text-sm font-medium">{activeAgent.title}</p>
                <p className="text-[#6B6B8D] text-xs">{activeAgent.subtitle}</p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4">
              {messages.length === 0 && (
                <div className="text-center py-8">
                  <div className="text-4xl mb-3">{activeAgent.emoji}</div>
                  <p className="text-[#C5C1B8] text-sm max-w-xs mx-auto">{activeAgent.description}</p>
                </div>
              )}
              {messages.map((msg, i) => (
                <MessageBubble key={i} message={msg} />
              ))}
              {sending && (
                <div className="flex gap-3">
                  <div className="h-7 w-7 rounded-lg bg-[#252542] flex items-center justify-center">
                    <Loader2 className="w-3.5 h-3.5 text-[#C9943A] animate-spin" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-[#2F2F4A]">
              <div className="flex gap-2 items-end bg-[#252542] rounded-xl border border-[#2F2F4A] p-2 focus-within:border-[#C9943A]/50 transition-colors">
                <textarea
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a message…"
                  rows={1}
                  className="flex-1 bg-transparent text-[#E8E4DA] text-sm placeholder-[#6B6B8D] resize-none outline-none px-2 py-1 max-h-32"
                  style={{ lineHeight: '1.5' }}
                />
                <Button
                  onClick={sendMessage}
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