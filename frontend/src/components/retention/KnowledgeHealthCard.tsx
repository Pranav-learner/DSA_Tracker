import { Brain, History, CalendarClock, Repeat } from 'lucide-react';
import { CardContainer } from '@/components/common/CardContainer';
import { ConfidenceRing } from './ConfidenceRing';
import { RetentionLevelBadge } from './RetentionLevelBadge';
import { ConfidenceTrendChart } from './ConfidenceTrendChart';
import { DecayIndicator } from './DecayIndicator';
import { formatShortDate } from '@/lib/revision';
import { nextReviewLabel, RETENTION_TONE_TEXT, scoreTone } from '@/lib/retention';
import { cn } from '@/lib/utils';
import type { RetentionProfile } from '@/types';

/**
 * Notebook knowledge-health block — confidence history, retention history,
 * review count, last/next review and an overall knowledge-health read.
 */
export function KnowledgeHealthCard({
  profile,
  className,
}: {
  profile: RetentionProfile | null | undefined;
  className?: string;
}) {
  return (
    <CardContainer className={cn('flex flex-col gap-4', className)}>
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-2 text-sm font-semibold">
          <Brain className="size-4 text-primary" /> Knowledge Health
        </span>
        {profile && <RetentionLevelBadge level={profile.currentLevel} />}
      </div>

      {!profile ? (
        <p className="text-sm text-muted-foreground">
          No retention data yet — review this entry to begin tracking its knowledge health.
        </p>
      ) : (
        <>
          <div className="flex items-center gap-4">
            <ConfidenceRing value={profile.confidenceScore} size={80} />
            <div className="grid flex-1 grid-cols-2 gap-x-3 gap-y-2 text-sm">
              <Metric icon={<Brain className="size-3.5" />} label="Retention" value={`${profile.retentionScore}%`} tone={scoreTone(profile.retentionScore)} />
              <Metric icon={<Repeat className="size-3.5" />} label="Reviews" value={String(profile.reviewCount)} />
              <Metric
                icon={<History className="size-3.5" />}
                label="Last review"
                value={profile.lastReviewDate ? formatShortDate(profile.lastReviewDate) : '—'}
              />
              <Metric icon={<CalendarClock className="size-3.5" />} label="Next" value={nextReviewLabel(profile.daysUntilReview)} />
            </div>
          </div>

          <ConfidenceTrendChart trend={profile.confidenceTrend} height={44} />
          <div className="border-t border-border/60 pt-3">
            <DecayIndicator decayScore={profile.decayScore} />
          </div>
        </>
      )}
    </CardContainer>
  );
}

function Metric({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone?: ReturnType<typeof scoreTone>;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground">
        {icon} {label}
      </span>
      <span className={cn('font-semibold tabular-nums', tone ? RETENTION_TONE_TEXT[tone] : 'text-foreground')}>
        {value}
      </span>
    </div>
  );
}
