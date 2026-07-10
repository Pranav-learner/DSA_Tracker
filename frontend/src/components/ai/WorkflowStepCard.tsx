import { useNavigate } from 'react-router-dom';
import { Clock, ArrowRight } from 'lucide-react';
import { useAppDispatch } from '@/store/hooks';
import { selectCoach } from '@/store/slices/aiSlice';
import { moduleIcon } from '@/lib/coachIcons';
import { cn } from '@/lib/utils';
import type { WorkflowStep } from '@/types';

interface WorkflowStepCardProps {
  step: WorkflowStep;
  className?: string;
}

/**
 * WorkflowStepCard — one suggested step in a workflow. Shows the order, module,
 * estimate and the deep-link action the learner takes. The learner drives each
 * step manually (confirming any change inside the target module) — the workflow
 * never executes on its own.
 */
export function WorkflowStepCard({ step, className }: WorkflowStepCardProps) {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const Icon = moduleIcon(step.module);

  const run = () => {
    if (step.action?.to) navigate(step.action.to);
    else if (step.coachIntent) dispatch(selectCoach(step.coachIntent));
  };

  return (
    <div className={cn('flex items-start gap-3 rounded-lg border border-border bg-background/40 p-3', className)}>
      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[11px] font-semibold text-primary">
        {step.order}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="truncate text-sm font-medium">{step.title}</p>
          {step.optional && <span className="rounded-full bg-accent px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-muted-foreground">optional</span>}
        </div>
        <p className="mt-0.5 text-[11px] text-muted-foreground">{step.description}</p>
        <div className="mt-1.5 flex items-center gap-2 text-[10px] text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Icon className="size-3" /> {step.module}
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock className="size-3" /> ~{step.estimatedMinutes}m
          </span>
        </div>
      </div>
      {(step.action?.to || step.coachIntent) && (
        <button
          type="button"
          onClick={run}
          className="inline-flex shrink-0 items-center gap-1 self-center rounded-md border border-border px-2 py-1 text-[11px] font-medium transition-colors hover:border-primary/40 hover:text-primary"
        >
          {step.action?.label ?? 'Open'} <ArrowRight className="size-3" />
        </button>
      )}
    </div>
  );
}
