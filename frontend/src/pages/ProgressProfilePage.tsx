import { Sparkles, Trophy, Target, Award, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useGamificationProfile } from '@/hooks/useGamification';
import {
  ProgressProfileCard,
  AchievementCard,
  MilestoneCard,
  BadgeGrid,
  ChallengeList,
} from '@/components/gamification';
import { SectionHeader } from '@/components/common/SectionHeader';
import { DashboardSection } from '@/components/dashboard';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Progress Profile — the learner's gamification identity: level/tier/XP, recent
 * unlocks, next milestones, badge collection and active challenges, all from the
 * single /profile payload. A read-only, at-a-glance summary of everything earned.
 */
export function ProgressProfilePage() {
  const { data: profile, isLoading, isError, error, refetch } = useGamificationProfile();

  if (isLoading) return <ProfileSkeleton />;
  if (isError || !profile) return <ErrorState error={error} onRetry={refetch} />;

  const { achievements, badges, challenges } = profile;

  return (
    <div className="space-y-8">
      <SectionHeader
        eyebrow="Module 6 · Gamification"
        title="Progress Profile"
        description="Your level, achievements, badges and active challenges at a glance."
        icon={<Sparkles className="size-5" />}
      />

      <ProgressProfileCard profile={profile} />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <DashboardSection
          title="Recent Achievements"
          icon={<Trophy className="size-4" />}
          action={
            <Link to="/achievements" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
              All ({achievements.unlocked}/{achievements.total}) <ArrowRight className="size-3" />
            </Link>
          }
        >
          {achievements.recent.length > 0 ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {achievements.recent.map((a) => (
                <AchievementCard key={a.achievementKey} achievement={a} />
              ))}
            </div>
          ) : (
            <EmptyState icon={<Trophy className="size-5" />} title="No achievements yet" description="Keep learning to unlock your first." />
          )}
        </DashboardSection>

        <DashboardSection title="Next Milestones" icon={<Target className="size-4" />}>
          {achievements.inProgress.length > 0 ? (
            <div className="space-y-3">
              {achievements.inProgress.map((a) => (
                <MilestoneCard key={a.achievementKey} achievement={a} />
              ))}
            </div>
          ) : (
            <EmptyState icon={<Target className="size-5" />} title="Nothing in progress" description="Start an activity to make progress toward a milestone." />
          )}
        </DashboardSection>
      </div>

      <DashboardSection
        title="Badge Collection"
        icon={<Award className="size-4" />}
        action={
          <Link to="/badges" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
            All badges <ArrowRight className="size-3" />
          </Link>
        }
      >
        <BadgeGrid badges={badges.recent} />
      </DashboardSection>

      <DashboardSection
        title="Active Challenges"
        icon={<Target className="size-4" />}
        action={
          <Link to="/challenges" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
            All challenges <ArrowRight className="size-3" />
          </Link>
        }
      >
        <ChallengeList challenges={challenges.active} columns={3} />
      </DashboardSection>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="space-y-8">
      <Skeleton className="h-16 w-full max-w-md rounded-lg" />
      <Skeleton className="h-36 w-full rounded-lg" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Skeleton className="h-64 w-full rounded-lg" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    </div>
  );
}
