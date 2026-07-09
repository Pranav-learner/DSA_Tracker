import { ClipboardList, ListTodo, Target } from 'lucide-react';
import { CardContainer } from '@/components/common/CardContainer';
import { cn } from '@/lib/utils';
import type { ContestLearning } from '@/types';

/** A short summary of the contest's learning state (reflection · upsolve · goals). */
export function ContestLearningSummary({ learning }: { learning: ContestLearning }) {
  const pending = learning.upsolve.filter((t) => t.status === 'Pending' || t.status === 'In Progress').length;
  const goals = learning.postmortem?.learningGoals.length ?? 0;
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <Stat icon={<ClipboardList className="size-4" />} label="Reflection" value={learning.postmortem ? 'Written' : 'Not yet'} tone={learning.postmortem ? 'success' : 'muted'} />
      <Stat icon={<ListTodo className="size-4" />} label="Upsolve pending" value={pending} tone={pending > 0 ? 'warning' : 'success'} />
      <Stat icon={<Target className="size-4" />} label="Learning goals" value={goals || learning.suggestedLearningGoals.length} tone="primary" />
    </div>
  );
}

const TONE = { success: 'text-success', warning: 'text-warning', primary: 'text-primary', muted: 'text-muted-foreground' };

function Stat({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: React.ReactNode; tone: keyof typeof TONE }) {
  return (
    <CardContainer className="flex items-center gap-3">
      <span className={cn('flex size-9 items-center justify-center rounded-lg border border-border bg-accent', TONE[tone])}>{icon}</span>
      <div>
        <p className={cn('text-lg font-semibold tabular-nums', TONE[tone])}>{value}</p>
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      </div>
    </CardContainer>
  );
}
