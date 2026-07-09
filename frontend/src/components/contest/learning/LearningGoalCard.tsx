import { Link } from 'react-router-dom';
import { Target, CheckCircle2, Circle, ArrowRight } from 'lucide-react';
import { CardContainer } from '@/components/common/CardContainer';
import { cn } from '@/lib/utils';
import type { LearningGoal } from '@/types';

/** Learning goals captured with a postmortem (+ suggested goals). */
export function LearningGoalCard({ goals, suggested = [] }: { goals: LearningGoal[]; suggested?: string[] }) {
  return (
    <CardContainer className="space-y-3">
      <h3 className="inline-flex items-center gap-2 text-sm font-semibold"><Target className="size-4 text-primary" /> Learning Goals</h3>
      {goals.length === 0 && suggested.length === 0 ? (
        <p className="text-sm text-muted-foreground">No goals yet — add them in your reflection.</p>
      ) : (
        <ul className="space-y-2">
          {goals.map((g, i) => (
            <li key={`g${i}`} className="flex items-center justify-between gap-3 text-sm">
              <span className={cn('inline-flex items-center gap-2', g.done && 'text-muted-foreground line-through')}>
                {g.done ? <CheckCircle2 className="size-4 text-success" /> : <Circle className="size-4 text-muted-foreground" />}
                {g.text}
              </span>
              {g.topicId && (
                <Link to={`/topic/${g.topicId}`} className="inline-flex shrink-0 items-center gap-1 text-xs text-primary hover:underline">
                  Open <ArrowRight className="size-3" />
                </Link>
              )}
            </li>
          ))}
          {suggested.map((s, i) => (
            <li key={`s${i}`} className="inline-flex items-center gap-2 text-sm text-muted-foreground">
              <Circle className="size-4 opacity-50" /> {s} <span className="text-[10px] uppercase tracking-wider text-muted-foreground/60">suggested</span>
            </li>
          ))}
        </ul>
      )}
    </CardContainer>
  );
}
