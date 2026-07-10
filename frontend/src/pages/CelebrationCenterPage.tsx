import { useMemo, useState } from 'react';
import { PartyPopper, CheckCheck } from 'lucide-react';
import { useCelebrations, useMarkCelebrationsSeen } from '@/hooks/useGamification';
import { CelebrationFeed } from '@/components/gamification';
import { SectionHeader } from '@/components/common/SectionHeader';
import { ErrorState } from '@/components/common/ErrorState';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { CelebrationType } from '@/types';

const FILTERS: { value: CelebrationType | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'level-up', label: 'Level Ups' },
  { value: 'achievement-unlocked', label: 'Achievements' },
  { value: 'badge-earned', label: 'Badges' },
  { value: 'challenge-completed', label: 'Challenges' },
  { value: 'milestone-reached', label: 'Milestones' },
];

/**
 * Celebration Center — the full history of celebration events with a type filter
 * and a "mark all seen" action. The live toasts/modals are driven separately by
 * the CelebrationProvider; this page is the durable record.
 */
export function CelebrationCenterPage() {
  const [filter, setFilter] = useState<CelebrationType | 'all'>('all');
  const { data, isLoading, isError, error, refetch } = useCelebrations({ limit: 50 });
  const markSeen = useMarkCelebrationsSeen();

  const filtered = useMemo(
    () => (filter === 'all' ? data ?? [] : (data ?? []).filter((c) => c.type === filter)),
    [data, filter],
  );
  const unseen = (data ?? []).filter((c) => !c.seen).length;

  if (isLoading) return <CelebrationsSkeleton />;
  if (isError || !data) return <ErrorState error={error} onRetry={refetch} />;

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Module 6 · Gamification"
        title="Celebration Center"
        description="Every level-up, unlock and completion — your highlight reel."
        icon={<PartyPopper className="size-5" />}
        action={
          unseen > 0 ? (
            <Button variant="outline" size="sm" disabled={markSeen.isPending} onClick={() => markSeen.mutate(undefined)}>
              <CheckCheck className="size-3.5" /> Mark all seen ({unseen})
            </Button>
          ) : undefined
        }
      />

      <div className="flex flex-wrap gap-1.5">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setFilter(f.value)}
            className={cn(
              'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
              filter === f.value ? 'border-primary/40 bg-primary/15 text-primary' : 'border-border text-muted-foreground hover:bg-accent/60 hover:text-foreground',
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <CelebrationFeed celebrations={filtered} />
    </div>
  );
}

function CelebrationsSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-16 w-full max-w-md rounded-lg" />
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}
