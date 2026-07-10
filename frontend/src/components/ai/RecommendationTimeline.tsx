import { Lightbulb } from 'lucide-react';
import { useRecommendations } from '@/hooks/useAI';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setRecommendationFilter, type RecommendationFilter } from '@/store/slices/aiSlice';
import { RecommendationCard } from './RecommendationCard';
import { EmptyState } from '@/components/common/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { RecommendationStatus } from '@/types';

const FILTERS: { value: RecommendationFilter; label: string }[] = [
  { value: 'all', label: 'Active' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'completed', label: 'Completed' },
  { value: 'dismissed', label: 'Dismissed' },
];

/**
 * RecommendationTimeline — the Recommendation Center: a filterable, chronological
 * list of tracked recommendations with an effectiveness roll-up. Filtering by
 * status hits the API; "Active" shows generated/viewed/accepted (dismissed and
 * archived hidden by default).
 */
export function RecommendationTimeline({ className }: { className?: string }) {
  const dispatch = useAppDispatch();
  const filter = useAppSelector((s) => s.ai.recommendationFilter);
  const status = filter === 'all' ? undefined : (filter as RecommendationStatus);
  const { data, isLoading } = useRecommendations(status);

  const recommendations = data?.recommendations ?? [];
  const stats = data?.stats;

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-0.5 rounded-lg border border-border bg-background/40 p-0.5">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => dispatch(setRecommendationFilter(f.value))}
              className={cn(
                'rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors',
                filter === f.value ? 'bg-accent text-foreground' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        {stats && (
          <span className="ml-auto text-[11px] text-muted-foreground">
            {stats.completed} completed · {stats.acceptanceRate}% acceptance
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-lg" />)}
        </div>
      ) : recommendations.length ? (
        <div className="space-y-2">
          {recommendations.map((r) => <RecommendationCard key={r.id} recommendation={r} />)}
        </div>
      ) : (
        <EmptyState
          icon={<Lightbulb className="size-5" />}
          title="No recommendations"
          description={filter === 'all' ? 'Keep learning — the mentor will suggest next steps.' : 'Nothing in this state yet.'}
          className="border-0 bg-transparent py-10"
        />
      )}
    </div>
  );
}
