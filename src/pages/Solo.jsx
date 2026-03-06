import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, RotateCcw, ArrowRight, Loader2, SkipForward, Sparkles, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Logo from '@/components/brand/Logo';
import ScenarioCard from '@/components/game/ScenarioCard';
import Timer from '@/components/game/Timer';
import ResponseInput from '@/components/game/ResponseInput';
import EmpathyScore from '@/components/game/EmpathyScore';
import Reflection from '@/components/game/Reflection';
import GenerateScenario from '@/components/game/GenerateScenario';
import PointsToast from '@/components/gamification/PointsToast';
import { scoreToPoints, getEarnedBadgeIds, BADGES } from '@/components/gamification/badges';
import MasteryUnlockToast from '@/components/gamification/MasteryUnlockToast';
import { getNewlyUnlockedMasteries } from '@/components/gamification/masteryLevels';
import ShareResultCard from '@/components/game/ShareResultCard';
import ScenarioFilters from '@/components/game/ScenarioFilters';

const TIMER_OPTIONS = [30, 60, 90, 120];

export default function Solo() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const scenarioIdFromUrl = urlParams.get('scenarioId');
  
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [currentScenarioIndex, setCurrentScenarioIndex] = useState(0);
  const [selectedScenarioId, setSelectedScenarioId] = useState(scenarioIdFromUrl);
  const [response, setResponse] = useState('');
  const [gameState, setGameState] = useState('playing');
  const [evaluationResult, setEvaluationResult] = useState(null);
  const [timerRunning, setTimerRunning] = useState(true);
  const [startTime, setStartTime] = useState(Date.now());
  const [timerDuration, setTimerDuration] = useState(60);
  const [showTimerPicker, setShowTimerPicker] = useState(false);
  const [filters, setFilters] = useState({ search: '', difficulty: 'All', emotions: [], environments: [] });
  const [aiScenario, setAiScenario] = useState(null);
  const [pointsEarned, setPointsEarned] = useState(null);
  const [newBadges, setNewBadges] = useState([]);
  const [newMasteries, setNewMasteries] = useState([]);
  
  useEffect(() => {
    base44.auth.me().then(async (u) => {
      setUser(u);
      const profiles = await base44.entities.UserProfile.filter({ user_id: u.email });
      if (profiles.length > 0) {
        setProfile(profiles[0]);
      } else {
        const newProfile = await base44.entities.UserProfile.create({
          user_id: u.email,
          display_name: u.full_name,
          timer_enabled: true
        });
        setProfile(newProfile);
      }
    }).catch(() => {});
  }, []);

  const { data: scenarios = [], isLoading: loadingScenarios } = useQuery({
    queryKey: ['scenarios'],
    queryFn: () => base44.entities.Scenario.list('order')
  });

  const filteredScenarios = scenarios.filter(s => {
    if (filters.difficulty !== 'All' && s.difficulty !== filters.difficulty && !(filters.difficulty === 'Intermediate' && !s.difficulty)) return false;
    if (filters.search) {
      const q = filters.search.toLowerCase();
      if (!s.title?.toLowerCase().includes(q) && !s.prompt?.toLowerCase().includes(q)) return false;
    }
    if (filters.emotions?.length > 0 && !filters.emotions.some(t => s.emotion_tags?.includes(t))) return false;
    if (filters.environments?.length > 0 && !filters.environments.some(t => s.environment_tags?.includes(t))) return false;
    return true;
  });

  const currentScenario = aiScenario || (selectedScenarioId 
    ? scenarios.find(s => s.id === selectedScenarioId) 
    : (filteredScenarios[currentScenarioIndex % Math.max(filteredScenarios.length, 1)] || scenarios[0]));

  const submitMutation = useMutation({
    mutationFn: async () => {
      setGameState('evaluating');
      const timeTaken = Math.round((Date.now() - startTime) / 1000);
      
      const contextLevel = profile?.context_level || 'adult';
      const contextNote = contextLevel === 'teen'
        ? 'The player is a teenager or adolescent. Use age-appropriate language and examples in your reflection and alternative response.'
        : contextLevel === 'professional'
        ? 'The player is a professional. They may be navigating workplace, civic, or leadership dynamics. Your alternative response should reflect that sophistication.'
        : 'The player is an adult with life experience. Your reflection and alternative response should be realistic and nuanced — not naive or preachy.';

      const prompt = `You are an empathy coach evaluating a player's response to a charged real-world scenario as part of The Empathy Enigma's Read the Room game. Your job is not to assess whether they gave the 'right' political answer — there is no right political answer. Your job is to evaluate how empathic their communication was across four markers.

IMPORTANT: Sometimes choosing NOT to engage IS the most empathic choice — for example, when a conversation involves hate speech, dehumanizing language, or content that is psychologically unsafe. If the player chose to disengage, protect themselves, or exit the conversation, recognize that as a potentially wise and self-protective act. Score "Door Open" based on whether they left room for future connection if appropriate, not whether they continued a harmful exchange.

PLAYER CONTEXT: ${contextNote}

SCENARIO:
"${currentScenario.prompt}"

PLAYER'S RESPONSE:
"${response}"

Evaluate the response across these four markers, scoring each 0-25:
1. Acknowledgment — did they recognize the other person's position or feelings? (Note: choosing not to engage with hateful content can itself be a form of acknowledgment of one's own limits)
2. Curiosity — did they ask a question or show genuine interest in understanding? (Not required if the content was harmful)
3. Non-judgment — did they avoid closing with a verdict about the other person?
4. Door Open — does the response leave room for future connection, OR appropriately close a harmful exchange?

Return your evaluation in this exact JSON format:
{
  "acknowledgment": <0-25>,
  "curiosity": <0-25>,
  "nonjudgment": <0-25>,
  "door_open": <0-25>,
  "reflection": "<2-3 sentences of specific, realistic reflection — what did their response communicate, what might the other person have heard, and what is one concrete thing they could do differently (or affirmation that disengaging was valid). Keep the tone warm, direct, and non-preachy. Never open with praise like 'Great job' or 'Well done.'>",
  "alternative_response": "<One realistic alternative that demonstrates higher empathy. VOICE RULES — write the way a real person actually talks, NOT a therapist, NOT HR, NOT a school counselor. These exact phrases are FORBIDDEN: 'I hear that you're feeling...', 'It sounds like...', 'I want to make sure I understand...', 'I appreciate you sharing that', 'That must be really hard for you', 'I can see why you feel that way.' A real response can include your own reaction before turning toward curiosity. It can be slightly imperfect or even a little clumsy. It should sound like something said out loud — at a dinner table, in a hallway — not written at a desk. Short is often more real than long. If disengaging was appropriate, offer a brief dignified exit, not a speech.>"
}`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
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

      const totalScore = result.acknowledgment + result.curiosity + result.nonjudgment + result.door_open;

      if (user) {
        await base44.entities.GameSession.create({
          user_id: user.email,
          scenario_id: currentScenario.id,
          scenario_category: currentScenario.category,
          response: response,
          score_acknowledgment: result.acknowledgment,
          score_curiosity: result.curiosity,
          score_nonjudgment: result.nonjudgment,
          score_door_open: result.door_open,
          total_score: totalScore,
          ai_reflection: result.reflection,
          alternative_response: result.alternative_response,
          time_taken_seconds: timeTaken,
          mode: 'solo'
        });

        const sessions = await base44.entities.GameSession.filter({ user_id: user.email });
        const avgScore = sessions.reduce((sum, s) => sum + (s.total_score || 0), 0) / sessions.length;
        const avgAck = sessions.reduce((sum, s) => sum + (s.score_acknowledgment || 0), 0) / sessions.length;
        const avgCur = sessions.reduce((sum, s) => sum + (s.score_curiosity || 0), 0) / sessions.length;
        const avgNon = sessions.reduce((sum, s) => sum + (s.score_nonjudgment || 0), 0) / sessions.length;
        const avgDoor = sessions.reduce((sum, s) => sum + (s.score_door_open || 0), 0) / sessions.length;
        
        const byCategory = {};
        sessions.forEach(s => {
          if (!byCategory[s.scenario_category]) byCategory[s.scenario_category] = [];
          byCategory[s.scenario_category].push(s.total_score || 0);
        });
        const scoresByCategory = {};
        Object.keys(byCategory).forEach(cat => {
          scoresByCategory[cat] = byCategory[cat].reduce((a, b) => a + b, 0) / byCategory[cat].length;
        });

        const today = new Date().toISOString().split('T')[0];
        let streak = profile?.current_streak || 0;
        if (profile?.last_played_date !== today) {
          const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
          streak = profile?.last_played_date === yesterday ? streak + 1 : 1;
        }

        const pts = scoreToPoints(totalScore);
        const newTotal = (profile?.total_points || 0) + pts;

        const updatedProfile = {
          ...profile,
          total_sessions: sessions.length,
          average_score: avgScore,
          avg_acknowledgment: avgAck,
          avg_curiosity: avgCur,
          avg_nonjudgment: avgNon,
          avg_door_open: avgDoor,
          total_points: newTotal,
          current_streak: streak,
          longest_streak: Math.max(streak, profile?.longest_streak || 0),
        };
        const prevBadgeIds = profile?.earned_badges || [];
        const newBadgeIds = getEarnedBadgeIds(updatedProfile, sessions);
        const freshBadges = BADGES.filter(b => newBadgeIds.includes(b.id) && !prevBadgeIds.includes(b.id));

        const freshMasteries = getNewlyUnlockedMasteries(profile, updatedProfile);

        await base44.entities.UserProfile.update(profile.id, {
          total_sessions: sessions.length,
          average_score: avgScore,
          avg_acknowledgment: avgAck,
          avg_curiosity: avgCur,
          avg_nonjudgment: avgNon,
          avg_door_open: avgDoor,
          scores_by_category: scoresByCategory,
          current_streak: streak,
          longest_streak: Math.max(streak, profile?.longest_streak || 0),
          last_played_date: today,
          total_points: newTotal,
          earned_badges: newBadgeIds,
        });

        setProfile({ ...updatedProfile, earned_badges: newBadgeIds });
        setPointsEarned(pts);
        setNewBadges(freshBadges);
        setNewMasteries(freshMasteries);
      }

      return { ...result, total_score: totalScore };
    },
    onSuccess: (data) => {
      setEvaluationResult(data);
      setGameState('results');
    }
  });

  const handleSubmit = () => {
    if (!response.trim()) return;
    setTimerRunning(false);
    submitMutation.mutate();
  };

  const handleTimerComplete = () => {
    if (response.trim()) {
      handleSubmit();
    }
  };

  const handleReplay = () => {
    setResponse('');
    setGameState('playing');
    setEvaluationResult(null);
    setTimerRunning(true);
    setStartTime(Date.now());
    setPointsEarned(null);
    setNewBadges([]);
    setNewMasteries([]);
  };

  const handleNext = () => {
    setAiScenario(null);
    setSelectedScenarioId(null);
    setCurrentScenarioIndex(prev => (prev + 1) % scenarios.length);
    handleReplay();
  };

  const handleAiScenario = (scenario) => {
    setAiScenario(scenario);
    handleReplay();
  };

  if (loadingScenarios) {
    return (
      <div className="min-h-screen bg-[#1A1A2E] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#C9943A] animate-spin" />
      </div>
    );
  }

  if (!currentScenario) {
    return (
      <div className="min-h-screen bg-[#1A1A2E] flex items-center justify-center">
        <p className="text-[#C5C1B8]">No scenarios available</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1A1A2E]">
      {pointsEarned !== null && (
        <PointsToast
          points={pointsEarned}
          newBadges={newBadges}
          onDone={() => { setPointsEarned(null); setNewBadges([]); }}
        />
      )}

      {newMasteries.length > 0 && (
        <MasteryUnlockToast
          masteries={newMasteries}
          onDone={() => setNewMasteries([])}
        />
      )}

      <header className="p-4 flex items-center justify-between border-b border-[#2F2F4A]">
        <Link to={createPageUrl('Home')}>
          <Button variant="ghost" size="icon" className="text-[#C5C1B8] hover:text-[#C9943A]">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <Logo size="small" />
        <div className="flex items-center gap-2">
          {profile?.total_points != null && (
            <span className="text-xs text-[#C9943A] font-medium bg-[#C9943A]/10 px-2 py-1 rounded-full">
              ⭐ {profile.total_points} pts
            </span>
          )}
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        {gameState === 'playing' && (
          <>
            <div className="flex items-center justify-between mb-3">
              <Link to={createPageUrl('Profile') + '?openSettings=1'} className="text-xs text-[#6B6B8D] hover:text-[#C9943A] underline underline-offset-2 transition-colors ml-auto">
                Set your age / context level →
              </Link>
            </div>

            <ScenarioFilters
              filters={filters}
              onChange={(f) => { setFilters(f); setCurrentScenarioIndex(0); }}
            />

            <div className="flex items-center justify-between mb-6">
              <h2 className="font-serif text-xl text-[#E8E4DA]">Quick Draw</h2>
              <div className="flex items-center gap-3">
                <GenerateScenario
                  isPremium={profile?.is_premium}
                  onScenarioGenerated={handleAiScenario}
                />
                {profile?.timer_enabled !== false && (
                  <div className="flex flex-col items-end gap-1">
                    <Timer 
                      duration={timerDuration} 
                      onComplete={handleTimerComplete}
                      isRunning={timerRunning}
                    />
                    {profile?.is_premium && (
                      <div className="relative">
                        <button
                          onClick={() => setShowTimerPicker(p => !p)}
                          className="text-[10px] text-[#C9943A] hover:text-[#D4A94D] bg-[#C9943A]/10 px-2 py-0.5 rounded-full border border-[#C9943A]/30"
                        >
                          {timerDuration}s ▾
                        </button>
                        {showTimerPicker && (
                          <div className="absolute top-full mt-1 right-0 bg-[#252542] border border-[#2F2F4A] rounded-xl shadow-xl z-20 overflow-hidden min-w-[110px]">
                            <p className="text-[10px] text-[#6B6B8D] px-4 pt-2 pb-1 uppercase tracking-widest">Timer length</p>
                            {TIMER_OPTIONS.map(opt => (
                              <button
                                key={opt}
                                onClick={() => { setTimerDuration(opt); setShowTimerPicker(false); handleReplay(); }}
                                className={`flex items-center justify-between w-full px-4 py-2 text-sm text-left hover:bg-[#2F2F4A] transition-colors ${opt === timerDuration ? 'text-[#C9943A] font-medium' : 'text-[#C5C1B8]'}`}
                              >
                                <span>{opt}s</span>
                                {opt === timerDuration && <span className="text-[10px] text-[#C9943A]">✓</span>}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="mb-8">
              <ScenarioCard scenario={currentScenario} />
            </div>

            <ResponseInput
              value={response}
              onChange={setResponse}
              onSubmit={handleSubmit}
              disabled={submitMutation.isPending}
            />

            <div className="mt-6 border-t border-[#2F2F4A] pt-5">
              <p className="text-center text-xs text-[#6B6B8D] uppercase tracking-widest mb-3">Or choose an action</p>
              <div className="flex gap-2 justify-center flex-wrap">
                <Button
                  variant="ghost"
                  onClick={handleNext}
                  className="text-[#6B6B8D] hover:text-[#C5C1B8] text-sm border border-[#2F2F4A] rounded-lg px-4"
                >
                  <SkipForward className="w-4 h-4 mr-1.5" />
                  Pass — next card
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => { setResponse("I'm choosing not to engage with this."); }}
                  className="text-[#6B6B8D] hover:text-[#C5C1B8] text-sm border border-[#2F2F4A] rounded-lg px-4"
                >
                  🚪 Disengage
                </Button>
              </div>
            </div>
          </>
        )}

        {gameState === 'evaluating' && (
          <div className="flex flex-col items-center justify-center py-20">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            >
              <Loader2 className="w-12 h-12 text-[#C9943A]" />
            </motion.div>
            <p className="mt-4 text-[#C5C1B8] font-serif text-lg">Reading the room...</p>
          </div>
        )}

        {gameState === 'results' && evaluationResult && (
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-8"
            >
              <div className="text-center mb-8">
                <h2 className="font-serif text-2xl text-[#E8E4DA] mb-2">Your Response</h2>
                <p className="text-[#6B6B8D] text-sm">to "{currentScenario.title}"</p>
              </div>

              <div className="bg-[#252542] rounded-xl p-5 border border-[#2F2F4A] mb-6">
                <p className="text-[#E8E4DA] italic font-serif">"{response}"</p>
              </div>

              <EmpathyScore 
                scores={{
                  acknowledgment: evaluationResult.acknowledgment,
                  curiosity: evaluationResult.curiosity,
                  nonjudgment: evaluationResult.nonjudgment,
                  door_open: evaluationResult.door_open
                }}
              />

              <Reflection 
                reflection={evaluationResult.reflection}
                alternativeResponse={evaluationResult.alternative_response}
              />

              {!profile?.is_premium && (
                <Link to={createPageUrl('Premium')} className="block">
                  <div className="flex items-center gap-3 bg-[#C9943A]/10 border border-[#C9943A]/30 rounded-xl p-4 hover:bg-[#C9943A]/15 transition-colors cursor-pointer">
                    <Sparkles className="w-5 h-5 text-[#C9943A] flex-shrink-0" />
                    <div>
                      <p className="text-[#C9943A] text-sm font-medium">Upgrade to Premium</p>
                      <p className="text-[#6B6B8D] text-xs">Unlock AI scenarios, custom timers, deep analytics & more</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-[#C9943A] ml-auto flex-shrink-0" />
                  </div>
                </Link>
              )}

              <div className="flex gap-3 pt-2 flex-wrap">
                <Button 
                  variant="outline" 
                  className="flex-1 h-12 border-[#2F2F4A] text-[#C5C1B8] hover:bg-[#252542]"
                  onClick={handleReplay}
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
                <ShareResultCard
                  scores={{
                    acknowledgment: evaluationResult.acknowledgment,
                    curiosity: evaluationResult.curiosity,
                    nonjudgment: evaluationResult.nonjudgment,
                    door_open: evaluationResult.door_open
                  }}
                  total={evaluationResult.total_score}
                  scenarioTitle={currentScenario.title}
                  reflection={evaluationResult.reflection}
                />
                <Button 
                  className="flex-1 h-12 bg-[#C9943A] hover:bg-[#D4A94D] text-[#1A1A2E]"
                  onClick={handleNext}
                >
                  Next Scenario
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </motion.div>
          </AnimatePresence>
        )}
      </main>
    </div>
  );
}