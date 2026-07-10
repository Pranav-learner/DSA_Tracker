import { Trophy, Sparkles, PartyPopper, Award, Target, BarChart3, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useGamificationProfile } from '@/hooks/useGamification';
import { GamificationOverview, CelebrationFeed } from '@/components/gamification';
import { SectionHeader } from '@/components/common/SectionHeader';
import { DashboardSection } from '@/components/dashboard';
import { ErrorState } from '@/components/common/ErrorState';
import { Skeleton } from '@/components/ui/skeleton';

const QUICK_LINKS = [
  { to: '/achievements', label: 'Achievements', icon: Trophy },
  { to: '/badges', label: 'Badges', icon: Award },
  { to: '/challenges', label: 'Challenges', icon: Target },
  { to: '/progression', label: 'XP & Streaks', icon: BarChart3 },
  { to: '/profile', label: 'Profile', icon: Sparkles },
  { to: '/celebrations', label: 'Celebrations', icon: PartyPopper },
];

/**
 * Gamification Dashboard — the hub for the whole engine: the progression
 * overview, active challenges, next milestone, latest unlock and recent
 * celebrations, plus quick links into each dedicated page. Everything is
 * composed from the single /profile payload.
 */
export function GamificationDashboard() {
  const { data: profile, isLoading, isError, error, refetch } = useGamificationProfile();

  if (isLoading) return <GamificationSkeleton />;
  if (isError || !profile) return <ErrorState error={error} onRetry={refetch} />;

  return (
    <div className="space-y-8">
      <SectionHeader
        eyebrow="Module 6 · Gamification"
        title="Gamification"
        description="Earn XP, unlock achievements and badges, and take on daily, weekly and monthly challenges."
        icon={<Trophy className="size-5" />}
      />

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {QUICK_LINKS.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className="group flex flex-col items-center gap-2 rounded-lg border border-border bg-card/60 p-4 text-center transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-glow"
          >
            <Icon className="size-5 text-primary" />
            <span className="text-xs font-medium">{label}</span>
          </Link>
        ))}
      </div>

      <GamificationOverview profile={profile} />

      <DashboardSection
        title="Recent Celebrations"
        icon={<PartyPopper className="size-4" />}
        action={
          <Link to="/celebrations" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
            View all <ArrowRight className="size-3" />
          </Link>
        }
      >
        <CelebrationFeed celebrations={profile.celebrations.recent} />
      </DashboardSection>
    </div>
  );
}

function GamificationSkeleton() {
  return (
    <div className="space-y-8">
      <Skeleton className="h-16 w-full max-w-md rounded-lg" />
      <Skeleton className="h-16 w-full rounded-lg" />
      <Skeleton className="h-32 w-full rounded-lg" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-lg" />
        ))}
      </div>
      <Skeleton className="h-48 w-full rounded-lg" />
    </div>
  );
}
