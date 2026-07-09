import { ShieldAlert, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { RetentionLevel } from '@/types';

/**
 * Risk flag — shown only when an entity is At Risk or Needs Review. Renders
 * nothing for healthy levels, so it can be dropped inline anywhere.
 */
export function RiskBadge({ level, className }: { level: RetentionLevel; className?: string }) {
  if (level === 'At Risk') {
    return (
      <Badge variant="danger" className={className}>
        <ShieldAlert className="size-3" /> At Risk
      </Badge>
    );
  }
  if (level === 'Needs Review') {
    return (
      <Badge variant="warning" className={className}>
        <RefreshCw className="size-3" /> Needs Review
      </Badge>
    );
  }
  return null;
}
