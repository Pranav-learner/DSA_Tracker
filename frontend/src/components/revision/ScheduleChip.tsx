import { BookOpen, Hash, NotebookPen, type LucideIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ENTITY_LABEL } from '@/lib/revision';
import type { RevisionEntityType } from '@/types';

const ICON: Record<RevisionEntityType, LucideIcon> = {
  topic: BookOpen,
  pattern: Hash,
  knowledgeEntry: NotebookPen,
};

/** Compact chip showing what a schedule points at (topic / pattern / notebook). */
export function ScheduleChip({ entityType, className }: { entityType: RevisionEntityType; className?: string }) {
  const Ico = ICON[entityType];
  return (
    <Badge variant="outline" className={className}>
      <Ico className="size-3" /> {ENTITY_LABEL[entityType]}
    </Badge>
  );
}
