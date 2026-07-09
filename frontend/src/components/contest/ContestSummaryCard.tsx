import { Link } from 'react-router-dom';
import { Swords, TrendingUp, Trophy, ArrowRight, Plus } from 'lucide-react';
import { CardContainer } from '@/components/common/CardContainer';
import { Button } from '@/components/ui/button';
import { PlatformBadge } from './PlatformBadge';
import { RatingDelta } from './RatingDelta';
import { formatContestDate } from '@/lib/contest';
import { cn } from '@/lib/utils';
import type { DashboardContest } from '@/types';

/** Compact contest summary for the Home dashboard (rating + latest contest). */
export function ContestSummaryCard({ contest, className }: { contest: DashboardContest; className?: string }) {
  return (
    <CardContainer className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-2 text-sm font-semibold">
          <Swords className="size-4 text-primary" /> Contests
        </span>
        <Link to="/contests" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
          Library <ArrowRight className="size-3" />
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <Stat label="Current" value={contest.currentRating ?? '—'} tone="primary" />
        <Stat label="Peak" value={contest.highestRating ?? '—'} tone="success" />
        <Stat label="Contests" value={contest.totalContests} />
      </div>

      {contest.latestContest ? (
        <div className="space-y-1.5 rounded-lg border border-border/60 bg-card/40 p-3">
          <div className="flex items-center justify-between gap-2">
            <PlatformBadge platform={contest.latestContest.platform} />
            {contest.latestContest.isRated && <RatingDelta change={contest.latestContest.ratingChange} />}
          </div>
          <Link to={`/contests/${contest.latestContest.id}`} className="block truncate text-sm font-medium hover:text-primary">
            {contest.latestContest.contestName}
          </Link>
          <p className="inline-flex items-center gap-3 text-xs text-muted-foreground">
            <span>{formatContestDate(contest.latestContest.startTime)}</span>
            {contest.latestContest.rank !== null && (
              <span className="inline-flex items-center gap-1">
                <Trophy className="size-3" /> Rank {contest.latestContest.rank}
              </span>
            )}
          </p>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No contests logged yet.</p>
      )}

      <div className="flex items-center gap-2">
        <Button asChild size="sm" variant="secondary">
          <Link to="/contests/new">
            <Plus className="size-4" /> Add contest
          </Link>
        </Button>
        <Button asChild size="sm" variant="ghost">
          <Link to="/contests/ratings">
            <TrendingUp className="size-4" /> Ratings
          </Link>
        </Button>
      </div>
    </CardContainer>
  );
}

function Stat({ label, value, tone = 'default' }: { label: string; value: React.ReactNode; tone?: 'default' | 'primary' | 'success' }) {
  const toneClass = { default: 'text-foreground', primary: 'text-primary', success: 'text-success' }[tone];
  return (
    <div className="flex flex-col gap-0.5">
      <span className={cn('text-xl font-semibold tabular-nums', toneClass)}>{value}</span>
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
    </div>
  );
}
