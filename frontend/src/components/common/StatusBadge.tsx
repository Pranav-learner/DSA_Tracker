import { Lock, CircleCheck, CircleDot } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface StatusBadgeProps {
  isUnlocked: boolean;
  isCompleted: boolean;
  className?: string;
}

/** Compact locked / in-progress / completed indicator used on every card. */
export function StatusBadge({ isUnlocked, isCompleted, className }: StatusBadgeProps) {
  if (isCompleted) {
    return (
      <Badge variant="success" className={className}>
        <CircleCheck /> Completed
      </Badge>
    );
  }
  if (isUnlocked) {
    return (
      <Badge variant="primary" className={className}>
        <CircleDot /> Available
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className={className}>
      <Lock /> Locked
    </Badge>
  );
}
