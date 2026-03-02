import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Send, Mic, MicOff, Keyboard } from 'lucide-react';

export default function ResponseInput({ value, onChange, onSubmit, disabled, placeholder = "What do you say?" }) {
  const [inputMode, setInputMode] = useState('type'); // 'type' | 'voice'
  const [isListening, setIsListening] = useState(false);
  const [voiceSupported] = useState(() => 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window);
  const recognitionRef = useRef(null);

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    let finalTranscript = value || '';

    recognition.onresult = (event) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript + ' ';
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      onChange(finalTranscript + interim);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setIsListening(false);
  };

  const toggleVoice = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

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
      {/* Mode Toggle */}
      {voiceSupported && (
        <div className="flex gap-2">
          <button
            onClick={() => { stopListening(); setInputMode('type'); }}
            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-all ${
              inputMode === 'type'
                ? 'bg-[#C9943A]/20 border-[#C9943A] text-[#C9943A]'
                : 'border-[#2F2F4A] text-[#6B6B8D] hover:border-[#C9943A]/50'
            }`}
          >
            <Keyboard className="w-3 h-3" /> Type
          </button>
          <button
            onClick={() => setInputMode('voice')}
            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-all ${
              inputMode === 'voice'
                ? 'bg-[#C9943A]/20 border-[#C9943A] text-[#C9943A]'
                : 'border-[#2F2F4A] text-[#6B6B8D] hover:border-[#C9943A]/50'
            }`}
          >
            <Mic className="w-3 h-3" /> Speak
          </button>
        </div>
      )}

      {/* Voice Mode */}
      {inputMode === 'voice' ? (
        <div className="flex flex-col items-center gap-4 py-4">
          <button
            onClick={toggleVoice}
            disabled={disabled}
            className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${
              isListening
                ? 'bg-red-500/20 border-2 border-red-500 text-red-400 animate-pulse'
                : 'bg-[#252542] border-2 border-[#C9943A] text-[#C9943A] hover:bg-[#C9943A]/10'
            }`}
          >
            {isListening ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
          </button>
          <p className="text-xs text-[#6B6B8D]">
            {isListening ? 'Listening… tap to stop' : 'Tap to start speaking'}
          </p>
          {value?.trim() && (
            <div className="w-full bg-[#252542] rounded-xl p-4 border border-[#2F2F4A]">
              <p className="text-[#E8E4DA] italic text-sm">"{value}"</p>
            </div>
          )}
        </div>
      ) : (
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className="min-h-[120px] bg-[#252542] border-[#2F2F4A] text-[#E8E4DA] placeholder:text-[#6B6B8D] focus:border-[#C9943A] focus:ring-[#C9943A]/20 text-base resize-none"
        />
      )}

      <div className="flex justify-between items-center">
        <span className="text-xs text-[#6B6B8D]">
          {inputMode === 'type' ? 'Press ⌘ + Enter to submit' : ''}
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