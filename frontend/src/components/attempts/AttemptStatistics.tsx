import { Layers, CheckCircle2, Lightbulb, BookOpen } from 'lucide-react';
import { DashboardMetricCard } from '@/components/dashboard';
import type { AttemptSummary } from '@/types';

/** The numeric stat tiles of the attempt summary (reuses DashboardMetricCard). */
export function AttemptStatistics({ summary }: { summary: AttemptSummary }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <DashboardMetricCard label="Total Attempts" value={summary.totalAttempts} icon={<Layers className="size-4" />} />
      <DashboardMetricCard
        label="Solved"
        value={summary.solvedCount}
        icon={<CheckCircle2 className="size-4" />}
        tone={summary.solved ? 'success' : 'muted'}
        hint={summary.solved ? 'Solved' : 'Unsolved'}
      />
      <DashboardMetricCard label="Hints Used" value={summary.hintUsageCount} icon={<Lightbulb className="size-4" />} />
      <DashboardMetricCard
        label="Editorial Used"
        value={summary.editorialUsageCount}
        icon={<BookOpen className="size-4" />}
      />
    </div>
  );
}
