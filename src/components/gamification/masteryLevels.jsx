// Mastery Level system for each of the four empathy markers
// A user advances a tier when their rolling average for that marker hits the threshold

export const MASTERY_TIERS = [
  { tier: 1, name: 'Apprentice', threshold: 15, color: '#8B6914', bg: 'bg-amber-900/30', border: 'border-amber-700/40', textColor: 'text-amber-600' },
  { tier: 2, name: 'Practitioner', threshold: 18, color: '#A0A0A0', bg: 'bg-slate-700/30', border: 'border-slate-500/40', textColor: 'text-slate-400' },
  { tier: 3, name: 'Expert', threshold: 21, color: '#C9943A', bg: 'bg-yellow-700/20', border: 'border-yellow-500/40', textColor: 'text-yellow-400' },
  { tier: 4, name: 'Master', threshold: 23, color: '#7C6FCD', bg: 'bg-purple-900/30', border: 'border-purple-500/40', textColor: 'text-purple-400' },
];

export const MASTERY_MARKERS = [
  {
    key: 'avg_acknowledgment',
    sessionKey: 'score_acknowledgment',
    label: 'Acknowledgment',
    color: '#C9943A',
    icon: '👂',
    titles: {
      1: 'Empathic Listener',
      2: 'Active Listener',
      3: 'Heart Speaker',
      4: 'Resonance Master',
    },
    descriptions: {
      1: "You've begun to recognize others' feelings.",
      2: 'You consistently acknowledge what others share.',
      3: 'You reflect emotions with skill and depth.',
      4: 'You make others feel truly seen and heard.',
    }
  },
  {
    key: 'avg_curiosity',
    sessionKey: 'score_curiosity',
    label: 'Curiosity',
    color: '#7C6FCD',
    icon: '🔍',
    titles: {
      1: 'Question Seeker',
      2: 'Perspective Explorer',
      3: 'Depth Investigator',
      4: 'Curiosity Sage',
    },
    descriptions: {
      1: "You're starting to ask meaningful questions.",
      2: 'You regularly invite others to share more.',
      3: 'You explore perspectives with genuine interest.',
      4: 'Your curiosity opens minds and builds bridges.',
    }
  },
  {
    key: 'avg_nonjudgment',
    sessionKey: 'score_nonjudgment',
    label: 'Non-judgment',
    color: '#4ABFA1',
    icon: '⚖️',
    titles: {
      1: 'Open Mind',
      2: 'Conflict Mediator',
      3: 'Neutral Witness',
      4: 'Wisdom Keeper',
    },
    descriptions: {
      1: 'You're learning to hold back verdicts.',
      2: 'You navigate charged moments without judging.',
      3: 'You create safety for all perspectives.',
      4: 'Your non-judgment invites radical honesty.',
    }
  },
  {
    key: 'avg_door_open',
    sessionKey: 'score_door_open',
    label: 'Door Open',
    color: '#E07C5B',
    icon: '🚪',
    titles: {
      1: 'Bridge Builder',
      2: 'Dialogue Keeper',
      3: 'Connection Weaver',
      4: 'Unity Architect',
    },
    descriptions: {
      1: 'You're starting to invite continued dialogue.',
      2: 'You consistently leave space for more conversation.',
      3: 'You skillfully sustain meaningful exchange.',
      4: 'Every conversation you touch becomes a gateway.',
    }
  },
];

/** Returns current mastery tier (0 = none) for a given average score */
export function getMasteryTier(avgScore) {
  let tier = 0;
  for (const t of MASTERY_TIERS) {
    if (avgScore >= t.threshold) tier = t.tier;
  }
  return tier;
}

/** Get tier config object by tier number (1-4), or null */
export function getTierConfig(tier) {
  return MASTERY_TIERS.find(t => t.tier === tier) || null;
}

/** Get mastery title for a marker at a given tier */
export function getMasteryTitle(markerKey, tier) {
  const marker = MASTERY_MARKERS.find(m => m.key === markerKey);
  if (!marker || tier === 0) return null;
  return marker.titles[tier] || null;
}

/**
 * Compare old and new profile to find newly unlocked mastery tiers per marker.
 * Returns array of { marker, tier, tierConfig, title, description }
 */
export function getNewlyUnlockedMasteries(oldProfile, newProfile) {
  const unlocked = [];
  for (const marker of MASTERY_MARKERS) {
    const oldTier = getMasteryTier(oldProfile?.[marker.key] || 0);
    const newTier = getMasteryTier(newProfile?.[marker.key] || 0);
    if (newTier > oldTier) {
      for (let t = oldTier + 1; t <= newTier; t++) {
        unlocked.push({
          marker,
          tier: t,
          tierConfig: getTierConfig(t),
          title: marker.titles[t],
          description: marker.descriptions[t],
        });
      }
    }
  }
  return unlocked;
}