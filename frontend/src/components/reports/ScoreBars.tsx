import { HEALTH_BAR_CLASS } from '@/lib/health';
import { RETENTION_TONE_TEXT, scoreTone } from '@/lib/retention';
import { cn } from '@/lib/utils';
import type { HealthStatus } from '@/types';

export interface ScoreBarItem {
  label: string;
  score: number;
}

function status(score: number): HealthStatus {
  return score >= 80 ? 'excellent' : score >= 60 ? 'good' : score >= 40 ? 'fair' : 'at-risk';
}

/** A labelled list of 0–100 score bars — shared by report charts + health breakdown. */
export function ScoreBars({ items, className }: { items: ScoreBarItem[]; className?: string }) {
  return (
    <div className={cn('space-y-3', className)}>
      {items.map((it) => (
        <div key={it.label} className="flex flex-col gap-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">{it.label}</span>
            <span className={cn('font-semibold tabular-nums', RETENTION_TONE_TEXT[scoreTone(it.score)])}>{it.score}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div className={cn('h-full rounded-full transition-all', HEALTH_BAR_CLASS[status(it.score)])} style={{ width: `${it.score}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}
