import { Award } from 'lucide-react';
import { useStrengths } from '@/hooks/useAnalytics';
import { SectionHeader } from '@/components/common/SectionHeader';
import { ErrorState } from '@/components/common/ErrorState';
import { FilterBar, LoadingAnalytics, EmptyAnalytics, StrengthCard } from '@/components/analytics';

/** Strength Report — reinforcing signals across patterns. */
export function StrengthReport() {
  const { data, isLoading, isError, error, refetch } = useStrengths();

  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="Pattern Intelligence" title="Strength Report" description="What's working — build on these." icon={<Award className="size-5" />} />
      <FilterBar />

      {isError ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : isLoading || !data ? (
        <LoadingAnalytics metrics={0} panels={3} />
      ) : data.length === 0 ? (
        <EmptyAnalytics title="No strengths yet" description="Keep solving and revising — strengths will emerge here." />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {data.map((s) => (
            <StrengthCard key={s.id} strength={s} />
          ))}
        </div>
      )}
    </div>
  );
}
