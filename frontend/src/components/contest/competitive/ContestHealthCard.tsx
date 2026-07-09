import { Link } from 'react-router-dom';
import { HeartPulse, TrendingUp, TrendingDown, Minus, ListChecks, AlertTriangle, ArrowRight } from 'lucide-react';
import { CardContainer } from '@/components/common/CardContainer';
import { Badge } from '@/components/ui/badge';
import { ReadinessGauge } from './ReadinessGauge';
import { READINESS_STATUS_META, ratingTrendTone } from '@/lib/competitive';
import { ANALYTICS_TONE_TEXT } from '@/lib/analytics';
import { cn } from '@/lib/utils';
import type { CompetitiveIntelligence } from '@/types';

/** Compact contest-health composite — readiness gauge + trend + upsolve + weak-pattern count. */
export function ContestHealthCard({ summary, weakCount, to = '/contests/intelligence' }: {
  summary: CompetitiveIntelligence['summary'];
  weakCount: number;
  to?: string;
}) {
  const meta = READINESS_STATUS_META[summary.readinessStatus];
  const tone = ratingTrendTone(summary.ratingTrend);
  const TrendIco = summary.ratingTrend === 'rising' ? TrendingUp : summary.ratingTrend === 'falling' ? TrendingDown : Minus;
  return (
    <CardContainer className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="inline-flex items-center gap-2 text-sm font-semibold"><HeartPulse className="size-4 text-primary" /> Contest Health</h3>
        <Badge variant={meta.badge}>{meta.label}</Badge>
      </div>
      <div className="flex items-center gap-5">
        <ReadinessGauge score={summary.overallReadiness} size={128} />
        <ul className="flex-1 space-y-2 text-sm">
          <li className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 text-muted-foreground"><TrendIco className="size-4" /> Rating</span>
            <span className={cn('font-medium capitalize', ANALYTICS_TONE_TEXT[tone])}>{summary.currentRating ?? '—'} · {summary.ratingTrend}</span>
          </li>
          <li className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 text-muted-foreground"><ListChecks className="size-4" /> Pending upsolve</span>
            <span className="font-medium tabular-nums">{summary.pendingUpsolve}</span>
          </li>
          <li className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 text-muted-foreground"><AlertTriangle className="size-4" /> Weak patterns</span>
            <span className="font-medium tabular-nums">{weakCount}</span>
          </li>
        </ul>
      </div>
      <Link to={to} className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
        View competitive intelligence <ArrowRight className="size-3.5" />
      </Link>
    </CardContainer>
  );
}
