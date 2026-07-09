import { HeartPulse } from 'lucide-react';
import { CardContainer } from '@/components/common/CardContainer';
import { ConfidenceRing } from './ConfidenceRing';
import { RetentionLevelBadge } from './RetentionLevelBadge';
import { ConfidenceTrendChart } from './ConfidenceTrendChart';
import { DecayIndicator } from './DecayIndicator';
import { RETENTION_LEVEL_META, nextReviewLabel, RETENTION_TONE_TEXT, scoreTone } from '@/lib/retention';
import { cn } from '@/lib/utils';
import type { RetentionProfile } from '@/types';

/**
 * Topic Workspace learning-health block — current confidence, retention level +
 * score, confidence trend, next review and a plain-language health read.
 * Renders a gentle placeholder until the topic has been revised at least once.
 */
export function LearningHealthCard({
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
          <HeartPulse className="size-4 text-primary" /> Learning Health
        </span>
        {profile && <RetentionLevelBadge level={profile.currentLevel} />}
      </div>

      {!profile ? (
        <p className="text-sm text-muted-foreground">
          Revise this topic to start tracking confidence and retention health.
        </p>
      ) : (
        <>
          <div className="flex items-center gap-4">
            <ConfidenceRing value={profile.confidenceScore} size={84} />
            <div className="flex flex-col gap-1">
              <div className="flex items-baseline gap-2">
                <span className={cn('text-2xl font-semibold tabular-nums', RETENTION_TONE_TEXT[scoreTone(profile.retentionScore)])}>
                  {profile.retentionScore}%
                </span>
                <span className="text-xs uppercase tracking-wider text-muted-foreground">retention</span>
              </div>
              <p className="text-sm text-muted-foreground">{RETENTION_LEVEL_META[profile.currentLevel].description}</p>
              <p className="text-xs text-muted-foreground">Next review · {nextReviewLabel(profile.daysUntilReview)}</p>
            </div>
          </div>

          <ConfidenceTrendChart trend={profile.confidenceTrend} height={48} />
          <div className="flex items-center justify-between border-t border-border/60 pt-3 text-xs text-muted-foreground">
            <DecayIndicator decayScore={profile.decayScore} />
            <span className="tabular-nums">{profile.reviewCount} reviews</span>
          </div>
        </>
      )}
    </CardContainer>
  );
}
