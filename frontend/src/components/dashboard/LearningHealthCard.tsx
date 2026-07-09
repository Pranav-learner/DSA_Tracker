import { HeartPulse, ShieldAlert, Trophy, CalendarClock, Gauge } from 'lucide-react';
import { CardContainer } from '@/components/common/CardContainer';
import { Badge } from '@/components/ui/badge';
import { HealthIndicator } from './HealthIndicator';
import { HEALTH_STATUS_META } from '@/lib/health';
import { RETENTION_TONE_TEXT } from '@/lib/retention';
import { cn } from '@/lib/utils';
import type { DashboardHealth } from '@/types';

/**
 * Learning Health panel — the composite read across all four engines
 * (learning · knowledge · revision · retention) plus the headline figures
 * (confidence, at-risk, mastered, upcoming). Every value comes from the
 * backend health aggregation; nothing is computed here.
 */
export function LearningHealthCard({ health }: { health: DashboardHealth }) {
  const meta = HEALTH_STATUS_META[health.overallStatus];
  return (
    <CardContainer className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-2 text-sm font-semibold">
          <HeartPulse className="size-4 text-primary" /> Learning Health
        </span>
        <div className="flex items-center gap-2">
          <span className={cn('text-lg font-semibold tabular-nums', RETENTION_TONE_TEXT[meta.tone])}>
            {health.overallScore}%
          </span>
          <Badge variant={meta.badge}>{meta.label}</Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {health.indicators.map((ind) => (
          <HealthIndicator key={ind.key} indicator={ind} />
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 border-t border-border/60 pt-4 lg:grid-cols-4">
        <Figure icon={<Gauge className="size-4" />} label="Confidence" value={`${health.confidence}%`} />
        <Figure icon={<ShieldAlert className="size-4" />} label="At Risk" value={health.topicsAtRisk} tone={health.topicsAtRisk > 0 ? 'danger' : 'muted'} />
        <Figure icon={<Trophy className="size-4" />} label="Mastered" value={health.masteredTopics} tone="success" />
        <Figure icon={<CalendarClock className="size-4" />} label="Upcoming" value={health.upcomingReviews} />
      </div>
    </CardContainer>
  );
}

function Figure({
  icon,
  label,
  value,
  tone = 'muted',
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  tone?: keyof typeof RETENTION_TONE_TEXT;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground">
        {icon} {label}
      </span>
      <span className={cn('text-lg font-semibold tabular-nums', RETENTION_TONE_TEXT[tone])}>{value}</span>
    </div>
  );
}
