import { Target, CheckCircle2 } from 'lucide-react';
import { CardContainer } from '@/components/common/CardContainer';
import { RETENTION_TONE_TEXT, scoreTone } from '@/lib/retention';
import { cn } from '@/lib/utils';

interface ReviewSuccessCardProps {
  successRate: number;
  reviewCount?: number;
  successfulReviews?: number;
  className?: string;
}

/** Revision success rate as a labelled progress bar. */
export function ReviewSuccessCard({
  successRate,
  reviewCount,
  successfulReviews,
  className,
}: ReviewSuccessCardProps) {
  const rate = Math.max(0, Math.min(100, successRate));
  const tone = scoreTone(rate);

  return (
    <CardContainer className={cn('flex flex-col gap-3', className)}>
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-2 text-sm font-medium">
          <Target className="size-4 text-primary" /> Revision Success Rate
        </span>
        <span className={cn('text-lg font-semibold tabular-nums', RETENTION_TONE_TEXT[tone])}>{rate}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            'h-full rounded-full transition-all',
            tone === 'success' && 'bg-success',
            tone === 'primary' && 'bg-primary',
            tone === 'warning' && 'bg-warning',
            tone === 'danger' && 'bg-danger',
            tone === 'muted' && 'bg-muted-foreground',
          )}
          style={{ width: `${rate}%` }}
        />
      </div>
      {reviewCount !== undefined && (
        <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <CheckCircle2 className="size-3.5 text-success" />
          {successfulReviews ?? Math.round((rate / 100) * reviewCount)} of {reviewCount} reviews successful
        </p>
      )}
    </CardContainer>
  );
}
