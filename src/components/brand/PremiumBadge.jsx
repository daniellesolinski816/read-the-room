import React from 'react';
import { Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function PremiumBadge({ compact = false }) {
  return (
    <Link to={createPageUrl('Premium')}>
      <span className={`inline-flex items-center gap-1 bg-[#C9943A]/15 border border-[#C9943A]/40 text-[#C9943A] rounded-full font-medium ${compact ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1'}`}>
        <Sparkles className={compact ? 'w-2.5 h-2.5' : 'w-3 h-3'} />
        Premium
      </span>
    </Link>
  );
}