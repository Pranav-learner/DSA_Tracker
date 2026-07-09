import { TrendingUp, TrendingDown, Minus, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { CardContainer } from '@/components/common/CardContainer';
import { ANALYTICS_TONE_TEXT } from '@/lib/analytics';
import { ratingTrendTone } from '@/lib/competitive';
import { formatRatingChange } from '@/lib/contest';
import { cn } from '@/lib/utils';
import type { RatingAnalysis } from '@/types';

/** Rating trend headline — current + trend + growth + best/worst swing. */
export function RatingTrendCard({ rating }: { rating: RatingAnalysis }) {
  const tone = ratingTrendTone(rating.ratingTrend);
  const TrendIco = rating.ratingTrend === 'rising' ? TrendingUp : rating.ratingTrend === 'falling' ? TrendingDown : Minus;
  return (
    <CardContainer className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Rating Trend</span>
        <span className={cn('inline-flex items-center gap-1 text-sm font-medium', ANALYTICS_TONE_TEXT[tone])}>
          <TrendIco className="size-4" /> {rating.ratingTrend}
        </span>
      </div>
      <div className="flex items-baseline gap-3">
        <span className="text-3xl font-semibold tabular-nums">{rating.currentRating ?? '—'}</span>
        <span className={cn('text-sm font-medium', ANALYTICS_TONE_TEXT[tone])}>{formatRatingChange(rating.ratingGrowth)} overall</span>
      </div>
      <div className="grid grid-cols-2 gap-3 border-t border-border/60 pt-3 text-sm">
        <span className="inline-flex items-center gap-1.5 text-success"><ArrowUpRight className="size-3.5" /> best {formatRatingChange(rating.largestGain)}</span>
        <span className="inline-flex items-center gap-1.5 text-danger"><ArrowDownRight className="size-3.5" /> worst {formatRatingChange(rating.largestLoss)}</span>
      </div>
    </CardContainer>
  );
}
