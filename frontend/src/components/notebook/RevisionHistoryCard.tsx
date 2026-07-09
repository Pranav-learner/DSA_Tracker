import { RotateCcw, CalendarClock, Check } from 'lucide-react';
import { CardContainer } from '@/components/common/CardContainer';
import { Button } from '@/components/ui/button';
import { formatDateTime } from '@/lib/attempts';

interface RevisionHistoryCardProps {
  revisionDates: string[];
  lastReviewedAt: string | null;
  onMarkReviewed?: () => void;
  isReviewing?: boolean;
}

/** Revision history — count + timeline of review timestamps + "mark reviewed". */
export function RevisionHistoryCard({
  revisionDates,
  lastReviewedAt,
  onMarkReviewed,
  isReviewing,
}: RevisionHistoryCardProps) {
  const sorted = [...revisionDates].sort((a, b) => (a < b ? 1 : -1));

  return (
    <CardContainer className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-primary">
          <RotateCcw className="size-4" />
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Revision History
          </h3>
        </div>
        <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-medium tabular-nums text-muted-foreground">
          {revisionDates.length} {revisionDates.length === 1 ? 'review' : 'reviews'}
        </span>
      </div>

      {sorted.length === 0 ? (
        <p className="text-sm italic text-muted-foreground">Not reviewed yet.</p>
      ) : (
        <ul className="space-y-1.5">
          {sorted.map((date, i) => (
            <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
              <CalendarClock className="size-3.5 shrink-0" />
              {formatDateTime(date)}
              {date === lastReviewedAt && (
                <span className="text-[10px] font-medium uppercase tracking-wider text-primary">Latest</span>
              )}
            </li>
          ))}
        </ul>
      )}

      {onMarkReviewed && (
        <Button variant="secondary" size="sm" onClick={onMarkReviewed} disabled={isReviewing}>
          <Check className="size-4" /> {isReviewing ? 'Saving…' : 'Mark reviewed'}
        </Button>
      )}
    </CardContainer>
  );
}
