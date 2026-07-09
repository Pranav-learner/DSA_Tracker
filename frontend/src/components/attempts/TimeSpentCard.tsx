import { Clock, Timer } from 'lucide-react';
import { CardContainer } from '@/components/common/CardContainer';
import { formatDuration } from '@/lib/attempts';
import type { AttemptSummary } from '@/types';

/** Focused time card — total time invested + average solve time. */
export function TimeSpentCard({ summary }: { summary: AttemptSummary }) {
  return (
    <CardContainer className="grid grid-cols-2 gap-4">
      <Stat
        icon={<Clock className="size-4" />}
        label="Total Time Spent"
        value={formatDuration(summary.totalTimeSpent)}
      />
      <Stat
        icon={<Timer className="size-4" />}
        label="Average Solve Time"
        value={summary.solved ? formatDuration(summary.averageSolveTime) : '—'}
      />
    </CardContainer>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        {icon}
        <span className="text-[10px] font-medium uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-2xl font-semibold tabular-nums leading-none">{value}</p>
    </div>
  );
}
