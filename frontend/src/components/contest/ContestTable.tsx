import { Link } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
import { PlatformBadge } from './PlatformBadge';
import { DivisionBadge } from './DivisionBadge';
import { ContestTypeBadge } from './ContestTypeBadge';
import { RatingDelta } from './RatingDelta';
import { formatContestDate } from '@/lib/contest';
import { cn } from '@/lib/utils';
import type { Contest } from '@/types';

const HEADERS = ['Contest', 'Platform', 'Division', 'Type', 'Date', 'Rank', 'Rating Δ'];

/** The contest library table (responsive; scrolls horizontally on small screens). */
export function ContestTable({ contests }: { contests: Contest[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full min-w-[720px] text-sm">
        <thead>
          <tr className="border-b border-border bg-card/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
            {HEADERS.map((h) => (
              <th key={h} className="px-4 py-2.5 font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border/60">
          {contests.map((c) => (
            <tr key={c.id} className="transition-colors hover:bg-card/40">
              <td className="max-w-[280px] px-4 py-3">
                <Link to={`/contests/${c.id}`} className="truncate font-medium hover:text-primary">
                  {c.contestName}
                </Link>
                {c.contestUrl && (
                  <a href={c.contestUrl} target="_blank" rel="noreferrer" className="ml-2 inline-flex text-muted-foreground hover:text-primary" aria-label="Open on platform">
                    <ExternalLink className="size-3" />
                  </a>
                )}
              </td>
              <td className="px-4 py-3"><PlatformBadge platform={c.platform} /></td>
              <td className="px-4 py-3">{c.division ? <DivisionBadge division={c.division} /> : <span className="text-muted-foreground">—</span>}</td>
              <td className="px-4 py-3"><ContestTypeBadge contestType={c.contestType} /></td>
              <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">{formatContestDate(c.startTime)}</td>
              <td className={cn('px-4 py-3 tabular-nums', !c.rank && 'text-muted-foreground')}>{c.rank ?? '—'}</td>
              <td className="px-4 py-3">{c.isRated ? <RatingDelta change={c.ratingChange} /> : <span className="text-muted-foreground">—</span>}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
