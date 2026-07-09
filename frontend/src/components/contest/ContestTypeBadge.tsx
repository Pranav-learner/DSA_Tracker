import { Badge } from '@/components/ui/badge';
import { CONTEST_TYPE_META } from '@/lib/contest';
import type { ContestType } from '@/types';

/** Contest-type badge (Rated / Unrated / Virtual). */
export function ContestTypeBadge({ contestType, className }: { contestType: ContestType; className?: string }) {
  const meta = CONTEST_TYPE_META[contestType];
  return (
    <Badge variant={meta.badge} className={className}>
      {meta.label}
    </Badge>
  );
}
