import React, { useState } from 'react';
import { CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { useQuery, useQueryClient } from '@tanstack/react-query';

export default function ModerationPanel() {
  const qc = useQueryClient();
  const [actioning, setActioning] = useState(null);

  const { data: pending = [], isLoading } = useQuery({
    queryKey: ['pendingScenarios'],
    queryFn: () => base44.entities.CommunityScenario.filter({ status: 'pending' }, '-created_date', 30),
  });

  const approve = async (id) => {
    setActioning(id + '_approve');
    await base44.entities.CommunityScenario.update(id, { status: 'approved' });
    qc.invalidateQueries({ queryKey: ['pendingScenarios'] });
    qc.invalidateQueries({ queryKey: ['communityScenarios'] });
    setActioning(null);
  };

  const reject = async (id) => {
    const reason = window.prompt('Reason for rejection (optional):') ?? '';
    setActioning(id + '_reject');
    await base44.entities.CommunityScenario.update(id, { status: 'rejected', rejection_reason: reason });
    qc.invalidateQueries({ queryKey: ['pendingScenarios'] });
    setActioning(null);
  };

  if (isLoading) return null;
  if (pending.length === 0) return (
    <div className="bg-[#252542] rounded-xl p-5 border border-[#2F2F4A] text-center">
      <CheckCircle className="w-6 h-6 text-green-400 mx-auto mb-2" />
      <p className="text-[#6B6B8D] text-sm">No pending submissions — inbox clear!</p>
    </div>
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <Clock className="w-4 h-4 text-[#C9943A]" />
        <h3 className="font-serif text-base text-[#E8E4DA]">Pending Review ({pending.length})</h3>
      </div>
      {pending.map(s => (
        <div key={s.id} className="bg-[#252542] rounded-xl p-4 border border-amber-500/20">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <span className="text-xs text-[#6B6B8D]">{s.category} · by {s.submitted_by_name}</span>
              <p className="font-serif text-[#E8E4DA] text-sm mt-0.5">{s.title}</p>
              <p className="text-[#C5C1B8] text-xs mt-1 line-clamp-2">{s.prompt}</p>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button
                size="sm"
                className="h-8 bg-green-700/30 hover:bg-green-700/50 text-green-300 border border-green-700/40 text-xs"
                onClick={() => approve(s.id)}
                disabled={!!actioning}
              >
                {actioning === s.id + '_approve' ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
              </Button>
              <Button
                size="sm"
                className="h-8 bg-red-900/30 hover:bg-red-900/50 text-red-300 border border-red-900/40 text-xs"
                onClick={() => reject(s.id)}
                disabled={!!actioning}
              >
                {actioning === s.id + '_reject' ? <Loader2 className="w-3 h-3 animate-spin" /> : <XCircle className="w-3 h-3" />}
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}