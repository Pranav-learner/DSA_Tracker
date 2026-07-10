import { Link } from 'react-router-dom';
import { ArrowRight, Trophy, Target, Award } from 'lucide-react';
import { useGamificationProfile } from '@/hooks/useGamification';
import {
  RewardSummaryCard,
  MilestoneCard,
  AchievementCard,
  ChallengeCard,
  CelebrationFeed,
} from '@/components/gamification';
import { CardContainer } from '@/components/common/CardContainer';
import { EmptyState } from '@/components/common/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Home-dashboard gamification widget — latest achievement / next milestone,
 * active challenges (with quick-resume) and recent celebrations. Self-fetches the
 * gamification profile (kept out of the aggregated /dashboard payload so each
 * module owns its own data) and degrades quietly if unavailable.
 */
export function GamificationDashboardCard() {
  const { data: profile, isLoading, isError } = useGamificationProfile();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-24 w-full rounded-lg" />
      </div>
    );
  }

  if (isError || !profile) {
    return (
      <EmptyState
        icon={<Trophy className="size-5" />}
        title="Gamification unavailable"
        description="Achievements and challenges will appear here as you learn."
      />
    );
  }

  const { achievements, badges, challenges, celebrations } = profile;
  const nextMilestone = achievements.inProgress[0];
  const latestUnlock = achievements.recent[0];
  const activePreview = challenges.active.slice(0, 2);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <RewardSummaryCard label="Achievements" value={`${achievements.unlocked}/${achievements.total}`} icon={<Trophy className="size-4" />} tone="amber" />
        <RewardSummaryCard label="Badges" value={badges.count} icon={<Award className="size-4" />} tone="primary" />
        <RewardSummaryCard label="Challenges" value={challenges.active.length} icon={<Target className="size-4" />} tone="success" />
      </div>

      {nextMilestone ? <MilestoneCard achievement={nextMilestone} /> : latestUnlock ? <AchievementCard achievement={latestUnlock} /> : null}

      {activePreview.length > 0 && (
        <CardContainer className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Active Challenges</h3>
            <Link to="/challenges" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
              View all <ArrowRight className="size-3" />
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {activePreview.map((c) => (
              <ChallengeCard key={c.id} challenge={c} />
            ))}
          </div>
        </CardContainer>
      )}

      {celebrations.recent.length > 0 && (
        <CardContainer className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Recent Celebrations</h3>
            <Link to="/celebrations" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
              View all <ArrowRight className="size-3" />
            </Link>
          </div>
          <CelebrationFeed celebrations={celebrations.recent.slice(0, 3)} />
        </CardContainer>
      )}
    </div>
  );
}
