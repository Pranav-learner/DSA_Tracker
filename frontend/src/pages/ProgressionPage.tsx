import { Trophy, Flame, ListOrdered, History, ArrowDownUp, RotateCcw } from 'lucide-react';
import { useProgression, useStreaks, useLevels, useRewardHistory } from '@/hooks/useGamification';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  setActivityTypeFilter,
  setSort,
  setPage,
  resetFilters,
} from '@/store/slices/gamificationSlice';
import {
  ProgressionSummary,
  DailyXPCard,
  RewardHistoryTable,
  LevelIndicator,
} from '@/components/gamification';
import { SectionHeader } from '@/components/common/SectionHeader';
import { CardContainer } from '@/components/common/CardContainer';
import { DashboardSection } from '@/components/dashboard';
import { ErrorState } from '@/components/common/ErrorState';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { rewardSources, formatXp, MODULE_TINT } from '@/lib/gamification';
import { cn } from '@/lib/utils';
import type { RewardHistoryQuery } from '@/types';

/**
 * Progression dashboard — the learner's full progression view: level/XP/streak
 * summary, daily activity, the level ladder and a filterable, paginated reward
 * history. Server state comes from React Query; the filters/sort/page live in
 * the gamification Redux UI slice.
 */
export function ProgressionPage() {
  const dispatch = useAppDispatch();
  const ui = useAppSelector((s) => s.gamification);

  const { data: progression, isLoading, isError, error, refetch } = useProgression();
  const { data: streaks } = useStreaks();
  const { data: levels } = useLevels();

  const historyQuery: RewardHistoryQuery = {
    rewardSource: ui.activityTypeFilter ?? undefined,
    sort: ui.sort,
    limit: ui.pageSize,
    offset: ui.page * ui.pageSize,
  };
  const { data: history, isFetching: historyFetching } = useRewardHistory(historyQuery);

  if (isLoading) return <ProgressionSkeleton />;
  if (isError || !progression) return <ErrorState error={error} onRetry={refetch} />;

  const totalPages = history ? Math.max(1, Math.ceil(history.total / ui.pageSize)) : 1;

  return (
    <div className="space-y-8">
      <SectionHeader
        eyebrow="Module 6 · Progression"
        title="Your Progression"
        description="Level up by learning. XP is earned from every solved problem, completed topic, revision, contest and knowledge entry."
        icon={<Trophy className="size-5" />}
        action={<LevelIndicator level={progression.level} tier={progression.tier} />}
      />

      <ProgressionSummary progression={progression} />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Daily activity + level ladder */}
        <div className="space-y-8 lg:col-span-2">
          <DashboardSection title="Daily Activity" icon={<Flame className="size-4" />}>
            {streaks ? (
              <DailyXPCard daily={streaks.daily} />
            ) : (
              <Skeleton className="h-40 w-full rounded-lg" />
            )}
          </DashboardSection>

          <DashboardSection
            title="Reward History"
            icon={<History className="size-4" />}
            action={
              <Button variant="ghost" size="sm" onClick={() => dispatch(resetFilters())}>
                <RotateCcw className="size-3.5" /> Reset
              </Button>
            }
          >
            <CardContainer className="space-y-4">
              <RewardFilters
                active={ui.activityTypeFilter}
                sort={ui.sort}
                onFilter={(v) => dispatch(setActivityTypeFilter(v))}
                onToggleSort={() => dispatch(setSort(ui.sort === 'newest' ? 'oldest' : 'newest'))}
              />
              <RewardHistoryTable rewards={history?.items ?? []} className={cn(historyFetching && 'opacity-60')} />
              {history && history.total > ui.pageSize && (
                <div className="flex items-center justify-between pt-1 text-sm">
                  <span className="text-muted-foreground">
                    Page {ui.page + 1} of {totalPages} · {history.total} rewards
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={ui.page === 0}
                      onClick={() => dispatch(setPage(ui.page - 1))}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!history.hasMore}
                      onClick={() => dispatch(setPage(ui.page + 1))}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContainer>
          </DashboardSection>
        </div>

        {/* Level ladder rail */}
        <aside className="space-y-8">
          <DashboardSection title="Level Ladder" icon={<ListOrdered className="size-4" />}>
            {levels ? <LevelLadder levels={levels} /> : <Skeleton className="h-64 w-full rounded-lg" />}
          </DashboardSection>
        </aside>
      </div>
    </div>
  );
}

/** Reward-source filter chips + sort toggle. */
function RewardFilters({
  active,
  sort,
  onFilter,
  onToggleSort,
}: {
  active: string | null;
  sort: 'newest' | 'oldest';
  onFilter: (value: string) => void;
  onToggleSort: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex flex-wrap gap-1.5">
        {rewardSources().map(({ value, label }) => {
          const isActive = active === value;
          return (
            <button
              key={value}
              type="button"
              onClick={() => onFilter(value)}
              className={cn(
                'rounded-full border px-2.5 py-1 text-xs font-medium transition-colors',
                isActive
                  ? 'border-primary/40 bg-primary/15 text-primary'
                  : 'border-border text-muted-foreground hover:bg-accent/60 hover:text-foreground',
              )}
            >
              {label}
            </button>
          );
        })}
      </div>
      <Button variant="outline" size="sm" className="ml-auto" onClick={onToggleSort}>
        <ArrowDownUp className="size-3.5" />
        {sort === 'newest' ? 'Newest' : 'Oldest'}
      </Button>
    </div>
  );
}

/** A focused window of the level ladder around the learner's current level. */
function LevelLadder({ levels }: { levels: NonNullable<ReturnType<typeof useLevels>['data']> }) {
  const current = levels.currentLevel;
  // Show a window centred on the current level (a few below, several above).
  const start = Math.max(1, current - 2);
  const window = levels.ladder.slice(start - 1, start - 1 + 8);

  return (
    <CardContainer className="space-y-1.5">
      {window.map((row) => {
        const reached = row.level <= current;
        return (
          <div
            key={row.level}
            className={cn(
              'flex items-center gap-3 rounded-md px-2.5 py-2 text-sm',
              row.isCurrent && 'bg-primary/10 ring-1 ring-primary/25',
            )}
          >
            <span
              className={cn(
                'flex size-7 shrink-0 items-center justify-center rounded-md text-xs font-semibold tabular-nums',
                row.isCurrent ? MODULE_TINT.learning : reached ? 'bg-success/15 text-success' : 'bg-muted text-muted-foreground',
              )}
            >
              {row.level}
            </span>
            <div className="min-w-0 flex-1">
              <p className={cn('truncate font-medium', !reached && 'text-muted-foreground')}>{row.tier}</p>
              <p className="text-[11px] text-muted-foreground tabular-nums">{formatXp(row.totalXpToReach)} total</p>
            </div>
            {row.isCurrent && <span className="text-[10px] font-medium uppercase tracking-wider text-primary">Current</span>}
          </div>
        );
      })}
    </CardContainer>
  );
}

function ProgressionSkeleton() {
  return (
    <div className="space-y-8">
      <Skeleton className="h-16 w-full max-w-md rounded-lg" />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Skeleton className="h-28 w-full rounded-lg lg:col-span-2" />
        <Skeleton className="h-32 w-full rounded-lg" />
        <Skeleton className="h-32 w-full rounded-lg" />
      </div>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <Skeleton className="h-96 w-full rounded-lg lg:col-span-2" />
        <Skeleton className="h-96 w-full rounded-lg" />
      </div>
    </div>
  );
}
