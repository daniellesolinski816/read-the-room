import React from 'react';
import { motion } from 'framer-motion';
import { Lightbulb, MessageSquare } from 'lucide-react';

export default function Reflection({ reflection, alternativeResponse }) {
  return (
    <motion.div 
      className="space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.4 }}
    >
      <div className="bg-[#252542] rounded-xl p-6 border border-[#2F2F4A]">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-[#C9943A]/20 flex items-center justify-center flex-shrink-0 mt-1">
            <Lightbulb className="w-4 h-4 text-[#C9943A]" />
          </div>
          <div>
            <h4 className="font-serif text-lg text-[#E8E4DA] mb-2">The Mirror</h4>
            <p className="text-[#C5C1B8] leading-relaxed">{reflection}</p>
          </div>
        </div>
      </div>
      
      {alternativeResponse && (
        <div className="rounded-xl border border-[#C9943A]/40 overflow-hidden">
          <div className="bg-[#C9943A]/10 px-5 py-3 flex items-center gap-2 border-b border-[#C9943A]/20">
            <MessageSquare className="w-4 h-4 text-[#C9943A]" />
            <p className="text-xs text-[#C9943A] uppercase tracking-widest font-medium">If you could replay that moment…</p>
          </div>
          <div className="bg-[#1A1A2E] px-6 py-5">
            <p className="text-[#E8E4DA] leading-relaxed italic font-serif text-lg">
              "{alternativeResponse}"
            </p>
            <p className="text-xs text-[#6B6B8D] mt-3">One possible path — not the only one. What would yours sound like?</p>
          </div>
        </div>
      )}
    </motion.div>
  );
}