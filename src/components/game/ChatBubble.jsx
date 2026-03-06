import { motion } from 'framer-motion';

const MARKER_CONFIG = [
  { key: 'acknowledgment', emoji: '🫂', label: 'Acknowledgment', color: '#60A5FA' },
  { key: 'curiosity', emoji: '🔍', label: 'Curiosity', color: '#A78BFA' },
  { key: 'nonjudgment', emoji: '⚖️', label: 'Non-judgment', color: '#34D399' },
  { key: 'door_open', emoji: '🚪', label: 'Door Open', color: '#F59E0B' },
];

function ScoreRow({ scores }) {
  const total = Object.values(scores).reduce((a, b) => a + b, 0);
  return (
    <div className="mt-2 bg-[#1A1A2E] rounded-xl p-3 border border-[#2F2F4A]">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] uppercase tracking-widest text-[#6B6B8D]">Empathy Score</span>
        <span className={`text-sm font-bold ${total >= 70 ? 'text-[#34D399]' : total >= 45 ? 'text-[#F59E0B]' : 'text-[#F87171]'}`}>
          {total}/100
        </span>
      </div>
      <div className="grid grid-cols-4 gap-1.5">
        {MARKER_CONFIG.map(m => (
          <div key={m.key} className="text-center">
            <div className="text-sm mb-0.5">{m.emoji}</div>
            <div className="h-1 bg-[#2F2F4A] rounded-full overflow-hidden mb-0.5">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${(scores[m.key] / 25) * 100}%`, background: m.color }}
              />
            </div>
            <div className="text-[9px] text-[#6B6B8D]">{scores[m.key]}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ChatBubble({ message }) {
  if (message.role === 'user_score') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-end"
      >
        <div className="max-w-xs w-full">
          <ScoreRow scores={message.scores} />
        </div>
      </motion.div>
    );
  }

  if (message.role === 'summary') {
    const total = Object.values(message.scores).reduce((a, b) => a + b, 0);
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-3"
      >
        {/* Final message from other */}
        <div className="flex items-end gap-2">
          <div className="w-8 h-8 rounded-full bg-[#252542] flex items-center justify-center text-base flex-shrink-0">💬</div>
          <div className="bg-[#252542] border border-[#2F2F4A] rounded-2xl rounded-bl-sm px-4 py-3 max-w-xs">
            <p className="text-[#E8E4DA] text-sm leading-relaxed">{message.other_reply}</p>
          </div>
        </div>

        {/* Final scores */}
        <div className="bg-[#252542] border border-[#C9943A]/30 rounded-2xl p-4">
          <p className="text-center text-xs uppercase tracking-widest text-[#C9943A] mb-3">Conversation Complete</p>
          <ScoreRow scores={message.scores} />
          <p className="text-center mt-3 text-sm text-[#E8E4DA] font-serif">
            {total >= 80 ? '✨ Exceptional empathy across the board.' :
             total >= 60 ? '👍 Solid connection — one or two areas to deepen.' :
             total >= 40 ? '💡 Some empathy present — keep practicing.' :
             '🌱 This one was tough. Every rep builds the muscle.'}
          </p>
        </div>
      </motion.div>
    );
  }

  if (message.role === 'other') {
    return (
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex items-end gap-2"
      >
        <div className="w-8 h-8 rounded-full bg-[#252542] flex items-center justify-center text-base flex-shrink-0">💬</div>
        <div className="bg-[#252542] border border-[#2F2F4A] rounded-2xl rounded-bl-sm px-4 py-3 max-w-xs">
          <p className="text-[#E8E4DA] text-sm leading-relaxed">{message.text}</p>
        </div>
      </motion.div>
    );
  }

  if (message.role === 'user') {
    return (
      <motion.div
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex justify-end"
      >
        <div className="bg-[#C9943A]/20 border border-[#C9943A]/40 rounded-2xl rounded-br-sm px-4 py-3 max-w-xs">
          <p className="text-[#E8E4DA] text-sm leading-relaxed">{message.text}</p>
        </div>
      </motion.div>
    );
  }

  return null;
}