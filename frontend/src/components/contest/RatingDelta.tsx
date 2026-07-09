import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { formatRatingChange, ratingChangeTone, RATING_TONE_CLASS } from '@/lib/contest';
import { cn } from '@/lib/utils';

/** A signed rating delta with a directional arrow. */
export function RatingDelta({ change, className }: { change: number | null; className?: string }) {
  const tone = ratingChangeTone(change);
  const Ico = change === null || change === 0 ? Minus : change > 0 ? TrendingUp : TrendingDown;
  return (
    <span className={cn('inline-flex items-center gap-1 font-semibold tabular-nums', RATING_TONE_CLASS[tone], className)}>
      <Ico className="size-3.5" /> {formatRatingChange(change)}
    </span>
  );
}
