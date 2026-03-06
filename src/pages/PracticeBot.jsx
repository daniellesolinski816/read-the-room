import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Send, Loader2, RefreshCw, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Logo from '@/components/brand/Logo';
import ChatBubble from '@/components/game/ChatBubble';

const NUDGES = {
  acknowledgment: "🫂 Try acknowledging what they said or felt before moving on.",
  curiosity: "🔍 Try asking a curious question — what do you want to understand better?",
  nonjudgment: "⚖️ See if you can respond without placing a verdict on them.",
  door_open: "🚪 Can you leave the door open — signal you're still here for them?",
};

export default function PracticeBot() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [scenarioLoading, setScenarioLoading] = useState(false);
  const [scenario, setScenario] = useState(null);
  const [nudge, setNudge] = useState(null);
  const [turnCount, setTurnCount] = useState(0);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    startNewSession();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, nudge]);

  const startNewSession = async () => {
    setScenarioLoading(true);
    setMessages([]);
    setNudge(null);
    setTurnCount(0);

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are the Empathy Practice Bot for The Empathy Enigma. Generate a realistic, emotionally charged scenario where the user needs to respond empathically to another person. 

Return JSON with:
- "scenario_title": short 4-6 word title
- "scenario_description": 2-3 sentence scene-setting description (third person, atmospheric)
- "opening_message": the first message the "other person" sends to the user — make it raw, real, emotionally loaded. 1-3 sentences. Written as a text message or chat message, casual and human. Do NOT make it feel like a therapy session opener.

Categories to choose from: Family, Workplace, Friendship, Relationship, Community
Pick a random one.`,
      response_json_schema: {
        type: "object",
        properties: {
          scenario_title: { type: "string" },
          scenario_description: { type: "string" },
          opening_message: { type: "string" },
        },
        required: ["scenario_title", "scenario_description", "opening_message"]
      }
    });

    setScenario(result);
    setMessages([{ role: 'other', text: result.opening_message }]);
    setScenarioLoading(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userText = input.trim();
    setInput('');
    setNudge(null);

    const newMessages = [...messages, { role: 'user', text: userText }];
    setMessages(newMessages);
    setLoading(true);

    const conversationHistory = newMessages
      .map(m => `${m.role === 'user' ? 'USER' : 'OTHER PERSON'}: ${m.text}`)
      .join('\n');

    const evalResult = await base44.integrations.Core.InvokeLLM({
      prompt: `You are an empathy coach bot inside The Empathy Enigma app. You are running a real-time empathy practice conversation.

SCENARIO: ${scenario?.scenario_description}

CONVERSATION SO FAR:
${conversationHistory}

Your task:
1. Score the USER's LATEST message (only the last USER line) across the four empathy markers (0-25 each):
   - acknowledgment: Did they recognize the other person's feelings or position?
   - curiosity: Did they show interest or ask to understand more?
   - nonjudgment: Did they avoid a verdict or label?
   - door_open: Did they leave room for connection?

2. Write the OTHER PERSON's next reply. Keep it natural, emotional, human. 1-3 sentences. Respond to what the user actually said — reward empathy with openness, respond to dismissal or judgment with withdrawal or hurt. Do NOT sound like a therapist.

3. Decide if the conversation is complete (after 4-6 user turns, or if it reaches a natural resolution or breakdown). Set "is_complete" to true only then.

Return JSON:
{
  "acknowledgment": <0-25>,
  "curiosity": <0-25>,
  "nonjudgment": <0-25>,
  "door_open": <0-25>,
  "other_reply": "<string>",
  "is_complete": <boolean>
}`,
      response_json_schema: {
        type: "object",
        properties: {
          acknowledgment: { type: "number" },
          curiosity: { type: "number" },
          nonjudgment: { type: "number" },
          door_open: { type: "number" },
          other_reply: { type: "string" },
          is_complete: { type: "boolean" },
        },
        required: ["acknowledgment", "curiosity", "nonjudgment", "door_open", "other_reply", "is_complete"]
      }
    });

    const scores = {
      acknowledgment: evalResult.acknowledgment,
      curiosity: evalResult.curiosity,
      nonjudgment: evalResult.nonjudgment,
      door_open: evalResult.door_open,
    };

    // Coach-in-the-ear nudge: find lowest scoring marker if any < 15
    const lowestMarker = Object.entries(scores).reduce((lowest, [key, val]) => {
      return (!lowest || val < lowest[1]) ? [key, val] : lowest;
    }, null);
    if (lowestMarker && lowestMarker[1] < 15) {
      setNudge(NUDGES[lowestMarker[0]]);
    }

    const updatedMessages = [
      ...newMessages,
      { role: 'user_score', scores },
      ...(!evalResult.is_complete ? [{ role: 'other', text: evalResult.other_reply }] : []),
      ...(evalResult.is_complete ? [{ role: 'summary', scores, other_reply: evalResult.other_reply }] : []),
    ];

    setMessages(updatedMessages);
    setTurnCount(t => t + 1);
    setLoading(false);
  };

  const isComplete = messages.some(m => m.role === 'summary');

  return (
    <div className="min-h-screen bg-[#1A1A2E] flex flex-col">
      {/* Header */}
      <header className="p-4 flex items-center justify-between border-b border-[#2F2F4A] flex-shrink-0">
        <Link to={createPageUrl('Home')}>
          <Button variant="ghost" size="icon" className="text-[#C5C1B8] hover:text-[#C9943A]">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div className="text-center">
          <p className="text-[10px] uppercase tracking-widest text-[#6B6B8D]">Empathy Practice Bot</p>
          {scenario && <p className="text-[#E8E4DA] text-sm font-serif">{scenario.scenario_title}</p>}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={startNewSession}
          className="text-[#6B6B8D] hover:text-[#C9943A]"
          title="New scenario"
        >
          <RefreshCw className="w-4 h-4" />
        </Button>
      </header>

      {/* Scenario description pill */}
      {scenario && (
        <div className="px-4 py-3 bg-[#252542] border-b border-[#2F2F4A] flex-shrink-0">
          <p className="text-xs text-[#6B6B8D] text-center max-w-lg mx-auto">{scenario.scenario_description}</p>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4 max-w-2xl w-full mx-auto">
        {scenarioLoading && (
          <div className="flex justify-center py-20">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 text-[#C9943A] animate-spin" />
              <p className="text-[#6B6B8D] text-sm font-serif">Setting the scene...</p>
            </div>
          </div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <ChatBubble key={i} message={msg} />
          ))}
        </AnimatePresence>

        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 text-[#6B6B8D]"
          >
            <div className="w-8 h-8 rounded-full bg-[#252542] flex items-center justify-center text-sm">💬</div>
            <div className="flex gap-1">
              {[0, 1, 2].map(i => (
                <motion.div
                  key={i}
                  className="w-1.5 h-1.5 bg-[#6B6B8D] rounded-full"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                />
              ))}
            </div>
          </motion.div>
        )}

        {/* Nudge */}
        <AnimatePresence>
          {nudge && !isComplete && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="flex items-start gap-2.5 bg-[#C9943A]/10 border border-[#C9943A]/30 rounded-xl px-4 py-3 max-w-sm mx-auto"
            >
              <Lightbulb className="w-4 h-4 text-[#C9943A] mt-0.5 flex-shrink-0" />
              <p className="text-xs text-[#D4A94D] leading-relaxed">{nudge}</p>
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={bottomRef} />
      </div>

      {/* Input or Complete */}
      <div className="flex-shrink-0 border-t border-[#2F2F4A] p-4 max-w-2xl w-full mx-auto">
        {isComplete ? (
          <Button
            onClick={startNewSession}
            className="w-full h-12 bg-[#C9943A] hover:bg-[#D4A94D] text-[#1A1A2E] font-medium"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Start New Scenario
          </Button>
        ) : (
          <div className="flex gap-2 items-end">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
              }}
              placeholder="Type your response…"
              rows={2}
              disabled={loading || scenarioLoading}
              className="flex-1 bg-[#252542] border border-[#2F2F4A] rounded-xl px-4 py-3 text-[#E8E4DA] text-sm placeholder-[#6B6B8D] focus:outline-none focus:border-[#C9943A] resize-none disabled:opacity-50 transition-colors"
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || loading || scenarioLoading}
              className="h-[58px] w-12 bg-[#C9943A] hover:bg-[#D4A94D] text-[#1A1A2E] rounded-xl flex-shrink-0"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>
        )}
        <p className="text-[10px] text-[#6B6B8D] text-center mt-2">Press Enter to send · Shift+Enter for new line</p>
      </div>
    </div>
  );
}