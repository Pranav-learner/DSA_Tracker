import { GraduationCap, Brain, CalendarClock, Activity, type LucideIcon } from 'lucide-react';
import { HEALTH_STATUS_META, HEALTH_BAR_CLASS } from '@/lib/health';
import { RETENTION_TONE_TEXT } from '@/lib/retention';
import { cn } from '@/lib/utils';
import type { HealthIndicator as HealthIndicatorData, HealthKey } from '@/types';

const ICON: Record<HealthKey, LucideIcon> = {
  learning: GraduationCap,
  knowledge: Brain,
  revision: CalendarClock,
  retention: Activity,
};

/** One health dimension: labelled score + a status-coloured progress track. */
export function HealthIndicator({ indicator }: { indicator: HealthIndicatorData }) {
  const meta = HEALTH_STATUS_META[indicator.status];
  const Ico = ICON[indicator.key];
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 text-sm font-medium">
          <Ico className="size-4 text-muted-foreground" /> {indicator.label}
        </span>
        <span className={cn('text-sm font-semibold tabular-nums', RETENTION_TONE_TEXT[meta.tone])}>
          {indicator.score}%
        </span>
      </div>
      <div
        className="h-2 overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuenow={indicator.score}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${indicator.label} health`}
      >
        <div
          className={cn('h-full rounded-full transition-all', HEALTH_BAR_CLASS[indicator.status])}
          style={{ width: `${indicator.score}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground">{indicator.detail}</p>
    </div>
  );
}
