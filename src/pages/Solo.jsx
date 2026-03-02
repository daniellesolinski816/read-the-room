import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, RotateCcw, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Logo from '@/components/brand/Logo';
import ScenarioCard from '@/components/game/ScenarioCard';
import Timer from '@/components/game/Timer';
import ResponseInput from '@/components/game/ResponseInput';
import EmpathyScore from '@/components/game/EmpathyScore';
import Reflection from '@/components/game/Reflection';
import GenerateScenario from '@/components/game/GenerateScenario';

const TIMER_DURATION = 60;

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
  const [gameState, setGameState] = useState('playing'); // playing, evaluating, results
  const [evaluationResult, setEvaluationResult] = useState(null);
  const [timerRunning, setTimerRunning] = useState(true);
  const [startTime, setStartTime] = useState(Date.now());
  const [aiScenario, setAiScenario] = useState(null);
  
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

  const currentScenario = aiScenario || (selectedScenarioId 
    ? scenarios.find(s => s.id === selectedScenarioId) 
    : scenarios[currentScenarioIndex]);

  const submitMutation = useMutation({
    mutationFn: async () => {
      setGameState('evaluating');
      const timeTaken = Math.round((Date.now() - startTime) / 1000);
      
      const prompt = `You are an empathy coach evaluating a player's response to a charged real-world scenario as part of The Empathy Enigma's Read the Room game. Your job is not to assess whether they gave the 'right' political answer — there is no right political answer. Your job is to evaluate how empathic their communication was across four markers.

SCENARIO:
"${currentScenario.prompt}"

PLAYER'S RESPONSE:
"${response}"

Evaluate the response across these four markers, scoring each 0-25:
1. Acknowledgment — did they recognize the other person's position or feelings?
2. Curiosity — did they ask a question or show genuine interest in understanding?
3. Non-judgment — did they avoid closing with a verdict about the other person?
4. Door Open — does the response invite continued conversation or shut it down?

Return your evaluation in this exact JSON format:
{
  "acknowledgment": <0-25>,
  "curiosity": <0-25>,
  "nonjudgment": <0-25>,
  "door_open": <0-25>,
  "reflection": "<2-3 sentences of specific reflection that acts as a mirror — what did their response communicate, what might the other person have heard, and what is one concrete thing they could do differently. Keep the tone warm, specific, and non-judgmental.>",
  "alternative_response": "<One alternative response that demonstrates higher empathy without being preachy or politically biased>"
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

      // Save the session
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

        // Update profile stats
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
        let streak = profile.current_streak || 0;
        if (profile.last_played_date !== today) {
          const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
          streak = profile.last_played_date === yesterday ? streak + 1 : 1;
        }

        await base44.entities.UserProfile.update(profile.id, {
          total_sessions: sessions.length,
          average_score: avgScore,
          avg_acknowledgment: avgAck,
          avg_curiosity: avgCur,
          avg_nonjudgment: avgNon,
          avg_door_open: avgDoor,
          scores_by_category: scoresByCategory,
          current_streak: streak,
          longest_streak: Math.max(streak, profile.longest_streak || 0),
          last_played_date: today
        });
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
  };

  const handleNext = () => {
    setSelectedScenarioId(null);
    setCurrentScenarioIndex(prev => (prev + 1) % scenarios.length);
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
      {/* Header */}
      <header className="p-4 flex items-center justify-between border-b border-[#2F2F4A]">
        <Link to={createPageUrl('Home')}>
          <Button variant="ghost" size="icon" className="text-[#C5C1B8] hover:text-[#C9943A]">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <Logo size="small" />
        <div className="w-10" />
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* Game Phase: Playing */}
        {gameState === 'playing' && (
          <>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-serif text-xl text-[#E8E4DA]">Quick Draw</h2>
              {profile?.timer_enabled !== false && (
                <Timer 
                  duration={TIMER_DURATION} 
                  onComplete={handleTimerComplete}
                  isRunning={timerRunning}
                />
              )}
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
          </>
        )}

        {/* Game Phase: Evaluating */}
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

        {/* Game Phase: Results */}
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

              <div className="flex gap-4 pt-6">
                <Button 
                  variant="outline" 
                  className="flex-1 h-12 border-[#2F2F4A] text-[#C5C1B8] hover:bg-[#252542]"
                  onClick={handleReplay}
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
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