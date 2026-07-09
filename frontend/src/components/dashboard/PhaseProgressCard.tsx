import { CheckCircle2, CircleDashed, Clock } from 'lucide-react';
import { CardContainer } from '@/components/common/CardContainer';
import { MasteryBar } from '@/components/learning/MasteryBar';
import { EmptyState } from '@/components/common/EmptyState';
import { Icon } from '@/components/ui/Icon';
import { formatHours } from '@/lib/utils';
import type { DashboardPhaseProgress } from '@/types';

/**
 * Current-phase progress: completion %, topics done/remaining, estimated time
 * remaining and a progress bar. All figures come from the dashboard payload.
 */
export function PhaseProgressCard({ phase }: { phase: DashboardPhaseProgress | null }) {
  if (!phase) {
    return (
      <EmptyState
        title="No active phase"
        description="Begin a phase from the roadmap to track its progress here."
      />
    );
  }

  const remaining = Math.max(0, phase.topicsTotal - phase.topicsCompleted);

  return (
    <CardContainer className="space-y-4">
      <div className="flex items-center gap-3">
        <span
          className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-border"
          style={{ backgroundColor: `${phase.phase.color}1a`, color: phase.phase.color }}
        >
          <Icon name={phase.phase.icon} className="size-5" />
        </span>
        <div className="min-w-0">
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Phase {phase.phase.order} · Current
          </p>
          <h3 className="truncate font-semibold leading-tight">{phase.phase.title}</h3>
        </div>
        <span className="ml-auto text-2xl font-semibold tabular-nums">{phase.completionPercent}%</span>
      </div>

      <MasteryBar value={phase.completionPercent} label="Completion" />

      <div className="grid grid-cols-3 gap-2">
        <Field icon={<CheckCircle2 className="size-3.5" />} label="Completed" value={String(phase.topicsCompleted)} />
        <Field icon={<CircleDashed className="size-3.5" />} label="Remaining" value={String(remaining)} />
        <Field
          icon={<Clock className="size-3.5" />}
          label="Time left"
          value={`~${formatHours(phase.estimatedTimeRemainingHours)}`}
        />
      </div>
    </CardContainer>
  );
}

function Field({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-accent/30 p-2.5">
      <div className="flex items-center gap-1 text-muted-foreground">{icon}</div>
      <p className="mt-1 truncate text-sm font-semibold tabular-nums">{value}</p>
      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
    </div>
  );
}
