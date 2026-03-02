import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function Timer({ duration = 60, onComplete, isRunning = true }) {
  const [timeLeft, setTimeLeft] = useState(duration);
  
  useEffect(() => {
    if (!isRunning) return;
    
    if (timeLeft <= 0) {
      onComplete?.();
      return;
    }
    
    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
    
    return () => clearInterval(timer);
  }, [timeLeft, isRunning, onComplete]);
  
  const percentage = (timeLeft / duration) * 100;
  const isLow = timeLeft <= 10;
  
  return (
    <div className="flex items-center gap-3">
      <div className="relative w-16 h-16">
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="32"
            cy="32"
            r="28"
            fill="none"
            stroke="#2F2F4A"
            strokeWidth="3"
          />
          <motion.circle
            cx="32"
            cy="32"
            r="28"
            fill="none"
            stroke={isLow ? '#E85D5D' : '#C9943A'}
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={175.9}
            strokeDashoffset={175.9 - (175.9 * percentage) / 100}
            initial={{ strokeDashoffset: 0 }}
            transition={{ duration: 0.5 }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`font-mono text-lg font-medium ${isLow ? 'text-red-400 timer-pulse' : 'text-[#E8E4DA]'}`}>
            {timeLeft}
          </span>
        </div>
      </div>
    </div>
  );
}