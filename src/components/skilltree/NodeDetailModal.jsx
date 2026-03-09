import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function NodeDetailModal({ node, branch, isUnlocked, onClose }) {
  if (!node) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="bg-[#252542] border rounded-2xl p-6 w-full max-w-sm relative"
          style={{ borderColor: isUnlocked ? branch.color : '#2F2F4A' }}
          initial={{ y: 60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 60, opacity: 0 }}
          onClick={e => e.stopPropagation()}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-[#6B6B8D] hover:text-[#E8E4DA]"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Badge */}
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl border-2"
            style={
              isUnlocked
                ? { borderColor: branch.color, background: `${branch.color}20`, boxShadow: `0 0 24px ${branch.color}40` }
                : { borderColor: '#2F2F4A', background: '#1A1A2E' }
            }
          >
            {isUnlocked ? node.badge : <Lock className="w-6 h-6 text-[#2F2F4A]" />}
          </div>

          {/* Title */}
          <h2 className="text-center text-xl font-serif font-semibold text-[#E8E4DA] mb-1">{node.title}</h2>
          <p
            className="text-center text-xs mb-3 font-medium"
            style={{ color: branch.color }}
          >
            {branch.label} · Level {node.level}
          </p>
          <p className="text-center text-sm text-[#C5C1B8] leading-relaxed mb-5">{node.description}</p>

          {/* Status */}
          {isUnlocked ? (
            <div
              className="flex items-center justify-center gap-2 text-sm font-medium py-2 rounded-xl mb-4"
              style={{ background: `${branch.color}20`, color: branch.color }}
            >
              ✅ Unlocked
            </div>
          ) : (
            <div className="bg-[#1A1A2E] border border-[#2F2F4A] rounded-xl p-3 mb-4 text-center">
              <p className="text-[10px] uppercase tracking-wider text-[#6B6B8D] mb-1">Unlock by</p>
              <p className="text-sm text-[#C5C1B8]">{node.unlock_label}</p>
            </div>
          )}

          {!isUnlocked && (
            <Link to={createPageUrl('Solo')} onClick={onClose}>
              <Button
                className="w-full text-[#1A1A2E] font-semibold"
                style={{ background: branch.color }}
              >
                Practice Now →
              </Button>
            </Link>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}