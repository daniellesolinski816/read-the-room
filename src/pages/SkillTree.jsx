import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SkillBranch from '@/components/skilltree/SkillBranch';
import NodeDetailModal from '@/components/skilltree/NodeDetailModal';
import { SKILL_BRANCHES, computeUnlockedNodes } from '@/components/skilltree/skillTreeData';

export default function SkillTree() {
  const [user, setUser] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [prevUnlocked, setPrevUnlocked] = useState(new Set());
  const [newlyUnlocked, setNewlyUnlocked] = useState(new Set());

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: profile } = useQuery({
    queryKey: ['userProfile', user?.email],
    queryFn: async () => {
      if (!user) return null;
      const profiles = await base44.entities.UserProfile.filter({ user_id: user.email });
      return profiles[0] || null;
    },
    enabled: !!user,
  });

  const unlockedNodes = useMemo(() => computeUnlockedNodes(profile), [profile]);

  // Detect newly unlocked nodes vs. previously saved ones
  useEffect(() => {
    if (!profile) return;
    const saved = new Set(profile.skill_tree_unlocks || []);
    const fresh = new Set();
    unlockedNodes.forEach(id => {
      if (!saved.has(id)) fresh.add(id);
    });
    setNewlyUnlocked(fresh);

    // Persist new unlocks back to profile if any
    if (fresh.size > 0) {
      const merged = [...saved, ...fresh];
      base44.entities.UserProfile.update(profile.id, { skill_tree_unlocks: merged });
    }
  }, [profile, unlockedNodes]);

  // Overall stats
  const totalNodes = SKILL_BRANCHES.reduce((sum, b) => sum + b.nodes.length, 0);
  const totalUnlocked = unlockedNodes.size;
  const overallPct = Math.round((totalUnlocked / totalNodes) * 100);

  function handleNodeClick(node, isUnlocked) {
    const branch = SKILL_BRANCHES.find(b => b.nodes.some(n => n.id === node.id));
    setSelectedNode(node);
    setSelectedBranch(branch);
  }

  return (
    <div className="min-h-screen bg-[#1A1A2E] pb-16">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-[#1A1A2E]/90 backdrop-blur border-b border-[#252542] px-4 py-3 flex items-center gap-3">
        <Link to={createPageUrl('Home')}>
          <Button variant="ghost" size="icon" className="text-[#C5C1B8] hover:text-[#C9943A] hover:bg-[#252542]">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-lg font-serif font-semibold text-[#E8E4DA]">Skill Tree</h1>
          <p className="text-[10px] text-[#6B6B8D]">Your communication growth path</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-bold text-[#C9943A]">{totalUnlocked}/{totalNodes}</p>
          <p className="text-[10px] text-[#6B6B8D]">nodes unlocked</p>
        </div>
      </header>

      <main className="px-4 pt-5 max-w-lg mx-auto space-y-4">
        {/* Overall progress */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#252542] border border-[#2F2F4A] rounded-2xl p-4"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#C9943A]" />
              <span className="text-xs text-[#C5C1B8] font-medium">Overall Mastery</span>
            </div>
            <span className="text-xs font-bold text-[#C9943A]">{overallPct}%</span>
          </div>
          <div className="h-2 bg-[#1A1A2E] rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-[#C9943A] to-[#7C6FCD]"
              initial={{ width: 0 }}
              animate={{ width: `${overallPct}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
          </div>
          {newlyUnlocked.size > 0 && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-[10px] text-[#C9943A] mt-2 text-center"
            >
              🎉 {newlyUnlocked.size} new skill{newlyUnlocked.size > 1 ? 's' : ''} unlocked since your last visit!
            </motion.p>
          )}
        </motion.div>

        {/* Branches */}
        {SKILL_BRANCHES.map((branch, i) => (
          <motion.div
            key={branch.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <SkillBranch
              branch={branch}
              unlockedNodes={unlockedNodes}
              newlyUnlocked={newlyUnlocked}
              onNodeClick={handleNodeClick}
            />
          </motion.div>
        ))}

        {/* Footer tip */}
        <p className="text-center text-[10px] text-[#4A4A6A] pb-4">
          Complete solo sessions and improve your empathy scores to unlock new skills
        </p>
      </main>

      {/* Node detail modal */}
      {selectedNode && selectedBranch && (
        <NodeDetailModal
          node={selectedNode}
          branch={selectedBranch}
          isUnlocked={unlockedNodes.has(selectedNode.id)}
          onClose={() => { setSelectedNode(null); setSelectedBranch(null); }}
        />
      )}
    </div>
  );
}