import { CornerDownRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FollowUpQuestionListProps {
  questions: string[];
  onPick: (question: string) => void;
  className?: string;
}

/**
 * FollowUpQuestionList — the coach's suggested follow-up questions, rendered as
 * one-tap chips that send the question straight back to the same coach. Keeps the
 * coaching conversation flowing without the learner having to phrase the next ask.
 */
export function FollowUpQuestionList({ questions, onPick, className }: FollowUpQuestionListProps) {
  if (!questions.length) return null;
  return (
    <div className={cn('space-y-1.5', className)}>
      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Follow-up</p>
      <div className="flex flex-col gap-1.5">
        {questions.map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => onPick(q)}
            className="group flex items-center gap-2 rounded-lg border border-border bg-card/60 px-2.5 py-1.5 text-left text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
          >
            <CornerDownRight className="size-3.5 shrink-0 text-primary/70" />
            <span className="min-w-0 flex-1">{q}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
