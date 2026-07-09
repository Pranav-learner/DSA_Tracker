import { Activity, ShieldAlert } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RetentionSummary } from './RetentionSummary';
import { ConfidenceTrendChart } from './ConfidenceTrendChart';
import { ReviewSuccessCard } from './ReviewSuccessCard';
import { RetentionLevelBadge } from './RetentionLevelBadge';
import { EmptyState } from '@/components/common/EmptyState';
import { ENTITY_LABEL } from '@/lib/revision';
import { RETENTION_TONE_TEXT, scoreTone } from '@/lib/retention';
import { cn } from '@/lib/utils';
import type { RetentionOverview } from '@/types';

/** The full retention overview: aggregates + confidence trend + at-risk list. */
export function RetentionOverviewCard({ overview }: { overview: RetentionOverview }) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="inline-flex items-center gap-2">
          <Activity className="size-5 text-primary" /> Knowledge Retention
        </CardTitle>
        <span className="text-xs text-muted-foreground">{overview.totalProfiles} tracked</span>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        {overview.totalProfiles === 0 ? (
          <EmptyState
            icon={<Activity className="size-6" />}
            title="No retention data yet"
            description="Complete a revision to start tracking confidence and retention."
          />
        ) : (
          <>
            <RetentionSummary overview={overview} />

            <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
              <div className="rounded-lg border border-border/60 bg-card/40 p-4">
                <ConfidenceTrendChart trend={overview.confidenceTrend} height={72} />
              </div>
              <ReviewSuccessCard successRate={overview.revisionSuccessRate} />
            </div>

            {overview.atRisk.length > 0 && (
              <div className="flex flex-col gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  <ShieldAlert className="size-3.5 text-danger" /> Needs attention
                </span>
                <ul className="flex flex-col divide-y divide-border/60">
                  {overview.atRisk.map((r) => (
                    <li key={`${r.entityType}:${r.entityId}`} className="flex items-center justify-between gap-3 py-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{r.title}</p>
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                          {ENTITY_LABEL[r.entityType]}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={cn('text-sm font-semibold tabular-nums', RETENTION_TONE_TEXT[scoreTone(r.retentionScore)])}>
                          {r.retentionScore}%
                        </span>
                        <RetentionLevelBadge level={r.currentLevel} showIcon={false} />
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
