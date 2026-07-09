import { Target, Flag } from 'lucide-react';
import { CardContainer } from '@/components/common/CardContainer';

/** Next-goals timeline — an ordered, forward-looking list. */
export function ReportTimeline({ goals }: { goals: string[] }) {
  if (goals.length === 0) return null;
  return (
    <CardContainer className="space-y-3">
      <h3 className="inline-flex items-center gap-2 text-sm font-semibold">
        <Flag className="size-4 text-primary" /> Next Goals
      </h3>
      <ol className="space-y-2.5">
        {goals.map((g, i) => (
          <li key={i} className="flex items-start gap-3">
            <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[10px] font-semibold text-primary">
              {i + 1}
            </span>
            <span className="inline-flex items-center gap-1.5 text-sm">
              <Target className="size-3.5 shrink-0 text-muted-foreground" /> {g}
            </span>
          </li>
        ))}
      </ol>
    </CardContainer>
  );
}
