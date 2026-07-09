import { CheckCircle2, Circle, Link2 } from 'lucide-react';
import { CardContainer } from '@/components/common/CardContainer';
import { cn } from '@/lib/utils';
import type { LearningImpact, NotebookRefLite, ProblemLearningStatus } from '@/types';

/**
 * IntegrationStatusCard — makes the connected system visible: which parts of the
 * learning chain this problem has already synced (attempts → solved → documented
 * → topic progress → dashboard). Reinforces that everything stays consistent.
 */
export function IntegrationStatusCard({
  status,
  impact,
  notebook,
  attemptCount,
}: {
  status: ProblemLearningStatus;
  impact: LearningImpact;
  notebook: NotebookRefLite | null;
  attemptCount: number;
}) {
  const solved = status === 'Solved' || status === 'Mastered';
  const steps = [
    { label: 'Attempts logged', done: attemptCount > 0 },
    { label: 'Problem solved', done: solved },
    { label: 'Documented in notebook', done: Boolean(notebook) },
    { label: 'Topic progress updated', done: (impact.topicProgress?.mastery ?? 0) > 0 },
    { label: 'Dashboard & recommendation synced', done: solved },
  ];

  return (
    <CardContainer className="space-y-3">
      <div className="flex items-center gap-2 text-primary">
        <Link2 className="size-4" />
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Integration Status
        </h3>
      </div>

      <ul className="space-y-2">
        {steps.map((step) => (
          <li key={step.label} className="flex items-center gap-2 text-sm">
            {step.done ? (
              <CheckCircle2 className="size-4 shrink-0 text-success" />
            ) : (
              <Circle className="size-4 shrink-0 text-muted-foreground/40" />
            )}
            <span className={cn(step.done ? 'text-foreground' : 'text-muted-foreground')}>{step.label}</span>
          </li>
        ))}
      </ul>
    </CardContainer>
  );
}
