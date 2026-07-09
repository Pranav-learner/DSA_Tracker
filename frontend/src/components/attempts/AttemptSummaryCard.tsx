import { BarChart3, CalendarCheck, CalendarClock } from 'lucide-react';
import { CardContainer } from '@/components/common/CardContainer';
import { Skeleton } from '@/components/ui/skeleton';
import { useProblemAttemptSummary } from '@/hooks/useAttempts';
import { AttemptStatistics } from './AttemptStatistics';
import { TimeSpentCard } from './TimeSpentCard';
import { formatDateTime } from '@/lib/attempts';
import type { AttemptSummary } from '@/types';

/**
 * Attempt Summary — aggregates for a problem (totals, solved, time, hint/
 * editorial usage, first/latest). Self-fetches by default; pass `summary` to
 * render from already-loaded data (e.g. the workspace payload — no extra request).
 */
export function AttemptSummaryCard({ problemId, summary: provided }: { problemId: string; summary?: AttemptSummary }) {
  const { data: fetched, isLoading } = useProblemAttemptSummary(provided ? undefined : problemId);
  const summary = provided ?? fetched;

  if (!provided && isLoading) return <Skeleton className="h-44 w-full rounded-lg" />;
  if (!summary) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <BarChart3 className="size-4 text-primary" />
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Attempt Summary
        </h2>
      </div>

      {summary.totalAttempts === 0 ? (
        <CardContainer className="text-sm text-muted-foreground">
          No attempts logged yet — record your first attempt to start building this problem's history.
        </CardContainer>
      ) : (
        <>
          <AttemptStatistics summary={summary} />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <TimeSpentCard summary={summary} />
            <CardContainer className="grid grid-cols-2 gap-4">
              <DateStat
                icon={<CalendarCheck className="size-4" />}
                label="First Solved"
                value={formatDateTime(summary.firstSolvedAt)}
              />
              <DateStat
                icon={<CalendarClock className="size-4" />}
                label="Latest Attempt"
                value={formatDateTime(summary.latestAttemptAt)}
              />
            </CardContainer>
          </div>
        </>
      )}
    </div>
  );
}

function DateStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        {icon}
        <span className="text-[10px] font-medium uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-sm font-semibold">{value}</p>
    </div>
  );
}
