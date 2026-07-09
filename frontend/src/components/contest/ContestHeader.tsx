import type { ReactNode } from 'react';
import { ExternalLink, Calendar, Clock } from 'lucide-react';
import { PlatformBadge } from './PlatformBadge';
import { DivisionBadge } from './DivisionBadge';
import { ContestTypeBadge } from './ContestTypeBadge';
import { formatContestDate, formatDuration } from '@/lib/contest';
import type { Contest } from '@/types';

/** Contest detail header — name, badges, date/duration + optional actions. */
export function ContestHeader({ contest, actions }: { contest: Contest; actions?: ReactNode }) {
  return (
    <header className="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <PlatformBadge platform={contest.platform} />
          <DivisionBadge division={contest.division} />
          <ContestTypeBadge contestType={contest.contestType} />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">{contest.contestName}</h1>
        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Calendar className="size-3.5" /> {formatContestDate(contest.startTime)}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock className="size-3.5" /> {formatDuration(contest.durationMinutes)}
          </span>
          {contest.contestUrl && (
            <a href={contest.contestUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-primary hover:underline">
              <ExternalLink className="size-3.5" /> Open on {contest.platform}
            </a>
          )}
        </div>
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </header>
  );
}
