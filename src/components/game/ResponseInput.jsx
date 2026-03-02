import React from 'react';
import { motion } from 'framer-motion';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';

export default function ResponseInput({ value, onChange, onSubmit, disabled, placeholder = "What do you say?" }) {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && e.metaKey) {
      onSubmit?.();
    }
  };

  return (
    <motion.div 
      className="space-y-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        className="min-h-[120px] bg-[#252542] border-[#2F2F4A] text-[#E8E4DA] placeholder:text-[#6B6B8D] focus:border-[#C9943A] focus:ring-[#C9943A]/20 text-base resize-none"
      />
      <div className="flex justify-between items-center">
        <span className="text-xs text-[#6B6B8D]">
          Press ⌘ + Enter to submit
        </span>
        <Button
          onClick={onSubmit}
          disabled={disabled || !value?.trim()}
          className="bg-[#C9943A] hover:bg-[#D4A94D] text-[#1A1A2E] font-medium px-6"
        >
          <Send className="w-4 h-4 mr-2" />
          Submit Response
        </Button>
      </div>
    </motion.div>
  );
}