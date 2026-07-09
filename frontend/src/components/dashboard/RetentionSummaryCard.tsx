import { TrendingUp, TrendingDown, Minus, Gauge, Brain, ShieldAlert, Trophy, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { DashboardMetricCard } from './DashboardMetricCard';
import { DashboardGrid } from './DashboardGrid';
import { CONFIDENCE_TREND_META, RETENTION_TONE_TEXT } from '@/lib/retention';
import { cn } from '@/lib/utils';
import type { DashboardRetention } from '@/types';

const TREND_ICON = { rising: TrendingUp, falling: TrendingDown, stable: Minus } as const;

/**
 * Retention Summary — the compact retention/confidence read for the dashboard,
 * sourced from the aggregated dashboard payload (no extra fetch). Deep-links to
 * the full Knowledge Retention page.
 */
export function RetentionSummaryCard({ retention }: { retention: DashboardRetention }) {
  const trend = CONFIDENCE_TREND_META[retention.trendDirection];
  const TrendIco = TREND_ICON[retention.trendDirection];
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className={cn('inline-flex items-center gap-1.5 text-sm font-medium', RETENTION_TONE_TEXT[trend.tone])}>
          <TrendIco className="size-4" /> Confidence {trend.label.toLowerCase()}
          {retention.trendDelta !== 0 && (
            <span className="tabular-nums">({retention.trendDelta > 0 ? '+' : ''}{retention.trendDelta})</span>
          )}
        </span>
        <Link to="/retention" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
          Details <ArrowRight className="size-3" />
        </Link>
      </div>

      <DashboardGrid cols={4}>
        <DashboardMetricCard label="Avg Confidence" value={`${retention.averageConfidence}%`} icon={<Gauge className="size-4" />} tone="primary" />
        <DashboardMetricCard label="Avg Retention" value={`${retention.averageRetention}%`} icon={<Brain className="size-4" />} tone="success" />
        <DashboardMetricCard label="Mastered" value={retention.masteredCount} icon={<Trophy className="size-4" />} tone="success" />
        <DashboardMetricCard label="At Risk" value={retention.atRiskCount} icon={<ShieldAlert className="size-4" />} tone={retention.atRiskCount > 0 ? 'warning' : 'muted'} />
      </DashboardGrid>
    </div>
  );
}
