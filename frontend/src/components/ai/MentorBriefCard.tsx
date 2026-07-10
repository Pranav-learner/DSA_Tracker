import { useState } from 'react';
import { Newspaper, Target, Flag, Route, ArrowRight } from 'lucide-react';
import { useMentorBrief } from '@/hooks/useAI';
import { CardContainer } from '@/components/common/CardContainer';
import { Skeleton } from '@/components/ui/skeleton';
import { LearningHealthSummary } from './LearningHealthSummary';
import { ActionButtonGrid } from './ActionButtonGrid';
import { cn } from '@/lib/utils';
import type { BriefKind, WorkflowKey } from '@/types';

interface MentorBriefCardProps {
  className?: string;
  /** Show the brief-kind tabs (daily/weekly/…). */
  withTabs?: boolean;
  /** Start the brief's suggested workflow. */
  onStartWorkflow?: (key: WorkflowKey) => void;
}

const KINDS: { value: BriefKind; label: string }[] = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'revision', label: 'Revision' },
  { value: 'contest', label: 'Contest' },
  { value: 'learning-health', label: 'Health' },
  { value: 'phase-completion', label: 'Phase' },
];

/**
 * MentorBriefCard — the on-demand mentor brief: headline, today's focus, highest-
 * priority task, a health strip, the suggested workflow and quick-start actions,
 * plus per-kind sections. Self-fetches the selected kind; briefs are generated on
 * demand (never pushed).
 */
export function MentorBriefCard({ className, withTabs = true, onStartWorkflow }: MentorBriefCardProps) {
  const [kind, setKind] = useState<BriefKind>('daily');
  const { data: brief, isLoading } = useMentorBrief(kind);

  return (
    <CardContainer className={cn('space-y-4', className)}>
      <div className="flex items-center gap-2.5">
        <span className="flex size-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
          <Newspaper className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold">{brief?.title ?? 'Mentor Brief'}</h3>
          <p className="text-[11px] text-muted-foreground">{brief?.periodLabel ?? 'On-demand digest'}</p>
        </div>
      </div>

      {withTabs && (
        <div className="flex gap-1 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {KINDS.map((k) => (
            <button
              key={k.value}
              type="button"
              onClick={() => setKind(k.value)}
              className={cn(
                'shrink-0 rounded-lg border px-2.5 py-1 text-[11px] font-medium transition-colors',
                kind === k.value ? 'border-primary/40 bg-primary/15 text-primary' : 'border-border bg-card/60 text-muted-foreground hover:text-foreground',
              )}
            >
              {k.label}
            </button>
          ))}
        </div>
      )}

      {isLoading || !brief ? (
        <div className="space-y-2">
          <Skeleton className="h-14 w-full rounded-lg" />
          <Skeleton className="h-16 w-full rounded-lg" />
        </div>
      ) : (
        <>
          <p className="text-sm font-medium">{brief.headline}</p>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <Highlight icon={<Target className="size-3.5" />} label="Today's focus" value={brief.todaysFocus} />
            <Highlight icon={<Flag className="size-3.5" />} label="Highest priority" value={brief.highestPriorityTask ?? 'Nothing urgent'} />
          </div>

          <LearningHealthSummary brief={brief} />

          {brief.suggestedWorkflow && (
            <button
              type="button"
              onClick={() => onStartWorkflow?.(brief.suggestedWorkflow!.key)}
              className="group flex w-full items-center gap-2.5 rounded-lg border border-primary/25 bg-primary/[0.06] p-2.5 text-left transition-colors hover:border-primary/40"
            >
              <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-primary/15 text-primary"><Route className="size-3.5" /></span>
              <span className="min-w-0 flex-1">
                <span className="block text-[10px] font-medium uppercase tracking-wider text-primary">Suggested workflow</span>
                <span className="truncate text-xs font-semibold">{brief.suggestedWorkflow.name}</span>
              </span>
              <ArrowRight className="size-3.5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </button>
          )}

          {brief.quickStart.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Quick start</p>
              <ActionButtonGrid actions={brief.quickStart} />
            </div>
          )}

          {brief.sections.length > 0 && (
            <div className="space-y-1.5 border-t border-border pt-3">
              {brief.sections.map((s) => (
                <div key={s.title} className="text-[11px]">
                  <span className="font-semibold text-foreground">{s.title}: </span>
                  <span className="text-muted-foreground">{s.body}</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </CardContainer>
  );
}

function Highlight({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-background/40 p-2.5">
      <div className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{icon}{label}</div>
      <p className="mt-0.5 text-xs font-medium">{value}</p>
    </div>
  );
}
