import { CheckCircle2, CircleDot, Circle, BookOpen, Trophy, type LucideIcon } from 'lucide-react';
import { Badge, type BadgeProps } from '@/components/ui/badge';
import type { ProblemStatus, ProblemLearningStatus } from '@/types';

type AnyStatus = ProblemStatus | ProblemLearningStatus;

/**
 * Status pill for a problem. Handles both the stored 3-state `ProblemStatus`
 * (library) and the derived 5-state `ProblemLearningStatus` (workspace).
 */
const META: Record<AnyStatus, { variant: NonNullable<BadgeProps['variant']>; icon: LucideIcon }> = {
  'Not Started': { variant: 'outline', icon: Circle },
  'In Progress': { variant: 'warning', icon: CircleDot },
  Learning: { variant: 'primary', icon: BookOpen },
  Attempting: { variant: 'warning', icon: CircleDot },
  Solved: { variant: 'success', icon: CheckCircle2 },
  Mastered: { variant: 'success', icon: Trophy },
};

export function ProblemStatusBadge({ status, className }: { status: AnyStatus; className?: string }) {
  const { variant, icon: Ico } = META[status];
  return (
    <Badge variant={variant} className={className}>
      <Ico className="size-3" /> {status}
    </Badge>
  );
}
