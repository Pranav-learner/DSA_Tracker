import { CardContainer } from '@/components/common/CardContainer';
import { ProgressRing } from '@/components/analytics/charts';
import { scoreColor } from '@/lib/retention';

/** A single learning-health score ring (reusable across the executive rail). */
export function LearningHealthScore({ label, score, size = 96 }: { label: string; score: number; size?: number }) {
  return (
    <CardContainer className="flex flex-col items-center gap-2 py-4">
      <ProgressRing value={score} label={label} color={scoreColor(score)} size={size} strokeWidth={9} />
    </CardContainer>
  );
}
