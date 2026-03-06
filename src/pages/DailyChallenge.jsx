import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ArrowLeft, Loader2, RotateCcw, Trophy, CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Logo from '@/components/brand/Logo';
import ScenarioCard from '@/components/game/ScenarioCard';
import Timer from '@/components/game/Timer';
import ResponseInput from '@/components/game/ResponseInput';
import EmpathyScore from '@/components/game/EmpathyScore';
import Reflection from '@/components/game/Reflection';
import PointsToast from '@/components/gamification/PointsToast';
import { scoreToPoints, getEarnedBadgeIds, BADGES } from '@/components/gamification/badges';

const TIMER_DURATION = 60;

export default function DailyChallenge() {
  const urlParams = new URLSearchParams(window.location.search);
  const scenarioId = urlParams.get('scenarioId');

  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [response, setResponse] = useState('');
  const [gameState, setGameState] = useState('playing');
  const [evaluationResult, setEvaluationResult] = useState(null);
  const [timerRunning, setTimerRunning] = useState(true);
  const [startTime] = useState(Date.now());
  const [pointsEarned, setPointsEarned] = useState(null);
  const [newBadges, setNewBadges] = useState([]);

  useEffect(() => {
    base44.auth.me().then(async (u) => {
      setUser(u);
      const profiles = await base44.entities.UserProfile.filter({ user_id: u.email });
      if (profiles.length > 0) setProfile(profiles[0]);
      else {
        const p = await base44.entities.UserProfile.create({ user_id: u.email, display_name: u.full_name, timer_enabled: true });
        setProfile(p);
      }
    }).catch(() => {});
  }, []);

  const { data: scenario } = useQuery({
    queryKey: ['scenario', scenarioId],
    queryFn: async () => {
      if (!scenarioId) {
        const today = new Date().toISOString().split('T')[0];
        const dailies = await base44.entities.Scenario.filter({ is_daily: true, daily_date: today });
        if (dailies.length > 0) return dailies[0];
        const all = await base44.entities.Scenario.list();
        return all[0] || null;
      }
      const all = await base44.entities.Scenario.list();
      return all.find(s => s.id === scenarioId) || null;
    }
  });

  const { data: leaderboard = [] } = useQuery({
    queryKey: ['dailyLeaderboard', scenarioId],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const todayStart = new Date(today + 'T00:00:00').toISOString();
      const sessions = await base44.entities.GameSession.filter({ scenario_id: scenarioId || scenario?.id });
      const todaySessions = sessions.filter(s => s.created_date >= todayStart);
      const best = {};
      todaySessions.forEach(s => {
        if (!best[s.user_id] || s.total_score > best[s.user_id].total_score) {
          best[s.user_id] = s;
        }
      });
      const sorted = Object.values(best).sort((a, b) => b.total_score - a.total_score);
      const profiles = await base44.entities.UserProfile.list();
      const profileMap = {};
      profiles.forEach(p => { profileMap[p.user_id] = p.display_name || 'Anonymous'; });
      return sorted.map(s => ({ ...s, display_name: profileMap[s.user_id] || 'Anonymous' }));
    },
    enabled: !!(scenarioId || scenario?.id),
    refetchInterval: 15000
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      setGameState('evaluating');
      const timeTaken = Math.round((Date.now() - startTime) / 1000);

      const contextLevel = profile?.context_level || 'adult';
      const contextNote = contextLevel === 'teen'
        ? 'The player is a teenager or adolescent. Use age-appropriate language and examples in your reflection and alternative response.'
        : contextLevel === 'professional'
        ? 'The player is a professional navigating workplace, civic, or leadership dynamics. Your alternative response should reflect that sophistication.'
        : 'The player is an adult with life experience. Your reflection and alternative response should be realistic and nuanced — not naive or preachy.';

      const prompt = `You are an empathy coach evaluating a player's response to a charged real-world scenario as part of the Read the Room daily challenge. Evaluate empathy — not politics.

IMPORTANT: Sometimes choosing NOT to engage IS the most empathic choice — when a conversation involves hate speech, dehumanizing language, or content that is psychologically unsafe. If the player chose to disengage or protect themselves, recognize that as potentially wise. Score "Door Open" based on whether they left room for future connection if appropriate, not whether they continued a harmful exchange.

PLAYER CONTEXT: ${contextNote}

SCENARIO:
"${scenario.prompt}"

PLAYER'S RESPONSE:
"${response}"

Score each marker 0-25:
1. Acknowledgment — did they recognize the other person's position or feelings?
2. Curiosity — did they ask a question or show genuine interest in understanding?
3. Non-judgment — did they avoid closing with a verdict about the other person?
4. Door Open — does the response leave room for future connection, OR appropriately close a harmful exchange?

Return JSON:
{
  "acknowledgment": <0-25>,
  "curiosity": <0-25>,
  "nonjudgment": <0-25>,
  "door_open": <0-25>,
  "reflection": "<2-3 sentences of specific, realistic reflection. Keep the tone warm, direct, and non-preachy. Never open with praise like 'Great job' or 'Well done.'>",
  "alternative_response": "<One realistic alternative that demonstrates higher empathy. VOICE RULES — write the way a real person actually talks, NOT a therapist, NOT HR, NOT a school counselor. These exact phrases are FORBIDDEN: 'I hear that you\'re feeling...', 'It sounds like...', 'I want to make sure I understand...', 'I appreciate you sharing that', 'That must be really hard for you', 'I can see why you feel that way.' A real response can include your own reaction before turning toward curiosity. It can be slightly imperfect or clumsy. It should sound like something said out loud — not written at a desk. Short is often more real than long. If disengaging was appropriate, offer a brief dignified exit, not a speech.>"
}`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: 'object',
          properties: {
            acknowledgment: { type: 'number' },
            curiosity: { type: 'number' },
            nonjudgment: { type: 'number' },
            door_open: { type: 'number' },
            reflection: { type: 'string' },
            alternative_response: { type: 'string' }
          },
          required: ['acknowledgment', 'curiosity', 'nonjudgment', 'door_open', 'reflection', 'alternative_response']
        }
      });

      const totalScore = result.acknowledgment + result.curiosity + result.nonjudgment + result.door_open;

      if (user && profile) {
        await base44.entities.GameSession.create({
          user_id: user.email,
          scenario_id: scenario.id,
          scenario_category: scenario.category,
          response,
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
        const today = new Date().toISOString().split('T')[0];
        let streak = profile.current_streak || 0;
        if (profile.last_played_date !== today) {
          const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
          streak = profile.last_played_date === yesterday ? streak + 1 : 1;
        }
        const pts = scoreToPoints(totalScore);
        const newTotal = (profile.total_points || 0) + pts;
        const updatedProfile = { ...profile, total_sessions: sessions.length, average_score: avgScore, total_points: newTotal, current_streak: streak, longest_streak: Math.max(streak, profile.longest_streak || 0) };
        const prevBadgeIds = profile.earned_badges || [];
        const newBadgeIds = getEarnedBadgeIds(updatedProfile, sessions);
        const freshBadges = BADGES.filter(b => newBadgeIds.includes(b.id) && !prevBadgeIds.includes(b.id));

        await base44.entities.UserProfile.update(profile.id, {
          total_sessions: sessions.length,
          average_score: avgScore,
          current_streak: streak,
          longest_streak: Math.max(streak, profile.longest_streak || 0),
          last_played_date: today,
          total_points: newTotal,
          earned_badges: newBadgeIds
        });

        setProfile({ ...updatedProfile, earned_badges: newBadgeIds });
        setPointsEarned(pts);
        setNewBadges(freshBadges);
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

  const handleReplay = () => {
    setResponse('');
    setGameState('playing');
    setEvaluationResult(null);
    setTimerRunning(true);
    setPointsEarned(null);
    setNewBadges([]);
  };

  if (!scenario) {
    return (
      <div className="min-h-screen bg-[#1A1A2E] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#C9943A] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1A1A2E]">
      {pointsEarned !== null && (
        <PointsToast points={pointsEarned} newBadges={newBadges} onDone={() => { setPointsEarned(null); setNewBadges([]); }} />
      )}

      <header className="p-4 flex items-center justify-between border-b border-[#2F2F4A]">
        <Link to={createPageUrl('Home')}>
          <Button variant="ghost" size="icon" className="text-[#C5C1B8] hover:text-[#C9943A]">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-[#C9943A]" />
          <span className="font-serif text-[#C9943A] font-semibold">Daily Challenge</span>
        </div>
        {profile?.total_points != null && (
          <span className="text-xs text-[#C9943A] font-medium bg-[#C9943A]/10 px-2 py-1 rounded-full">
            ⭐ {profile.total_points} pts
          </span>
        )}
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        {gameState === 'playing' && (
          <>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-serif text-xl text-[#E8E4DA]">Today's Scenario</h2>
              {profile?.timer_enabled !== false && (
                <Timer duration={TIMER_DURATION} onComplete={() => { if (response.trim()) handleSubmit(); }} isRunning={timerRunning} />
              )}
            </div>
            <div className="mb-8"><ScenarioCard scenario={scenario} /></div>
            <ResponseInput value={response} onChange={setResponse} onSubmit={handleSubmit} disabled={submitMutation.isPending} />
          </>
        )}

        {gameState === 'evaluating' && (
          <div className="flex flex-col items-center justify-center py-20">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}>
              <Loader2 className="w-12 h-12 text-[#C9943A]" />
            </motion.div>
            <p className="mt-4 text-[#C5C1B8] font-serif text-lg">Reading the room...</p>
          </div>
        )}

        {gameState === 'results' && evaluationResult && (
          <AnimatePresence>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
              <div className="text-center mb-6">
                <h2 className="font-serif text-2xl text-[#E8E4DA] mb-1">Your Response</h2>
                <p className="text-[#6B6B8D] text-sm">to "{scenario.title}"</p>
              </div>

              <div className="bg-[#252542] rounded-xl p-5 border border-[#2F2F4A]">
                <p className="text-[#E8E4DA] italic font-serif">"{response}"</p>
              </div>

              <EmpathyScore scores={{ acknowledgment: evaluationResult.acknowledgment, curiosity: evaluationResult.curiosity, nonjudgment: evaluationResult.nonjudgment, door_open: evaluationResult.door_open }} />
              <Reflection reflection={evaluationResult.reflection} alternativeResponse={evaluationResult.alternative_response} />

              {leaderboard.length > 0 && (
                <div className="bg-[#252542] rounded-xl border border-[#2F2F4A] p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Trophy className="w-4 h-4 text-[#C9943A]" />
                    <span className="font-serif text-[#E8E4DA] font-semibold">Today's Leaderboard</span>
                  </div>
                  <div className="space-y-2">
                    {leaderboard.slice(0, 5).map((entry, i) => (
                      <div key={i} className={`flex items-center justify-between rounded-lg px-3 py-2 ${entry.user_id === user?.email ? 'bg-[#C9943A]/15 border border-[#C9943A]/30' : 'bg-[#1A1A2E]/40'}`}>
                        <div className="flex items-center gap-3">
                          <span className="text-sm">{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}</span>
                          <span className="text-sm text-[#C5C1B8]">{entry.display_name}{entry.user_id === user?.email ? ' (you)' : ''}</span>
                        </div>
                        <span className="text-sm font-bold text-[#C9943A]">{entry.total_score}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-4 pt-2">
                <Button variant="outline" className="flex-1 h-12 border-[#2F2F4A] text-[#C5C1B8] hover:bg-[#252542]" onClick={handleReplay}>
                  <RotateCcw className="w-4 h-4 mr-2" /> Try Again
                </Button>
                <Link to={createPageUrl('Home')} className="flex-1">
                  <Button className="w-full h-12 bg-[#C9943A] hover:bg-[#D4A94D] text-[#1A1A2E]">Back to Home</Button>
                </Link>
              </div>
            </motion.div>
          </AnimatePresence>
        )}
      </main>
    </div>
  );
}