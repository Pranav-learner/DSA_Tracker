import { Gauge, Brain, ShieldAlert, RefreshCw, Trophy, AlarmClock } from 'lucide-react';
import { DashboardMetricCard } from '@/components/dashboard';
import type { RetentionOverview } from '@/types';

/** Retention aggregates as a grid of dashboard-style metric tiles. */
export function RetentionSummary({ overview }: { overview: RetentionOverview }) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
      <DashboardMetricCard
        label="Avg Confidence"
        value={`${overview.averageConfidence}%`}
        icon={<Gauge className="size-4" />}
        tone="primary"
      />
      <DashboardMetricCard
        label="Avg Retention"
        value={`${overview.averageRetention}%`}
        icon={<Brain className="size-4" />}
        tone="success"
      />
      <DashboardMetricCard
        label="Mastered"
        value={overview.masteredCount}
        icon={<Trophy className="size-4" />}
        tone="success"
      />
      <DashboardMetricCard
        label="Needs Review"
        value={overview.needsReviewCount}
        icon={<RefreshCw className="size-4" />}
        tone={overview.needsReviewCount > 0 ? 'warning' : 'muted'}
      />
      <DashboardMetricCard
        label="At Risk"
        value={overview.atRiskCount}
        icon={<ShieldAlert className="size-4" />}
        tone={overview.atRiskCount > 0 ? 'warning' : 'muted'}
      />
      <DashboardMetricCard
        label="Overdue"
        value={overview.overdueReviews}
        icon={<AlarmClock className="size-4" />}
        tone={overview.overdueReviews > 0 ? 'warning' : 'muted'}
      />
    </div>
  );
}
