import { CardContainer } from '@/components/common/CardContainer';
import { ProgressGauge } from '@/components/analytics/charts';
import { scoreColor } from '@/lib/retention';
import { cn } from '@/lib/utils';

/** A single executive score as a labelled gauge card. */
export function ExecutiveScoreCard({ label, score, size = 150, className }: { label: string; score: number; size?: number; className?: string }) {
  return (
    <CardContainer className={cn('flex flex-col items-center gap-2 py-5', className)}>
      <ProgressGauge value={score} label={label} color={scoreColor(score)} size={size} />
    </CardContainer>
  );
}
