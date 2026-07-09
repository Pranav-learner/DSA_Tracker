import { Link } from 'react-router-dom';
import { Calendar, Trophy } from 'lucide-react';
import { CardContainer } from '@/components/common/CardContainer';
import { PlatformBadge } from './PlatformBadge';
import { DivisionBadge } from './DivisionBadge';
import { ContestTypeBadge } from './ContestTypeBadge';
import { RatingDelta } from './RatingDelta';
import { formatContestDate } from '@/lib/contest';
import { cn } from '@/lib/utils';
import type { Contest } from '@/types';

/** A contest as a card (used on the dashboard preview + mobile lists). */
export function ContestCard({ contest, className }: { contest: Contest; className?: string }) {
  return (
    <CardContainer className={cn('flex flex-col gap-3', className)} interactive>
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <PlatformBadge platform={contest.platform} />
          <DivisionBadge division={contest.division} />
          <ContestTypeBadge contestType={contest.contestType} />
        </div>
        {contest.isRated && <RatingDelta change={contest.ratingChange} />}
      </div>
      <Link to={`/contests/${contest.id}`} className="font-semibold leading-snug hover:text-primary">
        {contest.contestName}
      </Link>
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <Calendar className="size-3.5" /> {formatContestDate(contest.startTime)}
        </span>
        {contest.rank !== null && (
          <span className="inline-flex items-center gap-1.5">
            <Trophy className="size-3.5" /> Rank {contest.rank}
          </span>
        )}
      </div>
    </CardContainer>
  );
}
