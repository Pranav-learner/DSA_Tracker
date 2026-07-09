import { Play, CheckCircle2, XCircle, type LucideIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { SESSION_STATUS_META } from '@/lib/revision';
import type { RevisionSessionStatus } from '@/types';

const ICON: Record<RevisionSessionStatus, LucideIcon> = {
  Started: Play,
  Completed: CheckCircle2,
  Abandoned: XCircle,
};

/** Session lifecycle badge (In Progress / Completed / Abandoned). */
export function SessionStatusBadge({ status, className }: { status: RevisionSessionStatus; className?: string }) {
  const meta = SESSION_STATUS_META[status];
  const Ico = ICON[status];
  return (
    <Badge variant={meta.badge} className={className}>
      <Ico className="size-3" /> {meta.label}
    </Badge>
  );
}
