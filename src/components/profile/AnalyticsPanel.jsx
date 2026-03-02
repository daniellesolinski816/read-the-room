import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const MARKERS = [
  { key: 'score_acknowledgment', label: 'Acknowledgment', color: '#C9943A' },
  { key: 'score_curiosity',      label: 'Curiosity',      color: '#7C6FCD' },
  { key: 'score_nonjudgment',    label: 'Non-judgment',   color: '#4ABFA1' },
  { key: 'score_door_open',      label: 'Door Open',      color: '#E07C5B' },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1A1A2E] border border-[#2F2F4A] rounded-lg p-3 text-xs shadow-xl">
      <p className="text-[#C5C1B8] mb-2">{label}</p>
      {payload.map(p => (
        <p key={p.dataKey} style={{ color: p.color }} className="mb-0.5">
          {p.name}: <span className="font-semibold">{Math.round(p.value)}</span>
        </p>
      ))}
    </div>
  );
};

function Trend({ current, previous }) {
  if (previous == null) return null;
  const diff = current - previous;
  if (Math.abs(diff) < 1) return <Minus className="w-3 h-3 text-[#6B6B8D]" />;
  if (diff > 0) return <span className="flex items-center gap-0.5 text-emerald-400 text-xs"><TrendingUp className="w-3 h-3" />+{Math.round(diff)}</span>;
  return <span className="flex items-center gap-0.5 text-rose-400 text-xs"><TrendingDown className="w-3 h-3" />{Math.round(diff)}</span>;
}

export default function AnalyticsPanel({ sessions }) {
  const [activeTab, setActiveTab] = useState('overall');

  if (!sessions || sessions.length < 2) {
    return (
      <div className="bg-[#252542] rounded-xl p-6 border border-[#2F2F4A] text-center">
        <p className="text-[#6B6B8D] text-sm">Play at least 2 sessions to see your analytics.</p>
      </div>
    );
  }

  // Prepare chart data — oldest first, max 20
  const sorted = [...sessions].reverse().slice(-20);
  const chartData = sorted.map((s, i) => ({
    name: `#${i + 1}`,
    date: new Date(s.created_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    Total: s.total_score || 0,
    Acknowledgment: s.score_acknowledgment || 0,
    Curiosity: s.score_curiosity || 0,
    'Non-judgment': s.score_nonjudgment || 0,
    'Door Open': s.score_door_open || 0,
  }));

  // Score evolution: split into first half vs second half
  const half = Math.floor(sorted.length / 2);
  const firstHalf = sorted.slice(0, half);
  const secondHalf = sorted.slice(half);
  const avg = arr => arr.reduce((s, v) => s + (v.total_score || 0), 0) / arr.length;
  const firstAvg = avg(firstHalf);
  const secondAvg = avg(secondHalf);
  const evolution = secondAvg - firstAvg;

  // Per-marker averages (all time vs last 5)
  const recentSessions = sorted.slice(-5);
  const allAvg = (key) => sorted.reduce((s, v) => s + (v[key] || 0), 0) / sorted.length;
  const recentAvg = (key) => recentSessions.reduce((s, v) => s + (v[key] || 0), 0) / recentSessions.length;

  // Bar chart data for markers comparison
  const markerBarData = MARKERS.map(m => ({
    name: m.label,
    'All time': Math.round(allAvg(m.key)),
    'Last 5': Math.round(recentAvg(m.key)),
  }));

  const tabs = [
    { id: 'overall', label: 'Score Trend' },
    { id: 'markers', label: 'Markers' },
    { id: 'compare', label: 'Progress' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.25 }}
      className="mb-8"
    >
      <h3 className="font-serif text-lg text-[#E8E4DA] mb-4">Analytics</h3>

      {/* Score evolution summary */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-[#252542] rounded-xl p-4 border border-[#2F2F4A] text-center">
          <p className="text-xs text-[#6B6B8D] mb-1">Sessions</p>
          <p className="text-xl font-serif font-semibold text-[#E8E4DA]">{sorted.length}</p>
        </div>
        <div className="bg-[#252542] rounded-xl p-4 border border-[#2F2F4A] text-center">
          <p className="text-xs text-[#6B6B8D] mb-1">Best Score</p>
          <p className="text-xl font-serif font-semibold text-[#C9943A]">
            {Math.max(...sorted.map(s => s.total_score || 0))}
          </p>
        </div>
        <div className="bg-[#252542] rounded-xl p-4 border border-[#2F2F4A] text-center">
          <p className="text-xs text-[#6B6B8D] mb-1">Evolution</p>
          <div className="flex items-center justify-center mt-1">
            {evolution > 1
              ? <span className="flex items-center gap-1 text-emerald-400 font-semibold text-sm"><TrendingUp className="w-4 h-4" />+{Math.round(evolution)}</span>
              : evolution < -1
              ? <span className="flex items-center gap-1 text-rose-400 font-semibold text-sm"><TrendingDown className="w-4 h-4" />{Math.round(evolution)}</span>
              : <span className="flex items-center gap-1 text-[#6B6B8D] font-semibold text-sm"><Minus className="w-4 h-4" />Stable</span>
            }
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#1A1A2E] rounded-lg p-1 mb-4">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex-1 py-2 rounded-md text-xs font-medium transition-all ${
              activeTab === t.id
                ? 'bg-[#252542] text-[#C9943A] shadow'
                : 'text-[#6B6B8D] hover:text-[#C5C1B8]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Chart area */}
      <div className="bg-[#252542] rounded-xl p-4 border border-[#2F2F4A]">
        {activeTab === 'overall' && (
          <>
            <p className="text-xs text-[#6B6B8D] mb-3">Total empathy score over time</p>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2F2F4A" />
                <XAxis dataKey="name" tick={{ fill: '#6B6B8D', fontSize: 10 }} />
                <YAxis domain={[0, 100]} tick={{ fill: '#6B6B8D', fontSize: 10 }} />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone" dataKey="Total" stroke="#C9943A"
                  strokeWidth={2} dot={{ fill: '#C9943A', r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </>
        )}

        {activeTab === 'markers' && (
          <>
            <p className="text-xs text-[#6B6B8D] mb-3">Empathy marker trends over time</p>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2F2F4A" />
                <XAxis dataKey="name" tick={{ fill: '#6B6B8D', fontSize: 10 }} />
                <YAxis domain={[0, 25]} tick={{ fill: '#6B6B8D', fontSize: 10 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 10, color: '#C5C1B8' }} />
                {MARKERS.map(m => (
                  <Line
                    key={m.key} type="monotone" dataKey={m.label} stroke={m.color}
                    strokeWidth={1.5} dot={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </>
        )}

        {activeTab === 'compare' && (
          <>
            <p className="text-xs text-[#6B6B8D] mb-3">All-time vs. last 5 sessions</p>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={markerBarData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2F2F4A" />
                <XAxis dataKey="name" tick={{ fill: '#6B6B8D', fontSize: 9 }} />
                <YAxis domain={[0, 25]} tick={{ fill: '#6B6B8D', fontSize: 10 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 10, color: '#C5C1B8' }} />
                <Bar dataKey="All time" fill="#2F2F4A" radius={[3, 3, 0, 0]} />
                <Bar dataKey="Last 5" fill="#C9943A" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </>
        )}
      </div>
    </motion.div>
  );
}