import { CheckCircle2, PlayCircle, XCircle, type LucideIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { attemptStatusVariant } from '@/lib/attempts';
import type { AttemptStatus } from '@/types';

const ICON: Record<AttemptStatus, LucideIcon> = {
  Solved: CheckCircle2,
  Started: PlayCircle,
  Abandoned: XCircle,
};

/** Attempt lifecycle chip (Started / Solved / Abandoned). */
export function StatusChip({ status, className }: { status: AttemptStatus; className?: string }) {
  const Ico = ICON[status];
  return (
    <Badge variant={attemptStatusVariant(status)} className={className}>
      <Ico className="size-3" /> {status}
    </Badge>
  );
}
