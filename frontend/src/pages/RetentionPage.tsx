import { Brain } from 'lucide-react';
import { useRetentionOverview, useRetentionProfiles } from '@/hooks/useRetention';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setRetentionEntityFilter, setLevelFilter } from '@/store/slices/retentionSlice';
import { SectionHeader } from '@/components/common/SectionHeader';
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton';
import { ErrorState } from '@/components/common/ErrorState';
import { EmptyState } from '@/components/common/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { RetentionOverviewCard, RetentionCard, RetentionLevelBadge } from '@/components/retention';
import { ENTITY_LABEL } from '@/lib/revision';
import { cn } from '@/lib/utils';
import type { RetentionLevel, RevisionEntityType } from '@/types';

const ENTITY_FILTERS: RevisionEntityType[] = ['topic', 'pattern', 'knowledgeEntry'];
const LEVELS: RetentionLevel[] = ['Mastered', 'Strong', 'Familiar', 'Learning', 'Needs Review', 'At Risk'];

/** Knowledge Retention hub — overview aggregates + every tracked entity's profile. */
export function RetentionPage() {
  const dispatch = useAppDispatch();
  const { entityFilter, levelFilter } = useAppSelector((s) => s.retention);
  const overviewQuery = useRetentionOverview();
  const profilesQuery = useRetentionProfiles(entityFilter);

  const profiles = (profilesQuery.data ?? []).filter((p) => !levelFilter || p.currentLevel === levelFilter);

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Retention Engine"
        title="Knowledge Retention"
        description="Confidence, retention and decay across everything you've learned — synced from your revisions."
        icon={<Brain className="size-5" />}
      />

      {overviewQuery.isError ? (
        <ErrorState error={overviewQuery.error} onRetry={overviewQuery.refetch} />
      ) : overviewQuery.isLoading || !overviewQuery.data ? (
        <RetentionSkeleton />
      ) : (
        <>
          <RetentionOverviewCard overview={overviewQuery.data} />

          {overviewQuery.data.totalProfiles > 0 && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <FilterChip label="All types" active={!entityFilter} onClick={() => dispatch(setRetentionEntityFilter(null))} />
                {ENTITY_FILTERS.map((t) => (
                  <FilterChip
                    key={t}
                    label={ENTITY_LABEL[t]}
                    active={entityFilter === t}
                    onClick={() => dispatch(setRetentionEntityFilter(entityFilter === t ? null : t))}
                  />
                ))}
                <span className="mx-1 h-4 w-px bg-border" />
                {LEVELS.map((lvl) => (
                  <button key={lvl} type="button" onClick={() => dispatch(setLevelFilter(lvl))} className="focus:outline-none">
                    <span className={cn('transition-opacity', levelFilter && levelFilter !== lvl && 'opacity-40')}>
                      <RetentionLevelBadge level={lvl} />
                    </span>
                  </button>
                ))}
              </div>

              {profilesQuery.isLoading ? (
                <LoadingSkeleton count={4} layout="grid" />
              ) : profiles.length === 0 ? (
                <EmptyState
                  icon={<Brain className="size-6" />}
                  title="No matching entities"
                  description="Try a different filter, or complete a revision to start tracking retention."
                />
              ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {profiles.map((p) => (
                    <RetentionCard key={p.id} profile={p} />
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="focus:outline-none">
      <Badge variant={active ? 'primary' : 'outline'} className="cursor-pointer">
        {label}
      </Badge>
    </button>
  );
}

function RetentionSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-80 w-full rounded-lg" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-64 w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}
