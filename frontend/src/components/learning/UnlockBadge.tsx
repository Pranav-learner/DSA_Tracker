import { Lock, LockOpen } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

/** Locked / unlocked indicator driven by the per-user unlock engine. */
export function UnlockBadge({ unlocked, className }: { unlocked: boolean; className?: string }) {
  return unlocked ? (
    <Badge variant="primary" className={className}>
      <LockOpen /> Unlocked
    </Badge>
  ) : (
    <Badge variant="outline" className={className}>
      <Lock /> Locked
    </Badge>
  );
}
