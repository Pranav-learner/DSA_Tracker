import { Clock, Layers, Play, Eye, Sparkles, Check } from 'lucide-react';
import { moduleIcon } from '@/lib/coachIcons';
import { CardContainer } from '@/components/common/CardContainer';
import { cn } from '@/lib/utils';
import type { Workflow } from '@/types';

interface WorkflowCardProps {
  workflow: Workflow;
  /** Open the preview modal. */
  onPreview: () => void;
  /** Save + start the workflow (persists it, learner-driven). */
  onStart: () => void;
  starting?: boolean;
  className?: string;
}

const DIFFICULTY_TONE: Record<string, string> = {
  light: 'bg-success/15 text-success',
  moderate: 'bg-warning/15 text-warning',
  intense: 'bg-danger/15 text-danger',
};

/**
 * WorkflowCard — a generated learning workflow: name, estimate, difficulty, the
 * modules it touches, its expected outcome and a step count. "Preview" opens the
 * full plan; "Start" saves it and lets the learner work the steps. Starting never
 * mutates progress — each step is a deep link the learner follows and confirms.
 */
export function WorkflowCard({ workflow, onPreview, onStart, starting, className }: WorkflowCardProps) {
  const w = workflow;
  return (
    <CardContainer className={cn('flex flex-col gap-3', className)} interactive>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h4 className="truncate text-sm font-semibold">{w.name}</h4>
          <p className="mt-0.5 line-clamp-2 text-[11px] text-muted-foreground">{w.description}</p>
        </div>
        <span className={cn('shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium capitalize', DIFFICULTY_TONE[w.difficulty] ?? 'bg-accent text-muted-foreground')}>
          {w.difficulty}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
        <span className="inline-flex items-center gap-1"><Clock className="size-3" /> ~{w.estimatedMinutes} min</span>
        <span className="inline-flex items-center gap-1"><Layers className="size-3" /> {w.steps.length} steps</span>
        {w.status && (
          <span className="inline-flex items-center gap-1 capitalize text-primary">
            <Check className="size-3" /> {w.status}
          </span>
        )}
      </div>

      {/* Modules involved */}
      <div className="flex flex-wrap gap-1.5">
        {w.modules.map((m) => {
          const Icon = moduleIcon(m);
          return (
            <span key={m} className="inline-flex items-center gap-1 rounded-full border border-border bg-background/40 px-2 py-0.5 text-[10px] capitalize text-muted-foreground">
              <Icon className="size-3" /> {m}
            </span>
          );
        })}
      </div>

      <p className="flex items-start gap-1.5 rounded-lg border border-primary/20 bg-primary/[0.05] p-2 text-[11px] text-muted-foreground">
        <Sparkles className="mt-0.5 size-3 shrink-0 text-primary" />
        <span><span className="font-medium text-foreground">Outcome:</span> {w.expectedOutcome}</span>
      </p>

      <div className="mt-auto flex gap-2">
        <button
          type="button"
          onClick={onStart}
          disabled={starting}
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-transform active:scale-[0.98] disabled:opacity-50"
        >
          <Play className="size-3.5" /> {starting ? 'Starting…' : 'Start'}
        </button>
        <button
          type="button"
          onClick={onPreview}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium transition-colors hover:border-primary/40 hover:text-primary"
        >
          <Eye className="size-3.5" /> Preview
        </button>
      </div>
    </CardContainer>
  );
}
