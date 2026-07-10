import { Link } from 'react-router-dom';
import { Trophy, Award, Target, Sparkles, ArrowRight, PartyPopper } from 'lucide-react';
import { ProgressProfileCard } from './ProgressProfileCard';
import { RewardSummaryCard } from './RewardSummaryCard';
import { MilestoneCard } from './MilestoneCard';
import { ChallengeCard } from './ChallengeCard';
import { AchievementCard } from './AchievementCard';
import { CardContainer } from '@/components/common/CardContainer';
import { cn } from '@/lib/utils';
import type { GamificationProfile } from '@/types';

interface GamificationOverviewProps {
  profile: GamificationProfile;
  className?: string;
}

/**
 * GamificationOverview — the reusable composite for the Gamification Dashboard:
 * the profile card, headline stat tiles, active challenges, the next milestone
 * and the latest unlock. Pure composition over the smaller reusable cards; the
 * page/dashboard fetch the profile and pass it in.
 */
export function GamificationOverview({ profile, className }: GamificationOverviewProps) {
  const { achievements, badges, challenges } = profile;
  const nextMilestone = achievements.inProgress[0];
  const latestUnlock = achievements.recent[0];
  const activePreview = challenges.active.slice(0, 3);

  return (
    <div className={cn('space-y-6', className)}>
      <ProgressProfileCard profile={profile} />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <RewardSummaryCard
          label="Achievements"
          value={`${achievements.unlocked}/${achievements.total}`}
          icon={<Trophy className="size-4" />}
          tone="amber"
          hint="unlocked"
        />
        <RewardSummaryCard label="Badges" value={badges.count} icon={<Award className="size-4" />} tone="primary" hint="collected" />
        <RewardSummaryCard
          label="Active Challenges"
          value={challenges.active.length}
          icon={<Target className="size-4" />}
          tone="success"
          hint={`${challenges.completedCount} completed`}
        />
        <RewardSummaryCard
          label="XP Today"
          value={profile.progression.todaysXP}
          icon={<Sparkles className="size-4" />}
          tone="primary"
          hint={`${profile.progression.totalXP.toLocaleString()} total`}
        />
      </div>

      {(nextMilestone || latestUnlock) && (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {nextMilestone && (
            <Section title="Next Milestone" to="/achievements" linkLabel="All achievements">
              <MilestoneCard achievement={nextMilestone} />
            </Section>
          )}
          {latestUnlock && (
            <Section title="Latest Unlock" to="/achievements">
              <AchievementCard achievement={latestUnlock} />
            </Section>
          )}
        </div>
      )}

      <Section title="Active Challenges" to="/challenges" linkLabel="All challenges" icon={<Target className="size-4" />}>
        {activePreview.length > 0 ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {activePreview.map((c) => (
              <ChallengeCard key={c.id} challenge={c} />
            ))}
          </div>
        ) : (
          <CardContainer className="text-sm text-muted-foreground">
            No active challenges — new ones appear each day.
          </CardContainer>
        )}
      </Section>

      {profile.celebrations.recent[0] && (
        <Section title="Recent Celebration" to="/celebrations" icon={<PartyPopper className="size-4" />}>
          <CardContainer className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-lg bg-accent text-2xl">
              {profile.celebrations.recent[0].icon}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{profile.celebrations.recent[0].title}</p>
              <p className="truncate text-xs text-muted-foreground">{profile.celebrations.recent[0].description}</p>
            </div>
          </CardContainer>
        </Section>
      )}
    </div>
  );
}

function Section({
  title,
  to,
  linkLabel,
  icon,
  children,
}: {
  title: string;
  to?: string;
  linkLabel?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          {icon}
          {title}
        </h3>
        {to && (
          <Link to={to} className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
            {linkLabel ?? 'View'} <ArrowRight className="size-3" />
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}
