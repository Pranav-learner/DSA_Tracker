import { Link } from 'react-router-dom';
import { Swords, TrendingUp, Trophy, ArrowRight, Plus, ListTodo, Gauge } from 'lucide-react';
import { CardContainer } from '@/components/common/CardContainer';
import { Button } from '@/components/ui/button';
import { PlatformBadge } from './PlatformBadge';
import { RatingDelta } from './RatingDelta';
import { formatContestDate } from '@/lib/contest';
import { READINESS_STATUS_META } from '@/lib/competitive';
import { ANALYTICS_TONE_TEXT } from '@/lib/analytics';
import { scoreColor } from '@/lib/retention';
import { cn } from '@/lib/utils';
import type { DashboardContest, ReadinessStatus } from '@/types';

/** Derive readiness status from a 0–100 score (mirrors backend thresholds). */
function readinessStatus(score: number): ReadinessStatus {
  if (score >= 80) return 'ready';
  if (score >= 60) return 'developing';
  if (score >= 40) return 'early';
  return 'not-ready';
}

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
          <p className="inline-flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span>{formatContestDate(contest.latestContest.startTime)}</span>
            {contest.latestContest.rank !== null && (
              <span className="inline-flex items-center gap-1">
                <Trophy className="size-3" /> Rank {contest.latestContest.rank}
              </span>
            )}
            {contest.latestPerformance && (
              <span className="text-success">{contest.latestPerformance.totalSolved} solved · {contest.latestPerformance.penalty} pen</span>
            )}
          </p>
          {contest.latestPerformance && (
            <Link to={`/contests/${contest.latestContest.id}/workspace`} className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
              Resume analysis <ArrowRight className="size-3" />
            </Link>
          )}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No contests logged yet.</p>
      )}

      {contest.contestReadiness !== null && (
        <Link to="/contests/intelligence" className="block space-y-1.5 rounded-lg border border-border/60 bg-card/40 px-3 py-2 transition-colors hover:border-primary/40">
          <div className="flex items-center justify-between gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5 text-muted-foreground"><Gauge className="size-3.5" /> Contest readiness</span>
            <span className={cn('font-semibold tabular-nums', ANALYTICS_TONE_TEXT[READINESS_STATUS_META[readinessStatus(contest.contestReadiness)].tone])}>
              {contest.contestReadiness}% · {READINESS_STATUS_META[readinessStatus(contest.contestReadiness)].label}
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full transition-all" style={{ width: `${contest.contestReadiness}%`, background: scoreColor(contest.contestReadiness) }} />
          </div>
        </Link>
      )}

      {contest.pendingUpsolve > 0 && (
        <Link to="/upsolve" className="flex items-center justify-between gap-2 rounded-lg border border-warning/40 bg-warning/[0.06] px-3 py-2 text-sm text-warning transition-colors hover:bg-warning/[0.1]">
          <span className="inline-flex items-center gap-2"><ListTodo className="size-4" /> {contest.pendingUpsolve} upsolve pending</span>
          <ArrowRight className="size-3.5" />
        </Link>
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
