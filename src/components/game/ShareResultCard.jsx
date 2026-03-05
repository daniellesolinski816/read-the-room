import React, { useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Share2, Twitter, Linkedin, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

const MARKERS = [
  { key: 'acknowledgment', label: 'Acknowledgment', color: '#C9943A' },
  { key: 'curiosity',      label: 'Curiosity',      color: '#7B8FD4' },
  { key: 'nonjudgment',   label: 'Non-judgment',   color: '#6DBF8A' },
  { key: 'door_open',     label: 'Door Open',       color: '#D47B7B' },
];

function ScoreBar({ label, value, color }) {
  const pct = Math.round((value / 25) * 100);
  return (
    <div className="mb-2">
      <div className="flex justify-between text-xs mb-1" style={{ color: '#C5C1B8' }}>
        <span>{label}</span>
        <span style={{ color }}>{value}/25</span>
      </div>
      <div style={{ background: '#2F2F4A', borderRadius: 4, height: 6, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, background: color, height: '100%', borderRadius: 4 }} />
      </div>
    </div>
  );
}

// The card that will be captured as an image
function CardCanvas({ scores, total, scenarioTitle, reflection }) {
  const takeaway = reflection ? reflection.split('.')[0] + '.' : 'Empathy is a skill — keep practising.';

  return (
    <div
      style={{
        width: 480,
        background: 'linear-gradient(135deg, #1A1A2E 0%, #252542 100%)',
        borderRadius: 20,
        padding: '32px 36px',
        fontFamily: 'Inter, sans-serif',
        color: '#E8E4DA',
        border: '1px solid #2F2F4A',
        boxSizing: 'border-box',
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, letterSpacing: '0.18em', color: '#C9943A', textTransform: 'uppercase', marginBottom: 4 }}>
          The Empathy Enigma
        </div>
        <div style={{ fontSize: 22, fontFamily: 'Georgia, serif', fontWeight: 600, color: '#E8E4DA', lineHeight: 1.2 }}>
          Read the Room
        </div>
        <div style={{ fontSize: 12, color: '#6B6B8D', marginTop: 4 }}>
          {scenarioTitle}
        </div>
      </div>

      {/* Total score */}
      <div style={{
        background: 'rgba(201,148,58,0.12)',
        borderRadius: 12,
        padding: '14px 20px',
        marginBottom: 20,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div>
          <div style={{ fontSize: 11, color: '#C9943A', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Empathy Score</div>
          <div style={{ fontSize: 44, fontWeight: 700, color: '#C9943A', lineHeight: 1 }}>{total}</div>
          <div style={{ fontSize: 11, color: '#6B6B8D' }}>out of 100</div>
        </div>
        <div style={{ fontSize: 36 }}>
          {total >= 80 ? '🌟' : total >= 60 ? '✨' : total >= 40 ? '💡' : '🌱'}
        </div>
      </div>

      {/* Marker bars */}
      <div style={{ marginBottom: 20 }}>
        {MARKERS.map(m => (
          <ScoreBar key={m.key} label={m.label} value={scores[m.key] ?? 0} color={m.color} />
        ))}
      </div>

      {/* Takeaway */}
      <div style={{
        borderLeft: '3px solid #C9943A',
        paddingLeft: 12,
        color: '#C5C1B8',
        fontSize: 12,
        lineHeight: 1.6,
        fontStyle: 'italic',
        marginBottom: 20,
      }}>
        {takeaway}
      </div>

      {/* Footer */}
      <div style={{ fontSize: 10, color: '#6B6B8D', textAlign: 'center', letterSpacing: '0.05em' }}>
        theempathyenigma.com  •  Practice empathy every day
      </div>
    </div>
  );
}

export default function ShareResultCard({ scores, total, scenarioTitle, reflection }) {
  const [open, setOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const cardRef = useRef(null);

  const shareText = `I scored ${total}/100 on Read the Room — an empathy training game 🧠✨ #EmpathyEnigma #ReadTheRoom`;
  const appUrl = 'https://theempathyenigma.com';

  const getImage = async () => {
    setGenerating(true);
    const dataUrl = await toPng(cardRef.current, { pixelRatio: 2 });
    setGenerating(false);
    return dataUrl;
  };

  const handleDownload = async () => {
    const dataUrl = await getImage();
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = 'empathy-score.png';
    a.click();
  };

  const handleTwitter = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(appUrl)}`;
    window.open(url, '_blank');
  };

  const handleLinkedIn = () => {
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(appUrl)}&summary=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank');
  };

  return (
    <>
      <Button
        variant="outline"
        className="flex-1 h-12 border-[#C9943A]/40 text-[#C9943A] hover:bg-[#C9943A]/10"
        onClick={() => setOpen(true)}
      >
        <Share2 className="w-4 h-4 mr-2" />
        Share Result
      </Button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/70" onClick={() => setOpen(false)} />

            <motion.div
              className="relative z-10 bg-[#1A1A2E] rounded-2xl p-6 w-full max-w-lg border border-[#2F2F4A] shadow-2xl"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <button
                onClick={() => setOpen(false)}
                className="absolute top-4 right-4 text-[#6B6B8D] hover:text-[#C5C1B8]"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="font-serif text-xl text-[#E8E4DA] mb-4">Share Your Result</h3>

              {/* Preview (hidden overflow so it stays contained) */}
              <div className="overflow-hidden rounded-xl mb-5 flex justify-center" style={{ background: '#0d0d1a' }}>
                <div ref={cardRef} style={{ display: 'inline-block' }}>
                  <CardCanvas
                    scores={scores}
                    total={total}
                    scenarioTitle={scenarioTitle}
                    reflection={reflection}
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  className="flex-1 bg-[#C9943A] hover:bg-[#D4A94D] text-[#1A1A2E]"
                  onClick={handleDownload}
                  disabled={generating}
                >
                  <Download className="w-4 h-4 mr-2" />
                  {generating ? 'Generating…' : 'Download'}
                </Button>
                <Button
                  variant="outline"
                  className="border-[#1DA1F2] text-[#1DA1F2] hover:bg-[#1DA1F2]/10"
                  onClick={handleTwitter}
                >
                  <Twitter className="w-4 h-4 mr-2" />
                  Twitter
                </Button>
                <Button
                  variant="outline"
                  className="border-[#0A66C2] text-[#0A66C2] hover:bg-[#0A66C2]/10"
                  onClick={handleLinkedIn}
                >
                  <Linkedin className="w-4 h-4 mr-2" />
                  LinkedIn
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}