import { Clock } from 'lucide-react';
import { CardContainer } from '@/components/common/CardContainer';
import { EmptyState } from '@/components/common/EmptyState';
import { ScheduleChip } from './ScheduleChip';
import { SessionStatusBadge } from './SessionStatusBadge';
import { formatMinutes } from '@/lib/revision';
import { formatDateTime } from '@/lib/attempts';
import type { RevisionSession } from '@/types';

/** Permanent revision history — date, topic, duration, status, notes. */
export function RevisionHistoryTable({ sessions }: { sessions: RevisionSession[] }) {
  if (sessions.length === 0) {
    return (
      <EmptyState
        title="No revision history yet"
        description="Complete a review from the queue and it will appear here."
      />
    );
  }

  return (
    <CardContainer className="overflow-hidden p-0">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Topic</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Duration</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Notes</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((s) => (
              <tr key={s.id} className="border-b border-border/60 last:border-0">
                <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">{formatDateTime(s.startedAt)}</td>
                <td className="px-4 py-3 font-medium">
                  <span className="line-clamp-1">{s.title}</span>
                </td>
                <td className="px-4 py-3">
                  <ScheduleChip entityType={s.entityType} />
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  <span className="inline-flex items-center gap-1 tabular-nums">
                    <Clock className="size-3.5" /> {formatMinutes(s.durationMinutes)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <SessionStatusBadge status={s.sessionStatus} />
                </td>
                <td className="max-w-xs px-4 py-3 text-muted-foreground">
                  <span className="line-clamp-1">{s.reviewNotes || '—'}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </CardContainer>
  );
}
