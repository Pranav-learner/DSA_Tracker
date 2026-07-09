import { AttemptCard } from './AttemptCard';
import type { Attempt } from '@/types';

interface AttemptTimelineProps {
  attempts: Attempt[];
  onEdit?: (attempt: Attempt) => void;
  onDelete?: (attempt: Attempt) => void;
}

/** Vertical, newest-first list of attempt cards (the problem's solving journey). */
export function AttemptTimeline({ attempts, onEdit, onDelete }: AttemptTimelineProps) {
  return (
    <div className="space-y-3">
      {attempts.map((attempt, i) => (
        <AttemptCard
          key={attempt.id}
          attempt={attempt}
          onEdit={onEdit}
          onDelete={onDelete}
          index={i}
        />
      ))}
    </div>
  );
}
