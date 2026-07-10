import { useMemo } from 'react';
import { Award } from 'lucide-react';
import { useBadges } from '@/hooks/useGamification';
import { BadgeGrid } from '@/components/gamification';
import { SectionHeader } from '@/components/common/SectionHeader';
import { DashboardSection } from '@/components/dashboard';
import { ErrorState } from '@/components/common/ErrorState';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Badges page — the learner's badge collection, grouped by category. Badges are
 * server-owned; this page is pure presentation over the /badges payload.
 */
export function BadgesPage() {
  const { data, isLoading, isError, error, refetch } = useBadges();

  const byCategory = useMemo(() => {
    const map = new Map<string, typeof data>();
    for (const b of data ?? []) {
      const list = map.get(b.category) ?? [];
      list.push(b);
      map.set(b.category, list);
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [data]);

  if (isLoading) return <BadgesSkeleton />;
  if (isError || !data) return <ErrorState error={error} onRetry={refetch} />;

  return (
    <div className="space-y-8">
      <SectionHeader
        eyebrow="Module 6 · Gamification"
        title="Badges"
        description="Collectibles you earn for reaching key milestones."
        icon={<Award className="size-5" />}
        action={
          <span className="rounded-full bg-accent px-3 py-1 text-sm font-medium tabular-nums">{data.length} earned</span>
        }
      />

      {data.length === 0 ? (
        <BadgeGrid badges={[]} />
      ) : (
        byCategory.map(([category, badges]) => (
          <DashboardSection key={category} title={category}>
            <BadgeGrid badges={badges ?? []} />
          </DashboardSection>
        ))
      )}
    </div>
  );
}

function BadgesSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-16 w-full max-w-md rounded-lg" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-36 w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}
