import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import {
  LineChart, Line, BarChart, Bar, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, ReferenceLine
} from 'recharts';
import {
  ArrowLeft, TrendingUp, TrendingDown, Minus, Loader2,
  Target, Star, AlertTriangle, CalendarDays, Zap, BarChart2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Logo from '@/components/brand/Logo';

const MARKERS = [
  { key: 'score_acknowledgment', label: 'Acknowledgment', color: '#C9943A', desc: 'Recognizing others\' feelings' },
  { key: 'score_curiosity',      label: 'Curiosity',      color: '#7C6FCD', desc: 'Genuine interest in understanding' },
  { key: 'score_nonjudgment',    label: 'Non-judgment',   color: '#4ABFA1', desc: 'Avoiding verdicts on others' },
  { key: 'score_door_open',      label: 'Door Open',      color: '#E07C5B', desc: 'Inviting continued dialogue' },
];

const CATEGORIES = ['Family', 'Community', 'Digital', 'Civic', 'Workplace', 'Personal', 'Reflection'];
const CAT_COLORS = {
  Family: '#f87171', Community: '#34d399', Digital: '#60a5fa',
  Civic: '#a78bfa', Workplace: '#fbbf24', Personal: '#f472b6', Reflection: '#22d3ee'
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1A1A2E] border border-[#2F2F4A] rounded-lg p-3 text-xs shadow-xl">
      <p className="text-[#C5C1B8] mb-2 font-medium">{label}</p>
      {payload.map(p => (
        <p key={p.dataKey} style={{ color: p.color }} className="mb-0.5">
          {p.name}: <span className="font-semibold">{typeof p.value === 'number' ? Math.round(p.value) : p.value}</span>
        </p>
      ))}
    </div>
  );
};

function StatCard({ label, value, sub, color = '#C9943A' }) {
  return (
    <div className="bg-[#252542] rounded-xl p-4 border border-[#2F2F4A] text-center">
      <p className="text-xs text-[#6B6B8D] mb-1">{label}</p>
      <p className="text-2xl font-serif font-semibold" style={{ color }}>{value}</p>
      {sub && <p className="text-xs text-[#6B6B8D] mt-0.5">{sub}</p>}
    </div>
  );
}

function MarkerBar({ label, color, value, max = 25 }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="mb-3">
      <div className="flex justify-between text-xs mb-1">
        <span className="text-[#C5C1B8]">{label}</span>
        <span style={{ color }} className="font-semibold">{Math.round(value)} / {max}</span>
      </div>
      <div className="h-2 bg-[#1A1A2E] rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: color }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}

export default function Analytics() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ['allSessions', user?.email],
    queryFn: () => base44.entities.GameSession.filter({ user_id: user.email }),
    enabled: !!user
  });

  const { data: profile } = useQuery({
    queryKey: ['userProfile', user?.email],
    queryFn: async () => {
      const ps = await base44.entities.UserProfile.filter({ user_id: user.email });
      return ps[0] || null;
    },
    enabled: !!user
  });

  const analytics = useMemo(() => {
    if (sessions.length === 0) return null;

    const sorted = [...sessions].sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
    const last10 = sorted.slice(-10);
    const last5 = sorted.slice(-5);

    // Chart data for trend line (last 20)
    const trendData = sorted.slice(-20).map((s, i) => ({
      name: new Date(s.created_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      Total: s.total_score || 0,
      Acknowledgment: s.score_acknowledgment || 0,
      Curiosity: s.score_curiosity || 0,
      'Non-judgment': s.score_nonjudgment || 0,
      'Door Open': s.score_door_open || 0,
    }));

    // All-time marker averages
    const markerAvgs = MARKERS.map(m => ({
      ...m,
      avg: sorted.reduce((s, v) => s + (v[m.key] || 0), 0) / sorted.length,
      recent: last5.reduce((s, v) => s + (v[m.key] || 0), 0) / last5.length,
    }));

    // Sorted strengths & growth areas
    const sortedMarkers = [...markerAvgs].sort((a, b) => b.avg - a.avg);
    const strengths = sortedMarkers.slice(0, 2);
    const growthAreas = sortedMarkers.slice(-2).reverse();

    // Radar data
    const radarData = MARKERS.map(m => ({
      marker: m.label.split('-')[0].trim(),
      'All Time': Math.round(markerAvgs.find(x => x.key === m.key).avg),
      'Last 5': Math.round(markerAvgs.find(x => x.key === m.key).recent),
    }));

    // Category breakdown
    const catData = CATEGORIES.map(cat => {
      const catSessions = sorted.filter(s => s.scenario_category === cat);
      if (catSessions.length === 0) return null;
      const avg = catSessions.reduce((s, v) => s + (v.total_score || 0), 0) / catSessions.length;
      return { category: cat, avg: Math.round(avg), count: catSessions.length };
    }).filter(Boolean).sort((a, b) => b.avg - a.avg);

    // Evolution (first half vs second half)
    const half = Math.floor(sorted.length / 2);
    const firstAvg = sorted.slice(0, half).reduce((s, v) => s + (v.total_score || 0), 0) / half;
    const secondAvg = sorted.slice(half).reduce((s, v) => s + (v.total_score || 0), 0) / (sorted.length - half);
    const evolution = secondAvg - firstAvg;

    // Weekly frequency (last 4 weeks)
    const now = Date.now();
    const weekData = [3, 2, 1, 0].map(weeksAgo => {
      const start = new Date(now - (weeksAgo + 1) * 7 * 86400000);
      const end = new Date(now - weeksAgo * 7 * 86400000);
      const wSessions = sorted.filter(s => {
        const d = new Date(s.created_date);
        return d >= start && d < end;
      });
      return {
        week: weeksAgo === 0 ? 'This week' : `${weeksAgo}w ago`,
        Sessions: wSessions.length,
        'Avg Score': wSessions.length ? Math.round(wSessions.reduce((s, v) => s + (v.total_score || 0), 0) / wSessions.length) : 0,
      };
    });

    return {
      total: sorted.length,
      bestScore: Math.max(...sorted.map(s => s.total_score || 0)),
      avgScore: Math.round(sorted.reduce((s, v) => s + (v.total_score || 0), 0) / sorted.length),
      evolution,
      trendData,
      markerAvgs,
      strengths,
      growthAreas,
      radarData,
      catData,
      weekData,
    };
  }, [sessions]);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart2 },
    { id: 'markers', label: 'Markers', icon: Target },
    { id: 'categories', label: 'Categories', icon: Star },
    { id: 'activity', label: 'Activity', icon: CalendarDays },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#1A1A2E] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#C9943A] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1A1A2E]">
      <header className="p-4 flex items-center justify-between border-b border-[#2F2F4A]">
        <Link to={createPageUrl('Home')}>
          <Button variant="ghost" size="icon" className="text-[#C5C1B8] hover:text-[#C9943A]">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <Logo size="small" />
        <div className="w-9" />
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-serif text-3xl text-[#E8E4DA] mb-1">Your Analytics</h1>
          <p className="text-sm text-[#6B6B8D] mb-6">Empathy trends & growth insights</p>
        </motion.div>

        {!analytics || sessions.length < 2 ? (
          <div className="bg-[#252542] rounded-xl p-8 border border-[#2F2F4A] text-center">
            <Zap className="w-10 h-10 text-[#C9943A] mx-auto mb-3 opacity-60" />
            <p className="font-serif text-lg text-[#E8E4DA] mb-2">Not enough data yet</p>
            <p className="text-sm text-[#6B6B8D]">Play at least 2 sessions to unlock your analytics dashboard.</p>
            <Link to={createPageUrl('Solo')}>
              <Button className="mt-5 bg-[#C9943A] hover:bg-[#D4A94D] text-[#1A1A2E]">Play Solo</Button>
            </Link>
          </div>
        ) : (
          <>
            {/* Top stats */}
            <motion.div
              className="grid grid-cols-4 gap-3 mb-6"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            >
              <StatCard label="Sessions" value={analytics.total} />
              <StatCard label="Avg Score" value={analytics.avgScore} color="#7C6FCD" />
              <StatCard label="Best" value={analytics.bestScore} color="#4ABFA1" />
              <div className="bg-[#252542] rounded-xl p-4 border border-[#2F2F4A] text-center">
                <p className="text-xs text-[#6B6B8D] mb-1">Trend</p>
                {analytics.evolution > 1
                  ? <div className="flex items-center justify-center gap-1 text-emerald-400 font-semibold text-sm mt-1"><TrendingUp className="w-4 h-4" />+{Math.round(analytics.evolution)}</div>
                  : analytics.evolution < -1
                  ? <div className="flex items-center justify-center gap-1 text-rose-400 font-semibold text-sm mt-1"><TrendingDown className="w-4 h-4" />{Math.round(analytics.evolution)}</div>
                  : <div className="flex items-center justify-center gap-1 text-[#6B6B8D] font-semibold text-sm mt-1"><Minus className="w-4 h-4" />Stable</div>
                }
              </div>
            </motion.div>

            {/* Tabs */}
            <div className="flex gap-1 bg-[#1A1A2E] rounded-xl p-1 mb-6 border border-[#2F2F4A]">
              {tabs.map(t => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1 ${
                    activeTab === t.id
                      ? 'bg-[#252542] text-[#C9943A] shadow'
                      : 'text-[#6B6B8D] hover:text-[#C5C1B8]'
                  }`}
                >
                  <t.icon className="w-3 h-3" />
                  <span className="hidden sm:inline">{t.label}</span>
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              {/* OVERVIEW TAB */}
              {activeTab === 'overview' && (
                <motion.div key="overview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-5">
                  {/* Score trend */}
                  <div className="bg-[#252542] rounded-xl p-5 border border-[#2F2F4A]">
                    <p className="text-xs text-[#6B6B8D] mb-1 uppercase tracking-wide">Total Empathy Score — Last 20 Sessions</p>
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={analytics.trendData} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#2F2F4A" />
                        <XAxis dataKey="name" tick={{ fill: '#6B6B8D', fontSize: 9 }} interval="preserveStartEnd" />
                        <YAxis domain={[0, 100]} tick={{ fill: '#6B6B8D', fontSize: 10 }} />
                        <Tooltip content={<CustomTooltip />} />
                        <ReferenceLine y={analytics.avgScore} stroke="#C9943A" strokeDasharray="4 4" strokeOpacity={0.5} label={{ value: 'avg', fill: '#C9943A', fontSize: 9, position: 'insideTopRight' }} />
                        <Line type="monotone" dataKey="Total" stroke="#C9943A" strokeWidth={2.5} dot={{ fill: '#C9943A', r: 3 }} activeDot={{ r: 5 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Strengths & Growth */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-emerald-900/20 border border-emerald-700/30 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Star className="w-4 h-4 text-emerald-400" />
                        <span className="text-xs text-emerald-400 font-medium uppercase tracking-wide">Strengths</span>
                      </div>
                      {analytics.strengths.map(m => (
                        <div key={m.key} className="mb-2">
                          <p className="text-sm text-[#E8E4DA] font-medium">{m.label}</p>
                          <p className="text-xs text-[#6B6B8D]">{m.desc}</p>
                          <p className="text-sm font-bold mt-0.5" style={{ color: m.color }}>{Math.round(m.avg)} / 25</p>
                        </div>
                      ))}
                    </div>
                    <div className="bg-rose-900/20 border border-rose-700/30 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <AlertTriangle className="w-4 h-4 text-rose-400" />
                        <span className="text-xs text-rose-400 font-medium uppercase tracking-wide">Growth Areas</span>
                      </div>
                      {analytics.growthAreas.map(m => (
                        <div key={m.key} className="mb-2">
                          <p className="text-sm text-[#E8E4DA] font-medium">{m.label}</p>
                          <p className="text-xs text-[#6B6B8D]">{m.desc}</p>
                          <p className="text-sm font-bold mt-0.5" style={{ color: m.color }}>{Math.round(m.avg)} / 25</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* MARKERS TAB */}
              {activeTab === 'markers' && (
                <motion.div key="markers" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-5">
                  {/* All-time averages bars */}
                  <div className="bg-[#252542] rounded-xl p-5 border border-[#2F2F4A]">
                    <p className="text-xs text-[#6B6B8D] mb-4 uppercase tracking-wide">All-Time Marker Averages</p>
                    {analytics.markerAvgs.map(m => (
                      <MarkerBar key={m.key} label={m.label} color={m.color} value={m.avg} />
                    ))}
                  </div>

                  {/* Radar */}
                  <div className="bg-[#252542] rounded-xl p-5 border border-[#2F2F4A]">
                    <p className="text-xs text-[#6B6B8D] mb-3 uppercase tracking-wide">All Time vs Last 5 Sessions</p>
                    <ResponsiveContainer width="100%" height={220}>
                      <RadarChart data={analytics.radarData} margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                        <PolarGrid stroke="#2F2F4A" />
                        <PolarAngleAxis dataKey="marker" tick={{ fill: '#C5C1B8', fontSize: 11 }} />
                        <Radar name="All Time" dataKey="All Time" stroke="#C9943A" fill="#C9943A" fillOpacity={0.15} strokeWidth={2} />
                        <Radar name="Last 5" dataKey="Last 5" stroke="#7C6FCD" fill="#7C6FCD" fillOpacity={0.2} strokeWidth={2} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend wrapperStyle={{ fontSize: 11, color: '#C5C1B8' }} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Marker trends over time */}
                  <div className="bg-[#252542] rounded-xl p-5 border border-[#2F2F4A]">
                    <p className="text-xs text-[#6B6B8D] mb-3 uppercase tracking-wide">Marker Trends Over Time</p>
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={analytics.trendData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#2F2F4A" />
                        <XAxis dataKey="name" tick={{ fill: '#6B6B8D', fontSize: 9 }} interval="preserveStartEnd" />
                        <YAxis domain={[0, 25]} tick={{ fill: '#6B6B8D', fontSize: 10 }} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend wrapperStyle={{ fontSize: 10, color: '#C5C1B8' }} />
                        {MARKERS.map(m => (
                          <Line key={m.key} type="monotone" dataKey={m.label} stroke={m.color} strokeWidth={1.8} dot={false} />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </motion.div>
              )}

              {/* CATEGORIES TAB */}
              {activeTab === 'categories' && (
                <motion.div key="categories" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-5">
                  {analytics.catData.length === 0 ? (
                    <p className="text-[#6B6B8D] text-sm text-center py-8">No category data yet.</p>
                  ) : (
                    <>
                      <div className="bg-[#252542] rounded-xl p-5 border border-[#2F2F4A]">
                        <p className="text-xs text-[#6B6B8D] mb-4 uppercase tracking-wide">Average Score by Category</p>
                        <ResponsiveContainer width="100%" height={220}>
                          <BarChart data={analytics.catData} margin={{ top: 4, right: 4, bottom: 20, left: -20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#2F2F4A" />
                            <XAxis dataKey="category" tick={{ fill: '#6B6B8D', fontSize: 9 }} angle={-30} textAnchor="end" />
                            <YAxis domain={[0, 100]} tick={{ fill: '#6B6B8D', fontSize: 10 }} />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="avg" name="Avg Score" radius={[4, 4, 0, 0]}>
                              {analytics.catData.map((entry) => (
                                <rect key={entry.category} fill={CAT_COLORS[entry.category] || '#C9943A'} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>

                      {/* Category list with strength/growth labels */}
                      <div className="bg-[#252542] rounded-xl p-5 border border-[#2F2F4A]">
                        <p className="text-xs text-[#6B6B8D] mb-4 uppercase tracking-wide">Category Breakdown</p>
                        <div className="space-y-3">
                          {analytics.catData.map((c, i) => (
                            <div key={c.category} className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <span className="text-sm font-medium" style={{ color: CAT_COLORS[c.category] }}>
                                  {i === 0 ? '🏆 ' : ''}{c.category}
                                </span>
                                <span className="text-xs text-[#6B6B8D]">{c.count} session{c.count !== 1 ? 's' : ''}</span>
                                {i === 0 && <span className="text-xs bg-emerald-900/40 text-emerald-400 px-1.5 py-0.5 rounded">Top strength</span>}
                                {i === analytics.catData.length - 1 && analytics.catData.length > 1 && (
                                  <span className="text-xs bg-rose-900/40 text-rose-400 px-1.5 py-0.5 rounded">Needs work</span>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="w-20 h-1.5 bg-[#1A1A2E] rounded-full overflow-hidden">
                                  <div className="h-full rounded-full" style={{ width: `${c.avg}%`, background: CAT_COLORS[c.category] }} />
                                </div>
                                <span className="text-sm font-bold" style={{ color: CAT_COLORS[c.category] }}>{c.avg}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </motion.div>
              )}

              {/* ACTIVITY TAB */}
              {activeTab === 'activity' && (
                <motion.div key="activity" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-5">
                  <div className="bg-[#252542] rounded-xl p-5 border border-[#2F2F4A]">
                    <p className="text-xs text-[#6B6B8D] mb-4 uppercase tracking-wide">Weekly Activity</p>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={analytics.weekData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#2F2F4A" />
                        <XAxis dataKey="week" tick={{ fill: '#6B6B8D', fontSize: 10 }} />
                        <YAxis tick={{ fill: '#6B6B8D', fontSize: 10 }} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend wrapperStyle={{ fontSize: 10, color: '#C5C1B8' }} />
                        <Bar dataKey="Sessions" fill="#C9943A" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="Avg Score" fill="#7C6FCD" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-[#252542] rounded-xl p-4 border border-[#2F2F4A] text-center">
                      <p className="text-xs text-[#6B6B8D] mb-1">Current Streak</p>
                      <p className="text-2xl">🔥</p>
                      <p className="text-xl font-serif font-semibold text-orange-400">{profile?.current_streak || 0} days</p>
                    </div>
                    <div className="bg-[#252542] rounded-xl p-4 border border-[#2F2F4A] text-center">
                      <p className="text-xs text-[#6B6B8D] mb-1">Longest Streak</p>
                      <p className="text-2xl">⚡</p>
                      <p className="text-xl font-serif font-semibold text-[#C9943A]">{profile?.longest_streak || 0} days</p>
                    </div>
                  </div>

                  <div className="bg-[#252542] rounded-xl p-5 border border-[#2F2F4A]">
                    <p className="text-xs text-[#6B6B8D] mb-4 uppercase tracking-wide">Total Points</p>
                    <div className="flex items-center gap-4">
                      <span className="text-4xl">⭐</span>
                      <div>
                        <p className="text-3xl font-serif font-bold text-[#C9943A]">{profile?.total_points || 0}</p>
                        <p className="text-xs text-[#6B6B8D]">lifetime points earned</p>
                      </div>
                    </div>
                  </div>

                  {((profile?.engage_count || 0) + (profile?.pause_count || 0) + (profile?.pass_count || 0)) > 0 && (
                    <div className="bg-[#252542] rounded-xl p-5 border border-[#2F2F4A]">
                      <p className="text-xs text-[#6B6B8D] mb-4 uppercase tracking-wide">How You've Approached Scenarios</p>
                      <p className="text-sm text-[#C5C1B8] leading-relaxed">
                        You've{' '}
                        <span className="text-[#C9943A] font-semibold">engaged {profile?.engage_count || 0} time{(profile?.engage_count || 0) !== 1 ? 's' : ''}</span>,{' '}
                        <span className="text-[#7C6FCD] font-semibold">paused {profile?.pause_count || 0} time{(profile?.pause_count || 0) !== 1 ? 's' : ''}</span>,{' '}
                        and{' '}
                        <span className="text-[#6B6B8D] font-semibold">passed {profile?.pass_count || 0} time{(profile?.pass_count || 0) !== 1 ? 's' : ''}</span>.
                      </p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </main>
    </div>
  );
}