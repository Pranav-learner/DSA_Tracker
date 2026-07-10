import { ChallengeCard } from './ChallengeCard';
import { EmptyState } from '@/components/common/EmptyState';
import { Target } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Challenge } from '@/types';

interface ChallengeListProps {
  challenges: Challenge[];
  className?: string;
  emptyHint?: string;
  columns?: 1 | 2 | 3;
}

const COLS = { 1: '', 2: 'sm:grid-cols-2', 3: 'sm:grid-cols-2 lg:grid-cols-3' } as const;

/** ChallengeList — a responsive grid of ChallengeCards with an empty state. */
export function ChallengeList({ challenges, className, emptyHint, columns = 2 }: ChallengeListProps) {
  if (challenges.length === 0) {
    return (
      <EmptyState
        icon={<Target className="size-5" />}
        title="No challenges here"
        description={emptyHint ?? 'New challenges appear automatically each day, week and month.'}
      />
    );
  }
  return (
    <div className={cn('grid grid-cols-1 gap-3', COLS[columns], className)}>
      {challenges.map((c) => (
        <ChallengeCard key={c.id} challenge={c} />
      ))}
    </div>
  );
}
