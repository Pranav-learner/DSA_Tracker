import { Activity } from 'lucide-react';
import { ContributionHeatmap } from '../charts/ContributionHeatmap';
import { WidgetLink } from './WidgetLink';
import type { ActivitySummary } from '@/types';

/** Contribution widget — GitHub-style daily activity heatmap. */
export function ContributionWidget({ data, loading }: { data?: ActivitySummary; loading?: boolean }) {
  return (
    <ContributionHeatmap
      title="Learning Activity"
      icon={<Activity className="size-4" />}
      action={<WidgetLink to="/analytics/activity" />}
      data={data?.dailyActivity ?? []}
      loading={loading}
    />
  );
}
