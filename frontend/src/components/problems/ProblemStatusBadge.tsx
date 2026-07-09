import { CheckCircle2, CircleDot, Circle } from 'lucide-react';
import { Badge, type BadgeProps } from '@/components/ui/badge';
import type { ProblemStatus } from '@/types';

const META: Record<ProblemStatus, { variant: NonNullable<BadgeProps['variant']>; icon: typeof Circle }> = {
  Solved: { variant: 'success', icon: CheckCircle2 },
  'In Progress': { variant: 'warning', icon: CircleDot },
  'Not Started': { variant: 'outline', icon: Circle },
};

/** Problem solve-state pill (Not Started / In Progress / Solved). */
export function ProblemStatusBadge({ status, className }: { status: ProblemStatus; className?: string }) {
  const { variant, icon: Ico } = META[status];
  return (
    <Badge variant={variant} className={className}>
      <Ico className="size-3" /> {status}
    </Badge>
  );
}
