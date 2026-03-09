import React from 'react';
import { motion } from 'framer-motion';
import { Lock } from 'lucide-react';

export default function SkillNode({ node, isUnlocked, isNew, branchColor, onClick }) {
  return (
    <motion.button
      onClick={() => onClick(node, isUnlocked)}
      whileHover={{ scale: isUnlocked ? 1.08 : 1.02 }}
      whileTap={{ scale: 0.96 }}
      initial={isNew ? { scale: 0.5, opacity: 0 } : { scale: 1, opacity: 1 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className={`relative w-16 h-16 rounded-full flex items-center justify-center border-2 transition-all ${
        isUnlocked
          ? 'shadow-lg cursor-pointer'
          : 'opacity-50 cursor-pointer bg-[#1A1A2E] border-[#2F2F4A]'
      }`}
      style={
        isUnlocked
          ? {
              background: `radial-gradient(circle at 35% 35%, ${branchColor}40, ${branchColor}15)`,
              borderColor: branchColor,
              boxShadow: `0 0 18px ${branchColor}40`,
            }
          : {}
      }
    >
      {isUnlocked ? (
        <span className="text-2xl">{node.badge}</span>
      ) : (
        <Lock className="w-5 h-5 text-[#2F2F4A]" />
      )}

      {/* Level pip */}
      <div
        className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold border"
        style={
          isUnlocked
            ? { background: branchColor, borderColor: branchColor, color: '#1A1A2E' }
            : { background: '#2F2F4A', borderColor: '#1A1A2E', color: '#6B6B8D' }
        }
      >
        {node.level}
      </div>

      {/* New unlock pulse ring */}
      {isNew && (
        <motion.div
          className="absolute inset-0 rounded-full border-2"
          style={{ borderColor: branchColor }}
          initial={{ scale: 1, opacity: 0.8 }}
          animate={{ scale: 1.6, opacity: 0 }}
          transition={{ duration: 1, repeat: Infinity }}
        />
      )}
    </motion.button>
  );
}