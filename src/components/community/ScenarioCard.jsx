import React, { useState } from 'react';
import { Star, Heart, Play } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const CATEGORY_COLORS = {
  Family: 'bg-rose-900/30 text-rose-300',
  Community: 'bg-blue-900/30 text-blue-300',
  Digital: 'bg-purple-900/30 text-purple-300',
  Civic: 'bg-amber-900/30 text-amber-300',
  Workplace: 'bg-teal-900/30 text-teal-300',
  Personal: 'bg-pink-900/30 text-pink-300',
  Reflection: 'bg-indigo-900/30 text-indigo-300',
};

export default function CommunityScenarioCard({ scenario, interaction, userId, onInteractionChange }) {
  const [localInteraction, setLocalInteraction] = useState(interaction || {});
  const [savingRating, setSavingRating] = useState(false);
  const [hoveredStar, setHoveredStar] = useState(0);

  const toggleFavorite = async () => {
    const newVal = !localInteraction.is_favorite;
    setLocalInteraction(i => ({ ...i, is_favorite: newVal }));

    const delta = newVal ? 1 : -1;
    await base44.entities.CommunityScenario.update(scenario.id, {
      favorite_count: Math.max(0, (scenario.favorite_count || 0) + delta),
    });

    if (localInteraction.id) {
      await base44.entities.ScenarioInteraction.update(localInteraction.id, { is_favorite: newVal });
    } else {
      const created = await base44.entities.ScenarioInteraction.create({
        user_id: userId,
        scenario_id: scenario.id,
        is_favorite: newVal,
      });
      setLocalInteraction(i => ({ ...i, id: created.id }));
    }
    onInteractionChange?.();
  };

  const submitRating = async (stars) => {
    if (savingRating) return;
    setSavingRating(true);
    const prevRating = localInteraction.rating || 0;
    const prevCount = scenario.rating_count || 0;
    const prevAvg = scenario.avg_rating || 0;

    let newCount = prevCount;
    let newAvg;
    if (prevRating === 0) {
      newCount = prevCount + 1;
      newAvg = (prevAvg * prevCount + stars) / newCount;
    } else {
      newAvg = (prevAvg * prevCount - prevRating + stars) / prevCount;
    }

    setLocalInteraction(i => ({ ...i, rating: stars }));

    await base44.entities.CommunityScenario.update(scenario.id, {
      avg_rating: Math.round(newAvg * 10) / 10,
      rating_count: newCount,
    });

    if (localInteraction.id) {
      await base44.entities.ScenarioInteraction.update(localInteraction.id, { rating: stars });
    } else {
      const created = await base44.entities.ScenarioInteraction.create({
        user_id: userId,
        scenario_id: scenario.id,
        rating: stars,
        is_favorite: false,
      });
      setLocalInteraction(i => ({ ...i, id: created.id }));
    }
    onInteractionChange?.();
    setSavingRating(false);
  };

  const displayStars = hoveredStar || localInteraction.rating || 0;

  return (
    <div className="bg-[#252542] rounded-xl p-5 border border-[#2F2F4A] hover:border-[#C9943A]/30 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORY_COLORS[scenario.category] || 'bg-gray-800 text-gray-300'}`}>
          {scenario.category}
        </span>
        <div className="flex items-center gap-3">
          <button
            onClick={toggleFavorite}
            className={`transition-colors ${localInteraction.is_favorite ? 'text-rose-400' : 'text-[#6B6B8D] hover:text-rose-400'}`}
          >
            <Heart className={`w-4 h-4 ${localInteraction.is_favorite ? 'fill-current' : ''}`} />
          </button>
          {scenario.favorite_count > 0 && (
            <span className="text-xs text-[#6B6B8D]">{scenario.favorite_count}</span>
          )}
        </div>
      </div>

      <h3 className="font-serif text-base text-[#E8E4DA] mb-2">{scenario.title}</h3>
      <p className="text-[#C5C1B8] text-sm leading-relaxed line-clamp-3 mb-4">{scenario.prompt}</p>

      <div className="flex items-center justify-between">
        {/* Star rating */}
        <div className="flex items-center gap-0.5">
          {[1, 2, 3, 4, 5].map(star => (
            <button
              key={star}
              onMouseEnter={() => setHoveredStar(star)}
              onMouseLeave={() => setHoveredStar(0)}
              onClick={() => submitRating(star)}
              className="text-[#C9943A] transition-transform hover:scale-110"
            >
              <Star className={`w-3.5 h-3.5 ${star <= displayStars ? 'fill-current' : 'opacity-30'}`} />
            </button>
          ))}
          {scenario.avg_rating > 0 && (
            <span className="text-xs text-[#6B6B8D] ml-1">{scenario.avg_rating.toFixed(1)}</span>
          )}
        </div>

        <p className="text-xs text-[#6B6B8D]">by {scenario.submitted_by_name}</p>
      </div>
    </div>
  );
}