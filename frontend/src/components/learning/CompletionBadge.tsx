import { CircleCheck, Trophy, CircleDot, Circle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { statusVariant } from '@/lib/mastery';
import type { TopicProgressStatus } from '@/types';

const ICON = {
  Mastered: Trophy,
  Completed: CircleCheck,
  'In Progress': CircleDot,
  'Not Started': Circle,
} as const;

/** Status badge for a topic's completion state (Mastered/Completed/…). */
export function CompletionBadge({
  status,
  className,
}: {
  status: TopicProgressStatus;
  className?: string;
}) {
  const Ico = ICON[status];
  return (
    <Badge variant={statusVariant(status)} className={className}>
      <Ico /> {status}
    </Badge>
  );
}
