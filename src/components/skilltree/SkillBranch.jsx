import React from 'react';
import { motion } from 'framer-motion';
import SkillNode from './SkillNode';

export default function SkillBranch({ branch, unlockedNodes, newlyUnlocked, onNodeClick }) {
  const totalUnlocked = branch.nodes.filter(n => unlockedNodes.has(n.id)).length;
  const progress = (totalUnlocked / branch.nodes.length) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#252542] border border-[#2F2F4A] rounded-2xl p-5 hover:border-opacity-60 transition-colors"
      style={{ '--branch-color': branch.color }}
    >
      {/* Branch header */}
      <div className="flex items-center gap-3 mb-4">
        <span className="text-2xl">{branch.icon}</span>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-[#E8E4DA] font-serif truncate">{branch.label}</h3>
          <p className="text-[10px] text-[#6B6B8D] mt-0.5 leading-tight">{branch.description}</p>
        </div>
        <div className="text-right flex-shrink-0">
          <span className="text-xs font-bold" style={{ color: branch.color }}>
            {totalUnlocked}/{branch.nodes.length}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-[#1A1A2E] rounded-full mb-5 overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: branch.color }}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>

      {/* Nodes row with connector lines */}
      <div className="relative flex items-center justify-between px-2">
        {/* Connector lines between nodes */}
        {branch.nodes.map((node, idx) => {
          if (idx === branch.nodes.length - 1) return null;
          const isLineFilled =
            unlockedNodes.has(node.id) && unlockedNodes.has(branch.nodes[idx + 1].id);
          return (
            <div
              key={`line-${idx}`}
              className="absolute h-0.5 top-1/2 -translate-y-1/2 transition-colors duration-500"
              style={{
                left: `calc(${(idx + 1) * 25}% - 8px)`,
                width: 'calc(25% - 16px)',
                background: isLineFilled ? branch.color : '#2F2F4A',
                opacity: isLineFilled ? 0.7 : 1,
              }}
            />
          );
        })}

        {branch.nodes.map(node => (
          <div key={node.id} className="relative z-10">
            <SkillNode
              node={node}
              isUnlocked={unlockedNodes.has(node.id)}
              isNew={newlyUnlocked.has(node.id)}
              branchColor={branch.color}
              onClick={onNodeClick}
            />
          </div>
        ))}
      </div>

      {/* Node labels below */}
      <div className="flex justify-between px-2 mt-2">
        {branch.nodes.map(node => (
          <div key={node.id} className="w-16 text-center">
            <p
              className="text-[9px] leading-tight truncate"
              style={{ color: unlockedNodes.has(node.id) ? branch.color : '#4A4A6A' }}
            >
              {node.title}
            </p>
          </div>
        ))}
      </div>
    </motion.div>
  );
}