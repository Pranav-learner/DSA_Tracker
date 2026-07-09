import { ShieldAlert } from 'lucide-react';
import { useWeaknesses } from '@/hooks/useAnalytics';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setSeverityFilter } from '@/store/slices/analyticsSlice';
import { SectionHeader } from '@/components/common/SectionHeader';
import { ErrorState } from '@/components/common/ErrorState';
import { Badge } from '@/components/ui/badge';
import { AnalyticsGrid, MetricCard, FilterBar, LoadingAnalytics, EmptyAnalytics, WeaknessCard } from '@/components/analytics';
import { SEVERITY_META } from '@/lib/intelligence';
import { cn } from '@/lib/utils';
import type { Severity } from '@/types';

const SEVERITIES: Severity[] = ['high', 'medium', 'low'];

/** Weakness Report — rule-based weaknesses prioritised by severity. */
export function WeaknessReport() {
  const { data, isLoading, isError, error, refetch } = useWeaknesses();
  const dispatch = useAppDispatch();
  const filter = useAppSelector((s) => s.analytics.severityFilter);
  const shown = (data ?? []).filter((w) => !filter || w.severity === filter);

  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="Pattern Intelligence" title="Weakness Report" description="Where to focus — ranked by severity." icon={<ShieldAlert className="size-5" />} />
      <FilterBar />

      {isError ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : isLoading || !data ? (
        <LoadingAnalytics metrics={3} panels={2} />
      ) : data.length === 0 ? (
        <EmptyAnalytics title="No weaknesses detected" description="Great — nothing crosses the warning thresholds right now." />
      ) : (
        <>
          <AnalyticsGrid cols={3}>
            {SEVERITIES.map((sev) => (
              <MetricCard key={sev} label={`${SEVERITY_META[sev].label} severity`} value={data.filter((w) => w.severity === sev).length} tone={SEVERITY_META[sev].tone} />
            ))}
          </AnalyticsGrid>

          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => dispatch(setSeverityFilter(null))} className="focus:outline-none">
              <Badge variant={!filter ? 'primary' : 'outline'} className="cursor-pointer">
                All
              </Badge>
            </button>
            {SEVERITIES.map((sev) => (
              <button key={sev} type="button" onClick={() => dispatch(setSeverityFilter(sev))} className="focus:outline-none">
                <span className={cn('transition-opacity', filter && filter !== sev && 'opacity-40')}>
                  <Badge variant={SEVERITY_META[sev].badge} className="cursor-pointer">
                    {SEVERITY_META[sev].label}
                  </Badge>
                </span>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {shown.map((w) => (
              <WeaknessCard key={w.id} weakness={w} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
