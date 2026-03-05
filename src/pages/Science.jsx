import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowLeft, Brain, MessageSquare, Clock, Zap, FlaskConical, Users, ChevronDown } from 'lucide-react';
import Logo from '@/components/brand/Logo';

const RESEARCH_CARDS = [
  {
    icon: Brain,
    label: 'The Core Finding',
    heading: 'Empathy is a skill. Not a trait.',
    body: `The most important finding in contemporary empathy research is also the most counterintuitive: empathy is not something you either have or you don't. It is a capacity that can be trained, strengthened, and — when neglected — weakened.\n\nJamil Zaki's research at Stanford's Social Neuroscience Lab identifies three distinct systems the brain uses for empathy: sharing what others feel, understanding what others think, and caring enough to act. Read the Room specifically targets the second — perspective-taking — which research identifies as the most relevant to political communication and the most responsive to deliberate practice.`,
    citation: 'Zaki, J. (2019). The War for Kindness. Crown Publishing.',
  },
  {
    icon: MessageSquare,
    label: 'Why Scenarios Work',
    heading: "Passive exposure isn't enough. You have to generate the response yourself.",
    body: `Batson et al. demonstrated that actively generating a response from another person's position — not just observing it or selecting from pre-written options — produces measurably stronger empathy and reduced prejudice. This is why Read the Room asks you to type what you would actually say rather than choose from a card deck.\n\nThe act of generation is the mechanism. The discomfort of not knowing exactly what to write is precisely where the learning happens. Choosing from options teaches recognition. Writing your own response builds the skill.`,
    citation: 'Batson, C.D. et al. (1997). Perspective taking: Imagining how another feels versus imagining how you would feel. Personality and Social Psychology Bulletin.',
  },
  {
    icon: Clock,
    label: 'Why the Timer Matters',
    heading: 'Practicing under mild pressure builds real-world resilience.',
    body: `Stress inoculation research shows that rehearsing difficult responses under mild time pressure produces stronger skill transfer to real high-stakes moments than calm practice alone. The 60-second timer in Quick Draw mode isn't an arbitrary game mechanic — it simulates the conditions of an actual conversation, where you don't have unlimited time to compose the perfect response.\n\nTraining under that pressure is what makes the skill available when you actually need it. You can disable the timer in settings, but the research suggests keeping it on accelerates learning.`,
    citation: 'Meichenbaum, D. (1985). Stress Inoculation Training. Pergamon Press.',
  },
  {
    icon: Zap,
    label: 'Why Feedback Changes Everything',
    heading: 'Skill only improves when practice is followed by specific, immediate reflection.',
    body: `Anders Ericsson's foundational research on deliberate practice established that repetition alone doesn't build skill — what builds skill is repetition plus specific, immediate feedback that identifies what worked and what didn't.\n\nThe AI reflection after each scenario isn't just a feature. It's the scientific mechanism the entire game is built around. Without it, you'd be reinforcing your existing habits. With it, you're building new ones. Each reflection is calibrated to your specific response — not a generic score, but a mirror.`,
    citation: "Ericsson, K.A. et al. (1993). The role of deliberate practice in the acquisition of expert performance. Psychological Review.",
  },
  {
    icon: FlaskConical,
    label: 'Why Political Conversations Specifically',
    heading: 'We systematically underestimate the humanity of people we politically disagree with.',
    body: `Research by Waytz, Epley, and colleagues found that people consistently attribute less mental sophistication — less ability to feel, reason, and experience — to political opponents than to political allies. This dehumanization is largely automatic, largely unconscious, and measurably reduced by perspective-taking interventions.\n\nRead the Room scenarios are designed to place you in exactly the moments where this dehumanization begins — the Thanksgiving table, the canvassing door, the family group chat — and to interrupt it before it closes the conversation.`,
    citation: 'Waytz, A. et al. (2013). Minding the gap: Mind perception and the dehumanization of outgroups. Psychological Science.',
  },
  {
    icon: Users,
    label: 'Why Multiplayer Accelerates Learning',
    heading: 'Seeing how differently others respond to the same situation is itself an empathy intervention.',
    body: `One of the most consistent findings in intergroup contact research is that exposure to the reasoning behind different responses — not just the responses themselves — reduces hostile attribution and increases willingness to engage.\n\nThe Table multiplayer mode is built on this principle. When you see how the people you know respond to the same charged scenario, and hear them explain their thinking, you are doing the hardest version of the practice: extending empathy to people whose responses surprised or challenged you. That surprise is the signal that learning is happening.`,
    citation: 'Pettigrew, T.F. & Tropp, L.R. (2006). A meta-analytic test of intergroup contact theory. Journal of Personality and Social Psychology.',
  },
];

const MARKERS = [
  { num: 1, label: 'Acknowledgment', desc: "Did you recognize the other person's position or feelings?" },
  { num: 2, label: 'Curiosity', desc: 'Did you ask a question or show genuine interest in understanding?' },
  { num: 3, label: 'Non-judgment', desc: 'Did you avoid closing with a verdict about the other person?' },
  { num: 4, label: 'Door Open', desc: 'Does your response invite continued conversation or shut it down?' },
];

function AccordionCard({ card, index, isOpen, onToggle }) {
  const Icon = card.icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 * index }}
      className="bg-[#252542] border border-[#2F2F4A] rounded-xl overflow-hidden"
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-4 p-4 text-left hover:bg-[#2F2F4A]/40 transition-colors"
      >
        <div className="w-9 h-9 rounded-full bg-[#C9943A]/15 border border-[#C9943A]/30 flex items-center justify-center flex-shrink-0">
          <Icon className="w-4 h-4 text-[#C9943A]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] uppercase tracking-widest text-[#C9943A] font-medium mb-0.5">{card.label}</p>
          <p className="font-serif text-[#E8E4DA] text-base leading-snug">{card.heading}</p>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-[#6B6B8D] flex-shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-5">
              <div className="w-full h-px bg-[#2F2F4A] mb-4" />
              {card.body.split('\n\n').map((para, i) => (
                <p key={i} className="text-[#C5C1B8] text-sm leading-relaxed mb-3">{para}</p>
              ))}
              <div className="mt-4 pl-3 border-l-2 border-[#C9943A]/40">
                <p className="text-xs text-[#6B6B8D] italic">{card.citation}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function Science() {
  const [openIndex, setOpenIndex] = useState(null);

  const handleToggle = (i) => setOpenIndex(openIndex === i ? null : i);

  return (
    <div className="min-h-screen bg-[#1A1A2E]">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-[#1A1A2E]/95 backdrop-blur border-b border-[#252542] px-4 py-3 flex items-center justify-between">
        <Link to={createPageUrl('Home')}>
          <button className="w-9 h-9 rounded-lg flex items-center justify-center text-[#C5C1B8] hover:text-[#C9943A] hover:bg-[#252542] transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
        </Link>
        <Logo size="small" />
        <div className="w-9" />
      </header>

      <main className="max-w-2xl mx-auto px-5 py-10 space-y-12 pb-20">

        {/* SECTION 1 — HERO */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <p className="text-[10px] uppercase tracking-widest text-[#C9943A] font-medium mb-3">Why It Works</p>
          <h1 className="font-serif text-3xl md:text-4xl text-[#E8E4DA] leading-tight mb-4">
            The Science Behind Read the Room
          </h1>
          <p className="text-[#6B6B8D] text-base leading-relaxed">
            Every mechanic in this game is grounded in research on how empathy actually gets built — not just felt.
          </p>
        </motion.div>

        {/* SECTION 2 — STAT STRIP */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-3 gap-3"
        >
          {[
            { num: '4', label: 'Empathy markers' },
            { num: '60s', label: 'Pressure window' },
            { num: '6', label: 'Research pillars' },
          ].map((stat) => (
            <div key={stat.label} className="bg-[#252542] border border-[#2F2F4A] rounded-xl p-4 text-center">
              <p className="font-serif text-3xl text-[#C9943A] font-semibold leading-none mb-1">{stat.num}</p>
              <p className="text-[11px] text-[#6B6B8D]">{stat.label}</p>
            </div>
          ))}
        </motion.div>

        {/* SECTION 3 — THE FOUR MARKERS */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-xl border p-5 md:p-6"
          style={{ background: '#1E1E38', borderColor: 'rgba(201,148,58,0.20)' }}
        >
          <p className="text-[10px] uppercase tracking-widest text-[#C9943A] font-medium mb-3">The Four Markers</p>
          <p className="text-[#C5C1B8] text-sm leading-relaxed mb-6">
            Your response is evaluated across four dimensions of empathic communication. Each scored 0–25 for a total out of 100.
          </p>
          <div className="space-y-4">
            {MARKERS.map((m) => (
              <div key={m.num} className="flex items-start gap-4">
                <div className="w-7 h-7 rounded-full bg-[#C9943A] flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-[#1A1A2E] text-xs font-bold">{m.num}</span>
                </div>
                <div>
                  <p className="text-[#E8E4DA] font-semibold text-sm">{m.label}</p>
                  <p className="text-[#6B6B8D] text-sm mt-0.5">{m.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* SECTION 4 — RESEARCH FINDINGS */}
        <div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-[10px] uppercase tracking-widest text-[#6B6B8D] font-medium mb-4"
          >
            Research Findings
          </motion.p>
          <div className="space-y-3">
            {RESEARCH_CARDS.map((card, i) => (
              <AccordionCard
                key={i}
                card={card}
                index={i}
                isOpen={openIndex === i}
                onToggle={() => handleToggle(i)}
              />
            ))}
          </div>
        </div>

        {/* SECTION 5 — CLOSING CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-[#252542] border border-[#2F2F4A] rounded-xl p-6 text-center"
        >
          <h2 className="font-serif text-xl text-[#E8E4DA] mb-3">Built on The Empathy Enigma framework</h2>
          <p className="text-[#6B6B8D] text-sm leading-relaxed mb-5">
            The newsletter goes deeper — case studies, frameworks, and the research behind empathy as a trainable skill. Every week.
          </p>
          <a
            href="https://theempathyenigma.substack.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-[#C9943A] hover:bg-[#D4A94D] text-[#1A1A2E] font-semibold text-sm px-6 py-2.5 rounded-lg transition-colors"
          >
            Read the Newsletter →
          </a>
          <p className="text-[10px] text-[#6B6B8D] italic mt-3">The Empathy Enigma by Danielle Solinski</p>
        </motion.div>

      </main>
    </div>
  );
}