import { CardContainer } from '@/components/common/CardContainer';
import { RetentionLevelBadge } from './RetentionLevelBadge';
import { ConfidenceRing } from './ConfidenceRing';
import { DecayIndicator } from './DecayIndicator';
import { ConfidenceTrendChart } from './ConfidenceTrendChart';
import { ENTITY_LABEL } from '@/lib/revision';
import { nextReviewLabel, RETENTION_TONE_TEXT, scoreTone } from '@/lib/retention';
import { cn } from '@/lib/utils';
import type { RetentionProfile } from '@/types';

/** A single entity's retention profile: rings, level, decay + trend sparkline. */
export function RetentionCard({ profile, className }: { profile: RetentionProfile; className?: string }) {
  return (
    <CardContainer className={cn('flex flex-col gap-4', className)} interactive>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              {ENTITY_LABEL[profile.entityType]}
            </span>
            <RetentionLevelBadge level={profile.currentLevel} />
          </div>
          <h3 className="mt-1 truncate font-semibold">{profile.title}</h3>
          <p className="text-xs text-muted-foreground">{nextReviewLabel(profile.daysUntilReview)}</p>
        </div>
        <ConfidenceRing value={profile.confidenceScore} size={72} strokeWidth={7} />
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <Stat label="Retention" value={`${profile.retentionScore}%`} tone={scoreTone(profile.retentionScore)} />
        <Stat label="Success" value={`${profile.successRate}%`} tone={scoreTone(profile.successRate)} />
        <Stat label="Reviews" value={String(profile.reviewCount)} tone="muted" />
      </div>

      <ConfidenceTrendChart trend={profile.confidenceTrend} height={44} />

      <div className="flex items-center justify-between border-t border-border/60 pt-3">
        <DecayIndicator decayScore={profile.decayScore} />
        {profile.overdueReviews > 0 && (
          <span className="text-xs text-danger">{profile.overdueReviews}d overdue</span>
        )}
      </div>
    </CardContainer>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone: ReturnType<typeof scoreTone> }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className={cn('text-lg font-semibold tabular-nums', RETENTION_TONE_TEXT[tone])}>{value}</span>
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
    </div>
  );
}
