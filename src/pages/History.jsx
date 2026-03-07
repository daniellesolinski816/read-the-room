import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, ChevronDown, ChevronUp, Loader2, Clock, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Logo from '@/components/brand/Logo';

const MARKER_CONFIG = [
  { key: 'score_acknowledgment', label: 'Acknowledgment', short: 'Ack', color: '#C9943A' },
  { key: 'score_curiosity',      label: 'Curiosity',      short: 'Cur', color: '#7C6FCD' },
  { key: 'score_nonjudgment',    label: 'Non-judgment',   short: 'Non', color: '#4ABFA1' },
  { key: 'score_door_open',      label: 'Door Open',      short: 'Door', color: '#E07C5B' },
];

const CAT_COLORS = {
  Family: '#f87171', Community: '#34d399', Digital: '#60a5fa',
  Civic: '#a78bfa', Workplace: '#fbbf24', Personal: '#f472b6', Reflection: '#22d3ee'
};

function ScoreDot({ value, color }) {
  const pct = Math.min(100, Math.round((value / 25) * 100));
  return (
    <div className="text-center">
      <div className="text-sm font-bold" style={{ color }}>{value ?? '—'}</div>
    </div>
  );
}

function SessionCard({ session }) {
  const [expanded, setExpanded] = useState(false);
  const total = session.total_score ?? (
    (session.score_acknowledgment || 0) +
    (session.score_curiosity || 0) +
    (session.score_nonjudgment || 0) +
    (session.score_door_open || 0)
  );
  const date = new Date(session.created_date);
  const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const timeStr = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  const catColor = CAT_COLORS[session.scenario_category] || '#C9943A';

  return (
    <motion.div
      className="bg-[#252542] rounded-xl border border-[#2F2F4A] overflow-hidden"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <button
        className="w-full text-left p-4 hover:bg-[#2F2F4A]/40 transition-colors"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              {session.scenario_category && (
                <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: `${catColor}22`, color: catColor }}>
                  {session.scenario_category}
                </span>
              )}
              <span className="flex items-center gap-1 text-xs text-[#6B6B8D]">
                <Clock className="w-3 h-3" /> {dateStr} · {timeStr}
              </span>
            </div>
            {session.response && (
              <p className="text-sm text-[#C5C1B8] italic truncate">"{session.response}"</p>
            )}
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-serif font-bold"
              style={{ background: `${total >= 70 ? '#C9943A' : total >= 50 ? '#7C6FCD' : '#2F2F4A'}30`, color: total >= 70 ? '#C9943A' : total >= 50 ? '#7C6FCD' : '#6B6B8D', border: `2px solid ${total >= 70 ? '#C9943A' : total >= 50 ? '#7C6FCD' : '#2F2F4A'}` }}
            >
              {total}
            </div>
            {expanded ? <ChevronUp className="w-4 h-4 text-[#6B6B8D]" /> : <ChevronDown className="w-4 h-4 text-[#6B6B8D]" />}
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2 mt-3">
          {MARKER_CONFIG.map(m => (
            <div key={m.key} className="text-center">
              <div className="text-[10px] text-[#6B6B8D] mb-0.5">{m.short}</div>
              <ScoreDot value={session[m.key] ?? null} color={m.color} />
            </div>
          ))}
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 border-t border-[#2F2F4A] pt-4 space-y-4">
              {session.response && (
                <div>
                  <p className="text-xs text-[#6B6B8D] uppercase tracking-widest mb-2">Your Response</p>
                  <p className="text-sm text-[#E8E4DA] italic font-serif leading-relaxed">"{session.response}"</p>
                </div>
              )}
              {session.ai_reflection && (
                <div>
                  <p className="text-xs text-[#6B6B8D] uppercase tracking-widest mb-2">AI Reflection</p>
                  <p className="text-sm text-[#C5C1B8] leading-relaxed">{session.ai_reflection}</p>
                </div>
              )}
              {session.alternative_response && (
                <div>
                  <p className="text-xs text-[#6B6B8D] uppercase tracking-widest mb-2">Higher-Empathy Alternative</p>
                  <div className="bg-[#1A1A2E] rounded-lg p-3 border-l-2 border-[#C9943A]">
                    <p className="text-sm text-[#E8E4DA] italic font-serif leading-relaxed">"{session.alternative_response}"</p>
                  </div>
                </div>
              )}
              {session.time_taken_seconds && (
                <p className="text-xs text-[#6B6B8D]">⏱ Responded in {session.time_taken_seconds}s</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function History() {
  const [user, setUser] = useState(null);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('All');
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ['history', user?.email],
    queryFn: () => base44.entities.GameSession.filter({ user_id: user.email }, '-created_date', 100),
    enabled: !!user,
  });

  const categories = ['All', ...Array.from(new Set(sessions.map(s => s.scenario_category).filter(Boolean)))];

  const filtered = sessions.filter(s => {
    if (filterCat !== 'All' && s.scenario_category !== filterCat) return false;
    if (search) {
      const q = search.toLowerCase();
      return (s.response || '').toLowerCase().includes(q) || (s.ai_reflection || '').toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-[#1A1A2E]">
      <header className="p-4 flex items-center justify-between border-b border-[#2F2F4A]">
        <Link to={createPageUrl('Profile')}>
          <Button variant="ghost" size="icon" className="text-[#C5C1B8] hover:text-[#C9943A]">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <Logo size="small" />
        <div className="w-9" />
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="font-serif text-3xl text-[#E8E4DA] mb-1">Session History</h1>
          <p className="text-sm text-[#6B6B8D]">{sessions.length} session{sessions.length !== 1 ? 's' : ''} — tap any card to expand</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-[#1A1A2E] rounded-xl p-1 mb-5 border border-[#2F2F4A]">
          {[
            { id: 'all', label: 'All Sessions' },
            { id: 'reflections', label: '✨ Best Reflections' },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                activeTab === t.id ? 'bg-[#252542] text-[#C9943A] shadow' : 'text-[#6B6B8D] hover:text-[#C5C1B8]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Best Reflections view */}
        {activeTab === 'reflections' && (
          <div className="space-y-4">
            {sessions.filter(s => s.ai_reflection && (s.total_score || 0) >= 60).length === 0 ? (
              <p className="text-center text-[#6B6B8D] py-8 text-sm">Play more sessions to unlock your best reflections.</p>
            ) : (
              sessions
                .filter(s => s.ai_reflection && (s.total_score || 0) >= 60)
                .sort((a, b) => (b.total_score || 0) - (a.total_score || 0))
                .slice(0, 10)
                .map(s => (
                  <motion.div
                    key={s.id}
                    className="bg-[#252542] rounded-xl p-5 border border-[#2F2F4A]"
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: `${CAT_COLORS[s.scenario_category] || '#C9943A'}22`, color: CAT_COLORS[s.scenario_category] || '#C9943A' }}>
                        {s.scenario_category}
                      </span>
                      <span className="text-xs text-[#C9943A] font-bold ml-auto">Score: {s.total_score}</span>
                    </div>
                    <p className="text-xs text-[#6B6B8D] uppercase tracking-widest mb-2">AI Reflection</p>
                    <p className="text-sm text-[#C5C1B8] leading-relaxed">{s.ai_reflection}</p>
                    {s.response && (
                      <p className="text-xs text-[#6B6B8D] italic mt-3 border-t border-[#2F2F4A] pt-3">"{s.response}"</p>
                    )}
                  </motion.div>
                ))
            )}
          </div>
        )}

        {/* Search + filter — only in 'all' tab */}
        {activeTab === 'all' && <div className="space-y-3 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B6B8D]" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search responses or reflections…"
              className="w-full bg-[#252542] border border-[#2F2F4A] rounded-xl pl-9 pr-4 py-2.5 text-sm text-[#E8E4DA] placeholder-[#6B6B8D] outline-none focus:border-[#C9943A]/50"
            />
          </div>
          {categories.length > 2 && (
            <div className="flex gap-2 flex-wrap">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setFilterCat(cat)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                    filterCat === cat
                      ? 'bg-[#C9943A] text-[#1A1A2E] border-[#C9943A]'
                      : 'border-[#2F2F4A] text-[#6B6B8D] hover:border-[#C9943A]/40 hover:text-[#C5C1B8]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>

        {isLoading && (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 text-[#C9943A] animate-spin" />
          </div>
        )}

        {!isLoading && sessions.length === 0 && (
          <div className="text-center py-16">
            <p className="text-[#6B6B8D] mb-4">No sessions yet.</p>
            <Link to={createPageUrl('Solo')}>
              <Button className="bg-[#C9943A] text-[#1A1A2E]">Play Your First Game</Button>
            </Link>
          </div>
        )}

        {!isLoading && sessions.length > 0 && filtered.length === 0 && (
          <p className="text-center text-[#6B6B8D] py-8">No sessions match your filters.</p>
        )}

        <div className="space-y-3">
          {filtered.map(session => (
            <SessionCard key={session.id} session={session} />
          ))}
        </div>
      </main>
    </div>
  );
}