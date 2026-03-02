import React from 'react';
import { motion } from 'framer-motion';

export default function GameTitle({ size = 'default' }) {
  const sizeClasses = {
    small: 'text-2xl',
    default: 'text-4xl md:text-5xl',
    large: 'text-5xl md:text-6xl'
  };

  return (
    <motion.h1 
      className={`font-serif font-bold text-[#E8E4DA] ${sizeClasses[size]} tracking-tight`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
    >
      Read the Room
    </motion.h1>
  );
}