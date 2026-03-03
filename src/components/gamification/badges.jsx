// Badge definitions for The Empathy Enigma gamification system

export const BADGES = [
  {
    id: 'first_step',
    label: 'First Step',
    emoji: '🌱',
    description: 'Complete your first scenario',
    condition: (p) => (p.total_sessions || 0) >= 1,
  },
  {
    id: 'consistent_responder',
    label: 'Consistent Responder',
    emoji: '🔁',
    description: 'Play 10 solo sessions',
    condition: (p) => (p.total_sessions || 0) >= 10,
  },
  {
    id: 'empathy_master',
    label: 'Empathy Master',
    emoji: '🏆',
    description: 'Reach an average score of 80+',
    condition: (p) => (p.average_score || 0) >= 80,
  },
  {
    id: 'streak_3',
    label: 'On a Roll',
    emoji: '🔥',
    description: 'Maintain a 3-day streak',
    condition: (p) => (p.longest_streak || 0) >= 3,
  },
  {
    id: 'streak_7',
    label: 'Week Warrior',
    emoji: '⚡',
    description: 'Maintain a 7-day streak',
    condition: (p) => (p.longest_streak || 0) >= 7,
  },
  {
    id: 'deep_listener',
    label: 'Deep Listener',
    emoji: '👂',
    description: 'Score 20+ on Acknowledgment on average',
    condition: (p) => (p.avg_acknowledgment || 0) >= 20,
  },
  {
    id: 'curious_mind',
    label: 'Curious Mind',
    emoji: '🔍',
    description: 'Score 20+ on Curiosity on average',
    condition: (p) => (p.avg_curiosity || 0) >= 20,
  },
  {
    id: 'open_door',
    label: 'Open Door',
    emoji: '🚪',
    description: 'Score 20+ on Door Open on average',
    condition: (p) => (p.avg_door_open || 0) >= 20,
  },
  {
    id: 'multiplayer_debut',
    label: 'Social Player',
    emoji: '🤝',
    description: 'Complete your first multiplayer game',
    condition: (p) => (p.multiplayer_sessions || 0) >= 1,
  },
  {
    id: 'centurion',
    label: 'Centurion',
    emoji: '💯',
    description: 'Earn 1000 total points',
    condition: (p) => (p.total_points || 0) >= 1000,
  },
  {
    id: 'veteran',
    label: 'Veteran',
    emoji: '🎖️',
    description: 'Play 50 sessions',
    condition: (p) => (p.total_sessions || 0) >= 50,
  },
  {
    id: 'perfect_round',
    label: 'Perfect Round',
    emoji: '✨',
    description: 'Score 90+ in any single session',
    condition: (p, sessions) => sessions?.some(s => (s.total_score || 0) >= 90),
  },
];

/** Returns array of badge IDs the user has earned */
export function getEarnedBadgeIds(profile, sessions = []) {
  return BADGES.filter(b => b.condition(profile, sessions)).map(b => b.id);
}

/** Compute points for a session score */
export function scoreToPoints(totalScore) {
  let pts = Math.round(totalScore * 0.5);
  if (totalScore >= 90) pts += 25;
  else if (totalScore >= 75) pts += 10;
  else if (totalScore >= 60) pts += 5;
  return pts;
}