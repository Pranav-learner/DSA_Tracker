import { Activity, Flame } from 'lucide-react';
import { TimelineChart } from '../charts/TimelineChart';
import { ChartLegend } from '../charts/ChartLegend';
import { WidgetLink } from './WidgetLink';
import { chartColor } from '../charts/chartTheme';
import type { ActivitySummary } from '@/types';

/** Activity widget — weekly activity timeline + streak summary. */
export function ActivityWidget({ data, loading }: { data?: ActivitySummary; loading?: boolean }) {
  return (
    <TimelineChart
      title="Activity"
      icon={<Activity className="size-4" />}
      action={<WidgetLink to="/analytics/activity" />}
      data={data?.weeklyActivity ?? []}
      name="Events"
      color={chartColor.primary}
      height={200}
      loading={loading}
      footer={
        <ChartLegend
          items={[
            { label: 'Current streak', color: chartColor.warning, value: `${data?.currentStreak ?? 0}d` },
            { label: 'Longest', color: chartColor.muted, value: `${data?.longestStreak ?? 0}d` },
            { label: 'Active days', color: chartColor.success, value: data?.activeDays ?? 0 },
          ]}
        />
      }
    />
  );
}

/** Small streak headline — reusable beside the activity widget. */
export function StreakBadge({ streak }: { streak: number }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-warning">
      <Flame className="size-4" /> {streak}-day streak
    </span>
  );
}
