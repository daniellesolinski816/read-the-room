// User level system based on total accumulated points

export const USER_LEVELS = [
  { level: 1, title: 'Newcomer',        minPoints: 0,    maxPoints: 99,   color: '#6B6B8D', emoji: '🌱' },
  { level: 2, title: 'Listener',        minPoints: 100,  maxPoints: 249,  color: '#8B9E6E', emoji: '👂' },
  { level: 3, title: 'Observer',        minPoints: 250,  maxPoints: 499,  color: '#7C9FB0', emoji: '👁️' },
  { level: 4, title: 'Connector',       minPoints: 500,  maxPoints: 899,  color: '#C9943A', emoji: '🤝' },
  { level: 5, title: 'Empath',          minPoints: 900,  maxPoints: 1499, color: '#C9943A', emoji: '💛' },
  { level: 6, title: 'Practitioner',    minPoints: 1500, maxPoints: 2499, color: '#A0A0A0', emoji: '⚗️' },
  { level: 7, title: 'Expert',          minPoints: 2500, maxPoints: 3999, color: '#C9943A', emoji: '🏆' },
  { level: 8, title: 'Sage',            minPoints: 4000, maxPoints: 5999, color: '#7C6FCD', emoji: '🔮' },
  { level: 9, title: 'Master Empath',   minPoints: 6000, maxPoints: 9999, color: '#7C6FCD', emoji: '✨' },
  { level: 10,title: 'Empathy Enigma',  minPoints: 10000,maxPoints: Infinity, color: '#FFD700', emoji: '🌟' },
];

export function getUserLevel(totalPoints = 0) {
  let current = USER_LEVELS[0];
  for (const lvl of USER_LEVELS) {
    if (totalPoints >= lvl.minPoints) current = lvl;
  }
  return current;
}

export function getLevelProgress(totalPoints = 0) {
  const current = getUserLevel(totalPoints);
  if (current.maxPoints === Infinity) return { current, next: null, pct: 100 };
  const next = USER_LEVELS.find(l => l.level === current.level + 1) || null;
  const pct = Math.min(100, Math.round(
    ((totalPoints - current.minPoints) / (current.maxPoints - current.minPoints + 1)) * 100
  ));
  return { current, next, pct };
}