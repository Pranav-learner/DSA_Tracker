import { BadgeCard } from './BadgeCard';
import { EmptyState } from '@/components/common/EmptyState';
import { Award } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Badge } from '@/types';

interface BadgeGridProps {
  badges: Badge[];
  className?: string;
  emptyHint?: string;
}

/**
 * BadgeGrid — a responsive grid of earned badges, with a friendly empty state
 * when the collection is still empty.
 */
export function BadgeGrid({ badges, className, emptyHint }: BadgeGridProps) {
  if (badges.length === 0) {
    return (
      <EmptyState
        icon={<Award className="size-5" />}
        title="No badges yet"
        description={emptyHint ?? 'Unlock achievements and finish challenges to collect badges.'}
      />
    );
  }
  return (
    <div className={cn('grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6', className)}>
      {badges.map((b) => (
        <BadgeCard key={b.id} badge={b} />
      ))}
    </div>
  );
}
