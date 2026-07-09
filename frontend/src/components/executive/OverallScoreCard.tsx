import { Gauge } from 'lucide-react';
import { CardContainer } from '@/components/common/CardContainer';
import { ProgressGauge } from '@/components/analytics/charts';
import { scoreColor } from '@/lib/retention';
import type { ExecutiveScores } from '@/types';

/** The headline Overall Readiness score with the five sub-scores beside it. */
export function OverallScoreCard({ scores }: { scores: ExecutiveScores }) {
  const subs = [
    ['Learning', scores.learning],
    ['Knowledge', scores.knowledge],
    ['Retention', scores.retention],
    ['Revision', scores.revision],
    ['Productivity', scores.productivity],
  ] as const;
  return (
    <CardContainer className="flex flex-col items-center gap-5 sm:flex-row sm:items-center sm:gap-8">
      <div className="flex flex-col items-center gap-1">
        <ProgressGauge value={scores.overallReadiness} label="Readiness" color={scoreColor(scores.overallReadiness)} size={180} />
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
          <Gauge className="size-3.5" /> Overall Readiness
        </span>
      </div>
      <div className="grid flex-1 grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-1">
        {subs.map(([label, score]) => (
          <div key={label} className="flex items-center justify-between gap-3">
            <span className="text-sm text-muted-foreground">{label}</span>
            <span className="text-sm font-semibold tabular-nums" style={{ color: scoreColor(score) }}>
              {score}%
            </span>
          </div>
        ))}
      </div>
    </CardContainer>
  );
}
