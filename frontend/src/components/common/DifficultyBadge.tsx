import { Badge, type BadgeProps } from '@/components/ui/badge';
import type { Difficulty } from '@/types';

const VARIANT: Record<Difficulty, NonNullable<BadgeProps['variant']>> = {
  Beginner: 'outline',
  Easy: 'success',
  Medium: 'primary',
  Hard: 'warning',
  Expert: 'danger',
};

/** Colour-coded difficulty pill. */
export function DifficultyBadge({ difficulty, className }: { difficulty: Difficulty; className?: string }) {
  return (
    <Badge variant={VARIANT[difficulty]} className={className}>
      {difficulty}
    </Badge>
  );
}
