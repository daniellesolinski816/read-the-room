import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';

const CATEGORIES = ['Family', 'Community', 'Digital', 'Civic', 'Workplace', 'Personal', 'Reflection'];

export default function SubmitScenarioModal({ user, onClose, onSubmitted }) {
  const [form, setForm] = useState({ title: '', category: 'Community', prompt: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.prompt.trim().length < 40) {
      setError('Please write a more detailed scenario (at least 40 characters).');
      return;
    }
    setLoading(true);
    await base44.entities.CommunityScenario.create({
      ...form,
      submitted_by: user.email,
      submitted_by_name: user.full_name || 'Anonymous',
      status: 'pending',
    });
    setLoading(false);
    onSubmitted();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-[#252542] rounded-2xl p-6 w-full max-w-md border border-[#2F2F4A]"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-serif text-xl text-[#E8E4DA]">Submit a Scenario</h2>
          <button onClick={onClose} className="text-[#6B6B8D] hover:text-[#C5C1B8]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-[#6B6B8D] uppercase tracking-wider">Title</label>
            <input
              className="w-full mt-1 bg-[#1A1A2E] border border-[#2F2F4A] rounded-lg px-3 py-2 text-[#E8E4DA] text-sm focus:outline-none focus:border-[#C9943A]"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="A brief title..."
              required
              maxLength={80}
            />
          </div>

          <div>
            <label className="text-xs text-[#6B6B8D] uppercase tracking-wider">Category</label>
            <select
              className="w-full mt-1 bg-[#1A1A2E] border border-[#2F2F4A] rounded-lg px-3 py-2 text-[#E8E4DA] text-sm focus:outline-none focus:border-[#C9943A]"
              value={form.category}
              onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
            >
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs text-[#6B6B8D] uppercase tracking-wider">Scenario</label>
            <textarea
              className="w-full mt-1 bg-[#1A1A2E] border border-[#2F2F4A] rounded-lg px-3 py-2 text-[#E8E4DA] text-sm focus:outline-none focus:border-[#C9943A] resize-none"
              rows={5}
              value={form.prompt}
              onChange={e => setForm(f => ({ ...f, prompt: e.target.value }))}
              placeholder="Describe a real-world moment that calls for empathy..."
              required
            />
            <p className="text-xs text-[#6B6B8D] mt-1">{form.prompt.length} chars · aim for 80–300</p>
          </div>

          {error && <p className="text-red-400 text-xs">{error}</p>}

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-[#C9943A] hover:bg-[#D4A94D] text-[#1A1A2E]"
          >
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
            Submit for Review
          </Button>
          <p className="text-xs text-[#6B6B8D] text-center">Your scenario will be reviewed before appearing publicly.</p>
        </form>
      </motion.div>
    </motion.div>
  );
}