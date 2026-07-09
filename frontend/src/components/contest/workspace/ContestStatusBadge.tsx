import { CheckCircle2, Circle, MinusCircle, SkipForward } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { PROBLEM_STATUS_META } from '@/lib/contestWorkspace';
import type { ContestProblemStatus } from '@/types';

const ICON = { solved: CheckCircle2, attempted: Circle, skipped: SkipForward, unattempted: MinusCircle } as const;

/** Problem-status badge (solved / attempted / skipped / untouched). */
export function ContestStatusBadge({ status, className }: { status: ContestProblemStatus; className?: string }) {
  const meta = PROBLEM_STATUS_META[status];
  const Ico = ICON[status];
  return (
    <Badge variant={meta.badge} className={className}>
      <Ico className="size-3" /> {meta.label}
    </Badge>
  );
}
