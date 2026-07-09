import { Trophy, Gauge, TrendingUp, TrendingDown, Minus, ListChecks } from 'lucide-react';
import { CardContainer } from '@/components/common/CardContainer';
import { Badge } from '@/components/ui/badge';
import { READINESS_STATUS_META, ratingTrendTone } from '@/lib/competitive';
import { ANALYTICS_TONE_TEXT } from '@/lib/analytics';
import { cn } from '@/lib/utils';
import type { CompetitiveIntelligence } from '@/types';

/** Overall performance headline — readiness · rating · trend · pending upsolve. */
export function PerformanceSummaryCard({ summary }: { summary: CompetitiveIntelligence['summary'] }) {
  const meta = READINESS_STATUS_META[summary.readinessStatus];
  const tone = ratingTrendTone(summary.ratingTrend);
  const TrendIco = summary.ratingTrend === 'rising' ? TrendingUp : summary.ratingTrend === 'falling' ? TrendingDown : Minus;
  return (
    <CardContainer className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <h3 className="inline-flex items-center gap-2 font-semibold"><Trophy className="size-4 text-primary" /> Overall Performance</h3>
        <Badge variant={meta.badge}>{meta.label}</Badge>
      </div>
      <p className="text-sm text-muted-foreground">{summary.headline}</p>
      <div className="grid grid-cols-2 gap-3 border-t border-border/60 pt-3 sm:grid-cols-4">
        <div className="space-y-0.5">
          <p className="inline-flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground"><Gauge className="size-3" /> Readiness</p>
          <p className="text-xl font-semibold tabular-nums">{summary.overallReadiness}</p>
        </div>
        <div className="space-y-0.5">
          <p className="inline-flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground"><Trophy className="size-3" /> Rating</p>
          <p className="text-xl font-semibold tabular-nums">{summary.currentRating ?? '—'}</p>
        </div>
        <div className="space-y-0.5">
          <p className="inline-flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground"><TrendIco className="size-3" /> Trend</p>
          <p className={cn('text-sm font-semibold capitalize', ANALYTICS_TONE_TEXT[tone])}>{summary.ratingTrend}</p>
        </div>
        <div className="space-y-0.5">
          <p className="inline-flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground"><ListChecks className="size-3" /> Upsolve</p>
          <p className="text-xl font-semibold tabular-nums">{summary.pendingUpsolve}</p>
        </div>
      </div>
    </CardContainer>
  );
}
