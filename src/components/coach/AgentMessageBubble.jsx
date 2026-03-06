import React from 'react';
import ReactMarkdown from 'react-markdown';
import { motion } from 'framer-motion';

export default function AgentMessageBubble({ message }) {
  const isUser = message.role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      {!isUser && (
        <div className="w-7 h-7 rounded-lg bg-[#252542] border border-[#2F2F4A] flex items-center justify-center text-sm flex-shrink-0 mt-0.5">
          🧠
        </div>
      )}
      <div className={`max-w-[85%] ${isUser ? 'items-end flex flex-col' : ''}`}>
        <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? 'bg-[#C9943A]/20 border border-[#C9943A]/40 text-[#E8E4DA]'
            : 'bg-[#252542] border border-[#2F2F4A] text-[#C5C1B8]'
        }`}>
          {isUser ? (
            <p>{message.content}</p>
          ) : (
            <ReactMarkdown
              className="prose prose-sm max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 prose-p:text-[#C5C1B8] prose-strong:text-[#E8E4DA] prose-li:text-[#C5C1B8]"
              components={{
                p: ({ children }) => <p className="my-1 leading-relaxed">{children}</p>,
                ul: ({ children }) => <ul className="my-1 ml-4 list-disc space-y-1">{children}</ul>,
                ol: ({ children }) => <ol className="my-1 ml-4 list-decimal space-y-1">{children}</ol>,
                li: ({ children }) => <li className="my-0">{children}</li>,
                strong: ({ children }) => <strong className="text-[#E8E4DA] font-semibold">{children}</strong>,
              }}
            >
              {message.content}
            </ReactMarkdown>
          )}
        </div>
      </div>
    </motion.div>
  );
}