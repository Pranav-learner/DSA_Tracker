import type { ReactNode } from 'react';
import { EmptyState } from '@/components/common/EmptyState';
import { RevisionCard } from './RevisionCard';
import type { RevisionSchedule } from '@/types';

interface RevisionQueueProps {
  items: RevisionSchedule[];
  emptyTitle?: string;
  emptyDescription?: string;
  emptyIcon?: ReactNode;
}

/** A list of revision items (used for due-today and upcoming sections). */
export function RevisionQueue({ items, emptyTitle = 'Nothing here', emptyDescription, emptyIcon }: RevisionQueueProps) {
  if (items.length === 0) {
    return <EmptyState icon={emptyIcon} title={emptyTitle} description={emptyDescription} />;
  }
  return (
    <div className="space-y-3">
      {items.map((schedule, i) => (
        <RevisionCard key={schedule.id} schedule={schedule} index={i} />
      ))}
    </div>
  );
}
