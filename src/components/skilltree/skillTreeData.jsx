// Skill tree definition — three branches, each with 4 nodes
// unlock_condition: what profile metric / badge / session count is required

export const SKILL_BRANCHES = [
  {
    id: 'active_listening',
    label: 'Active Listening',
    icon: '👂',
    color: '#7C6FCD',
    description: 'Tune in fully, reflect back, and signal deep presence.',
    nodes: [
      {
        id: 'al_1',
        level: 1,
        title: 'Presence',
        description: 'Simply show up without distraction.',
        badge: '👂',
        unlock_condition: { type: 'sessions', value: 1 },
        unlock_label: 'Complete 1 session',
      },
      {
        id: 'al_2',
        level: 2,
        title: 'Reflection',
        description: 'Mirror back what you hear to confirm understanding.',
        badge: '🔁',
        unlock_condition: { type: 'avg_acknowledgment', value: 10 },
        unlock_label: 'Avg Acknowledgment ≥ 10',
      },
      {
        id: 'al_3',
        level: 3,
        title: 'Deep Resonance',
        description: 'Connect emotional meaning beneath the words.',
        badge: '💡',
        unlock_condition: { type: 'avg_acknowledgment', value: 17 },
        unlock_label: 'Avg Acknowledgment ≥ 17',
      },
      {
        id: 'al_4',
        level: 4,
        title: 'Empathic Ear',
        description: 'Master-level listener who holds space without judgment.',
        badge: '🌟',
        unlock_condition: { type: 'avg_acknowledgment', value: 22 },
        unlock_label: 'Avg Acknowledgment ≥ 22',
      },
    ],
  },
  {
    id: 'conflict_deescalation',
    label: 'Conflict De-escalation',
    icon: '🕊️',
    color: '#C9943A',
    description: 'Lower the temperature, create safety, find common ground.',
    nodes: [
      {
        id: 'cd_1',
        level: 1,
        title: 'Steady Ground',
        description: 'Stay calm when tension rises.',
        badge: '🕊️',
        unlock_condition: { type: 'sessions', value: 3 },
        unlock_label: 'Complete 3 sessions',
      },
      {
        id: 'cd_2',
        level: 2,
        title: 'Bridge Builder',
        description: 'Acknowledge the other side before making your point.',
        badge: '🌉',
        unlock_condition: { type: 'avg_nonjudgment', value: 10 },
        unlock_label: 'Avg Non-Judgment ≥ 10',
      },
      {
        id: 'cd_3',
        level: 3,
        title: 'Tension Diffuser',
        description: 'Use language that opens rather than closes.',
        badge: '🌡️',
        unlock_condition: { type: 'avg_nonjudgment', value: 17 },
        unlock_label: 'Avg Non-Judgment ≥ 17',
      },
      {
        id: 'cd_4',
        level: 4,
        title: 'Peace Architect',
        description: 'Consistently transform conflict into connection.',
        badge: '✨',
        unlock_condition: { type: 'avg_nonjudgment', value: 22 },
        unlock_label: 'Avg Non-Judgment ≥ 22',
      },
    ],
  },
  {
    id: 'nonviolent_communication',
    label: 'Non-Violent Communication',
    icon: '💬',
    color: '#5BA88C',
    description: 'Express needs and feelings without blame or judgment.',
    nodes: [
      {
        id: 'nvc_1',
        level: 1,
        title: 'Observation',
        description: 'Separate facts from interpretations.',
        badge: '🔍',
        unlock_condition: { type: 'sessions', value: 5 },
        unlock_label: 'Complete 5 sessions',
      },
      {
        id: 'nvc_2',
        level: 2,
        title: 'Feelings First',
        description: 'Name your emotional state without projecting it.',
        badge: '💛',
        unlock_condition: { type: 'avg_door_open', value: 10 },
        unlock_label: 'Avg Door Open ≥ 10',
      },
      {
        id: 'nvc_3',
        level: 3,
        title: 'Needs Articulator',
        description: 'Clearly express underlying needs without demands.',
        badge: '🌱',
        unlock_condition: { type: 'avg_door_open', value: 17 },
        unlock_label: 'Avg Door Open ≥ 17',
      },
      {
        id: 'nvc_4',
        level: 4,
        title: 'Compassionate Voice',
        description: 'Speak truth with love — the hallmark of NVC mastery.',
        badge: '💜',
        unlock_condition: { type: 'avg_door_open', value: 22 },
        unlock_label: 'Avg Door Open ≥ 22',
      },
    ],
  },
  {
    id: 'curiosity',
    label: 'Curious Inquiry',
    icon: '🔭',
    color: '#5B9EC9',
    description: 'Ask questions that open doors rather than close them.',
    nodes: [
      {
        id: 'ci_1',
        level: 1,
        title: 'Open Questions',
        description: 'Replace "why" with "what" and "how".',
        badge: '❓',
        unlock_condition: { type: 'sessions', value: 7 },
        unlock_label: 'Complete 7 sessions',
      },
      {
        id: 'ci_2',
        level: 2,
        title: 'Perspective Seeker',
        description: 'Genuinely want to understand, not just respond.',
        badge: '🔭',
        unlock_condition: { type: 'avg_curiosity', value: 10 },
        unlock_label: 'Avg Curiosity ≥ 10',
      },
      {
        id: 'ci_3',
        level: 3,
        title: 'Assumption Buster',
        description: 'Notice and challenge your own assumptions first.',
        badge: '🧩',
        unlock_condition: { type: 'avg_curiosity', value: 17 },
        unlock_label: 'Avg Curiosity ≥ 17',
      },
      {
        id: 'ci_4',
        level: 4,
        title: 'Wonder Keeper',
        description: 'Approach every interaction with genuine curiosity.',
        badge: '🌌',
        unlock_condition: { type: 'avg_curiosity', value: 22 },
        unlock_label: 'Avg Curiosity ≥ 22',
      },
    ],
  },
];

/**
 * Compute which nodes are unlocked based on profile data.
 * Returns a Set of unlocked node IDs.
 */
export function computeUnlockedNodes(profile) {
  const unlocked = new Set();
  if (!profile) return unlocked;

  const sessions = profile.total_sessions || 0;

  SKILL_BRANCHES.forEach(branch => {
    branch.nodes.forEach(node => {
      const { type, value } = node.unlock_condition;
      if (type === 'sessions' && sessions >= value) {
        unlocked.add(node.id);
      } else if (type !== 'sessions') {
        const metric = profile[type] || 0;
        if (metric >= value) unlocked.add(node.id);
      }
    });
  });

  return unlocked;
}