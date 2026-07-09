import { HeartPulse } from 'lucide-react';
import { CardContainer } from '@/components/common/CardContainer';
import { ScoreBars } from '@/components/reports';
import type { ScoreBreakdown } from '@/types';

/** Executive health breakdown — the five score dimensions as bars. */
export function HealthBreakdown({ breakdown }: { breakdown: ScoreBreakdown[] }) {
  return (
    <CardContainer className="space-y-4">
      <h3 className="inline-flex items-center gap-2 text-sm font-semibold">
        <HeartPulse className="size-4 text-primary" /> Health Breakdown
      </h3>
      <ScoreBars items={breakdown.map((b) => ({ label: b.label, score: b.score }))} />
    </CardContainer>
  );
}
