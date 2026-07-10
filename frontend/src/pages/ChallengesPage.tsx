import { Target, RefreshCw, CheckCircle2 } from 'lucide-react';
import { useChallenges, usePatchChallenge } from '@/hooks/useGamification';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setChallengeTypeFilter } from '@/store/slices/gamificationSlice';
import { ChallengeList } from '@/components/gamification';
import { SectionHeader } from '@/components/common/SectionHeader';
import { DashboardSection } from '@/components/dashboard';
import { ErrorState } from '@/components/common/ErrorState';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { CHALLENGE_TYPE_META } from '@/lib/gamification';
import { cn } from '@/lib/utils';
import type { ChallengeType } from '@/types';

const TYPES: ChallengeType[] = ['Daily', 'Weekly', 'Monthly', 'Phase'];

/**
 * Challenges page — active challenges grouped by cadence (Daily / Weekly /
 * Monthly / Phase) plus a completed section. A cadence filter and a refresh
 * action (re-generates the current period's set) live in the header.
 */
export function ChallengesPage() {
  const dispatch = useAppDispatch();
  const filter = useAppSelector((s) => s.gamification.challengeTypeFilter);
  const { data, isLoading, isError, error, refetch } = useChallenges();
  const patch = usePatchChallenge();

  if (isLoading) return <ChallengesSkeleton />;
  if (isError || !data) return <ErrorState error={error} onRetry={refetch} />;

  const visibleTypes = filter ? [filter] : TYPES;

  return (
    <div className="space-y-8">
      <SectionHeader
        eyebrow="Module 6 · Gamification"
        title="Challenges"
        description="Time-boxed goals that refresh automatically. Complete them for bonus XP and badges."
        icon={<Target className="size-5" />}
        action={
          <Button
            variant="outline"
            size="sm"
            disabled={patch.isPending || data.active.length === 0}
            onClick={() => data.active[0] && patch.mutate({ id: data.active[0].id, action: 'refresh' })}
          >
            <RefreshCw className={cn('size-3.5', patch.isPending && 'animate-spin')} /> Refresh
          </Button>
        }
      />

      {/* Cadence filter */}
      <div className="flex flex-wrap gap-1.5">
        <FilterChip active={filter === null} onClick={() => dispatch(setChallengeTypeFilter(filter))}>
          All
        </FilterChip>
        {TYPES.map((t) => (
          <FilterChip key={t} active={filter === t} onClick={() => dispatch(setChallengeTypeFilter(t))} className={CHALLENGE_TYPE_META[t].tint}>
            {CHALLENGE_TYPE_META[t].label}
          </FilterChip>
        ))}
      </div>

      {visibleTypes.map((type) => {
        const items = data.byType[type] ?? [];
        if (items.length === 0 && filter === null) return null;
        return (
          <DashboardSection key={type} title={`${CHALLENGE_TYPE_META[type].label} Challenges`} icon={<Target className="size-4" />}>
            <ChallengeList challenges={items} columns={3} emptyHint={`No active ${type.toLowerCase()} challenges right now.`} />
          </DashboardSection>
        );
      })}

      {data.completed.length > 0 && (
        <DashboardSection title="Completed" icon={<CheckCircle2 className="size-4" />}>
          <ChallengeList challenges={data.completed} columns={3} />
        </DashboardSection>
      )}
    </div>
  );
}

function FilterChip({ active, onClick, children, className }: { active: boolean; onClick: () => void; children: React.ReactNode; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
        active ? 'border-primary/40 bg-primary/15 text-primary' : 'border-border text-muted-foreground hover:bg-accent/60 hover:text-foreground',
        active && className,
      )}
    >
      {children}
    </button>
  );
}

function ChallengesSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-16 w-full max-w-md rounded-lg" />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-40 w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}
