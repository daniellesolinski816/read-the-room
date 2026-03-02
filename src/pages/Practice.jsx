import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, Target, Heart, Zap, Clock, MessageSquare, Loader2, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Logo from '@/components/brand/Logo';
import ScenarioCard from '@/components/game/ScenarioCard';
import ResponseInput from '@/components/game/ResponseInput';
import EmpathyScore from '@/components/game/EmpathyScore';
import Reflection from '@/components/game/Reflection';
import PremiumBadge from '@/components/brand/PremiumBadge';

const MARKERS = [
  { key: 'acknowledgment', icon: Heart, label: 'Acknowledgment', description: 'Recognize feelings' },
  { key: 'curiosity', icon: Zap, label: 'Curiosity', description: 'Ask & explore' },
  { key: 'nonjudgment', icon: Target, label: 'Non-judgment', description: 'Avoid verdicts' },
  { key: 'door_open', icon: MessageSquare, label: 'Door Open', description: 'Keep dialogue open' },
];

export default function Practice() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [scenario, setScenario] = useState(null);
  const [response, setResponse] = useState('');
  const [gameState, setGameState] = useState('pick'); // pick | playing | evaluating | results
  const [result, setResult] = useState(null);

  useEffect(() => {
    base44.auth.me().then(async (u) => {
      setUser(u);
      const profiles = await base44.entities.UserProfile.filter({ user_id: u.email });
      setProfile(profiles[0] || null);
    }).catch(() => {});
  }, []);

  const isPremium = profile?.is_premium;

  const generateScenario = async (marker) => {
    setGameState('playing');
    setScenario(null);
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a scenario designer for The Empathy Enigma. Generate a real-life scenario specifically designed to practice the empathy marker: "${marker.label}" (${marker.description}).

The scenario should demand this marker to respond well. Written in second person, 2-3 sentences, emotionally charged but no clear political answer. Diverse and modern.

Return JSON: { "title": "<3-6 word title>", "category": "<one of: Family|Community|Digital|Civic|Workplace|Personal|Reflection>", "prompt": "<scenario text>" }`,
      response_json_schema: {
        type: "object",
        properties: {
          title: { type: "string" },
          category: { type: "string" },
          prompt: { type: "string" }
        },
        required: ["title", "category", "prompt"]
      }
    });
    setScenario({ id: `practice-${Date.now()}`, ...result });
  };

  const handleMarkerSelect = (marker) => {
    setSelectedMarker(marker);
    generateScenario(marker);
  };

  const handleSubmit = async () => {
    if (!response.trim() || !scenario) return;
    setGameState('evaluating');

    const evalResult = await base44.integrations.Core.InvokeLLM({
      prompt: `You are an empathy coach. Evaluate this response for the scenario below, with special focus on the "${selectedMarker.label}" marker.

SCENARIO: "${scenario.prompt}"
RESPONSE: "${response}"

Score each 0-25:
1. Acknowledgment 2. Curiosity 3. Non-judgment 4. Door Open

Return JSON: { "acknowledgment": <0-25>, "curiosity": <0-25>, "nonjudgment": <0-25>, "door_open": <0-25>, "reflection": "<2-3 sentences focused on ${selectedMarker.label} specifically>", "alternative_response": "<higher-empathy alternative>" }`,
      response_json_schema: {
        type: "object",
        properties: {
          acknowledgment: { type: "number" },
          curiosity: { type: "number" },
          nonjudgment: { type: "number" },
          door_open: { type: "number" },
          reflection: { type: "string" },
          alternative_response: { type: "string" }
        },
        required: ["acknowledgment", "curiosity", "nonjudgment", "door_open", "reflection", "alternative_response"]
      }
    });

    setResult({ ...evalResult, total_score: evalResult.acknowledgment + evalResult.curiosity + evalResult.nonjudgment + evalResult.door_open });
    setGameState('results');
  };

  const handleReset = () => {
    setGameState('pick');
    setSelectedMarker(null);
    setScenario(null);
    setResponse('');
    setResult(null);
  };

  if (!isPremium) {
    return (
      <div className="min-h-screen bg-[#1A1A2E]">
        <header className="p-4 flex items-center justify-between border-b border-[#2F2F4A]">
          <Link to={createPageUrl('Home')}>
            <Button variant="ghost" size="icon" className="text-[#C5C1B8] hover:text-[#C9943A]">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <Logo size="small" />
          <div className="w-10" />
        </header>
        <main className="max-w-md mx-auto px-4 py-20 text-center">
          <div className="w-14 h-14 rounded-full bg-[#C9943A]/10 flex items-center justify-center mx-auto mb-5">
            <Lock className="w-7 h-7 text-[#C9943A]/50" />
          </div>
          <h2 className="font-serif text-2xl text-[#E8E4DA] mb-3">Targeted Practice</h2>
          <p className="text-[#C5C1B8] text-sm mb-6 leading-relaxed">
            Choose a specific empathy marker to work on. AI generates scenarios tailored exactly to your growth area.
          </p>
          <Link to={createPageUrl('Premium')}>
            <Button className="bg-[#C9943A] hover:bg-[#D4A94D] text-[#1A1A2E] font-semibold px-8 h-12">
              Unlock with Premium
            </Button>
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1A1A2E]">
      <header className="p-4 flex items-center justify-between border-b border-[#2F2F4A]">
        <Button variant="ghost" size="icon" onClick={gameState === 'pick' ? undefined : handleReset} className="text-[#C5C1B8] hover:text-[#C9943A]">
          {gameState === 'pick' ? (
            <Link to={createPageUrl('Home')}><ArrowLeft className="w-5 h-5" /></Link>
          ) : (
            <ArrowLeft className="w-5 h-5" />
          )}
        </Button>
        <Logo size="small" />
        <PremiumBadge compact />
      </header>

      <main className="max-w-lg mx-auto px-4 py-8">
        {/* Pick Marker */}
        {gameState === 'pick' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h2 className="font-serif text-2xl text-[#E8E4DA] mb-2 text-center">What do you want to practice?</h2>
            <p className="text-[#6B6B8D] text-sm text-center mb-8">Pick a marker and AI will build a scenario around it.</p>
            <div className="grid grid-cols-2 gap-3">
              {MARKERS.map(({ key, icon: Icon, label, description }) => (
                <button
                  key={key}
                  onClick={() => handleMarkerSelect({ key, label, description })}
                  className="bg-[#252542] border border-[#2F2F4A] rounded-xl p-5 text-left hover:border-[#C9943A]/50 hover:bg-[#252542]/80 transition-all active:scale-95"
                >
                  <Icon className="w-6 h-6 text-[#C9943A] mb-3" />
                  <p className="text-[#E8E4DA] font-medium text-sm">{label}</p>
                  <p className="text-[#6B6B8D] text-xs mt-1">{description}</p>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Playing — Loading Scenario */}
        {gameState === 'playing' && !scenario && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Loader2 className="w-10 h-10 text-[#C9943A] animate-spin" />
            <p className="text-[#C5C1B8] font-serif text-lg">Crafting your scenario…</p>
          </div>
        )}

        {/* Playing — Scenario Ready */}
        {gameState === 'playing' && scenario && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#6B6B8D] uppercase tracking-widest">Practicing</span>
              <span className="text-xs bg-[#C9943A]/15 text-[#C9943A] px-3 py-1 rounded-full border border-[#C9943A]/30">
                {selectedMarker.label}
              </span>
            </div>
            <ScenarioCard scenario={scenario} />
            <ResponseInput value={response} onChange={setResponse} onSubmit={handleSubmit} />
          </motion.div>
        )}

        {/* Evaluating */}
        {gameState === 'evaluating' && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Loader2 className="w-10 h-10 text-[#C9943A] animate-spin" />
            <p className="text-[#C5C1B8] font-serif text-lg">Reading the room…</p>
          </div>
        )}

        {/* Results */}
        {gameState === 'results' && result && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <EmpathyScore scores={{ acknowledgment: result.acknowledgment, curiosity: result.curiosity, nonjudgment: result.nonjudgment, door_open: result.door_open }} />
            <Reflection reflection={result.reflection} alternativeResponse={result.alternative_response} />
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1 h-12 border-[#2F2F4A] text-[#C5C1B8] hover:bg-[#252542]" onClick={() => { setResponse(''); setGameState('playing'); setScenario(null); generateScenario(selectedMarker); }}>
                New Scenario
              </Button>
              <Button className="flex-1 h-12 bg-[#C9943A] hover:bg-[#D4A94D] text-[#1A1A2E]" onClick={handleReset}>
                Change Focus
              </Button>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}