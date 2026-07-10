import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useProgression, useRecentRewards } from '@/hooks/useGamification';
import { ProgressionSummary, RewardHistoryCard } from '@/components/gamification';
import { CardContainer } from '@/components/common/CardContainer';
import { EmptyState } from '@/components/common/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Dashboard progression widget — the learner's level, XP and streak plus recent
 * rewards, fetched straight from the gamification API (kept out of the aggregated
 * /dashboard payload so each module owns its own data). Drops into a
 * DashboardSection on the home screen.
 */
export function ProgressionDashboardCard() {
  const { data: progression, isLoading, isError } = useProgression();
  const { data: rewards } = useRecentRewards(4);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-28 w-full rounded-lg" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Skeleton className="h-32 w-full rounded-lg" />
          <Skeleton className="h-32 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  // Progression is non-critical chrome — degrade quietly rather than erroring.
  if (isError || !progression) {
    return (
      <EmptyState
        icon={<Sparkles className="size-5" />}
        title="Progression unavailable"
        description="Your XP and level will appear here once activity is recorded."
      />
    );
  }

  return (
    <div className="space-y-4">
      <ProgressionSummary progression={progression} />

      <CardContainer className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Recent Rewards</h3>
          <Link to="/progression" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
            View all <ArrowRight className="size-3" />
          </Link>
        </div>
        {rewards && rewards.length > 0 ? (
          <div className="space-y-2">
            {rewards.map((reward) => (
              <RewardHistoryCard key={reward.id} reward={reward} />
            ))}
          </div>
        ) : (
          <p className="py-4 text-center text-sm text-muted-foreground">
            No rewards yet — earn XP by solving problems and completing revisions.
          </p>
        )}
      </CardContainer>
    </div>
  );
}
