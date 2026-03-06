import React, { useState } from 'react';
import { Search, X, ChevronDown } from 'lucide-react';

const EMOTION_TAGS = [
  'Frustration', 'Anger', 'Misunderstanding', 'Grief', 'Anxiety',
  'Defensiveness', 'Guilt', 'Loneliness', 'Shame', 'Overwhelm',
];

const ENVIRONMENT_TAGS = [
  'Family Dinner', 'Remote Work', 'Public Spaces', 'Social Media',
  'Workplace Meeting', 'Casual Conversation', 'Crisis Moment', 'Group Setting',
];

function TagPill({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`text-xs px-2.5 py-1 rounded-full border transition-all whitespace-nowrap ${
        active
          ? 'bg-[#C9943A] text-[#1A1A2E] border-[#C9943A] font-medium'
          : 'border-[#2F2F4A] text-[#6B6B8D] hover:border-[#C9943A]/50 hover:text-[#C5C1B8]'
      }`}
    >
      {active && <span className="mr-1">✓</span>}
      {label}
    </button>
  );
}

export default function ScenarioFilters({ filters, onChange }) {
  const [showEmotions, setShowEmotions] = useState(false);
  const [showEnvironments, setShowEnvironments] = useState(false);

  const toggleTag = (type, tag) => {
    const current = filters[type] || [];
    const updated = current.includes(tag)
      ? current.filter(t => t !== tag)
      : [...current, tag];
    onChange({ ...filters, [type]: updated });
  };

  const clearAll = () => onChange({ search: '', emotions: [], environments: [], difficulty: 'All' });

  const activeCount = (filters.emotions?.length || 0) + (filters.environments?.length || 0) +
    (filters.search ? 1 : 0) + (filters.difficulty !== 'All' ? 1 : 0);

  return (
    <div className="space-y-3 mb-6">
      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B6B8D]" />
        <input
          type="text"
          placeholder="Search scenarios..."
          value={filters.search || ''}
          onChange={e => onChange({ ...filters, search: e.target.value })}
          className="w-full bg-[#252542] border border-[#2F2F4A] rounded-xl pl-9 pr-4 py-2.5 text-sm text-[#E8E4DA] placeholder:text-[#6B6B8D] focus:outline-none focus:border-[#C9943A]/50 transition-colors"
        />
        {filters.search && (
          <button onClick={() => onChange({ ...filters, search: '' })} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B6B8D] hover:text-[#C5C1B8]">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Filter row */}
      <div className="flex gap-2 flex-wrap items-center">
        {/* Difficulty */}
        {['All', 'Beginner', 'Intermediate', 'Advanced'].map(d => (
          <TagPill
            key={d}
            label={d}
            active={filters.difficulty === d}
            onClick={() => onChange({ ...filters, difficulty: d })}
          />
        ))}

        <div className="w-px h-4 bg-[#2F2F4A]" />

        {/* Emotion dropdown trigger */}
        <button
          onClick={() => { setShowEmotions(p => !p); setShowEnvironments(false); }}
          className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border transition-all ${
            (filters.emotions?.length > 0) || showEmotions
              ? 'border-[#C9943A]/60 text-[#C9943A] bg-[#C9943A]/10'
              : 'border-[#2F2F4A] text-[#6B6B8D] hover:border-[#C9943A]/50 hover:text-[#C5C1B8]'
          }`}
        >
          😤 Emotion {filters.emotions?.length > 0 && `(${filters.emotions.length})`}
          <ChevronDown className={`w-3 h-3 transition-transform ${showEmotions ? 'rotate-180' : ''}`} />
        </button>

        {/* Environment dropdown trigger */}
        <button
          onClick={() => { setShowEnvironments(p => !p); setShowEmotions(false); }}
          className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border transition-all ${
            (filters.environments?.length > 0) || showEnvironments
              ? 'border-[#C9943A]/60 text-[#C9943A] bg-[#C9943A]/10'
              : 'border-[#2F2F4A] text-[#6B6B8D] hover:border-[#C9943A]/50 hover:text-[#C5C1B8]'
          }`}
        >
          🏠 Environment {filters.environments?.length > 0 && `(${filters.environments.length})`}
          <ChevronDown className={`w-3 h-3 transition-transform ${showEnvironments ? 'rotate-180' : ''}`} />
        </button>

        {activeCount > 0 && (
          <button onClick={clearAll} className="flex items-center gap-1 text-xs text-[#6B6B8D] hover:text-[#C5C1B8] ml-auto">
            <X className="w-3 h-3" /> Clear all
          </button>
        )}
      </div>

      {/* Emotion tag panel */}
      {showEmotions && (
        <div className="bg-[#252542] border border-[#2F2F4A] rounded-xl p-3">
          <p className="text-[10px] text-[#6B6B8D] uppercase tracking-widest mb-2">Emotion</p>
          <div className="flex flex-wrap gap-1.5">
            {EMOTION_TAGS.map(tag => (
              <TagPill
                key={tag}
                label={tag}
                active={filters.emotions?.includes(tag)}
                onClick={() => toggleTag('emotions', tag)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Environment tag panel */}
      {showEnvironments && (
        <div className="bg-[#252542] border border-[#2F2F4A] rounded-xl p-3">
          <p className="text-[10px] text-[#6B6B8D] uppercase tracking-widest mb-2">Environment</p>
          <div className="flex flex-wrap gap-1.5">
            {ENVIRONMENT_TAGS.map(tag => (
              <TagPill
                key={tag}
                label={tag}
                active={filters.environments?.includes(tag)}
                onClick={() => toggleTag('environments', tag)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Active tag chips */}
      {(filters.emotions?.length > 0 || filters.environments?.length > 0) && (
        <div className="flex flex-wrap gap-1.5">
          {filters.emotions?.map(tag => (
            <span key={tag} className="flex items-center gap-1 text-xs bg-[#C9943A]/20 text-[#C9943A] border border-[#C9943A]/30 rounded-full px-2.5 py-0.5">
              😤 {tag}
              <button onClick={() => toggleTag('emotions', tag)}><X className="w-2.5 h-2.5" /></button>
            </span>
          ))}
          {filters.environments?.map(tag => (
            <span key={tag} className="flex items-center gap-1 text-xs bg-[#C9943A]/20 text-[#C9943A] border border-[#C9943A]/30 rounded-full px-2.5 py-0.5">
              🏠 {tag}
              <button onClick={() => toggleTag('environments', tag)}><X className="w-2.5 h-2.5" /></button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}