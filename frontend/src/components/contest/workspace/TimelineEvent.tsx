import { EVENT_META, formatOffset } from '@/lib/contestWorkspace';
import { cn } from '@/lib/utils';
import type { ContestTimelineEvent } from '@/types';

/** One event row on the contest timeline (dot · offset · label · detail). */
export function TimelineEvent({ event, last }: { event: ContestTimelineEvent; last?: boolean }) {
  const meta = EVENT_META[event.eventType];
  return (
    <li className="relative flex gap-4 pb-5 last:pb-0">
      {/* Rail + dot */}
      {!last && <span className="absolute left-[5px] top-3 h-full w-px bg-border" aria-hidden />}
      <span className={cn('relative z-10 mt-1.5 size-2.5 shrink-0 rounded-full ring-2 ring-background', meta.dot)} aria-hidden />
      <div className="flex-1">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-medium">{meta.label}</span>
          <span className="shrink-0 font-mono text-xs tabular-nums text-muted-foreground">{formatOffset(event.offsetMinutes)}</span>
        </div>
        {(event.description || event.problemCode) && (
          <p className="text-xs text-muted-foreground">
            {event.problemCode && <span className="font-medium">{event.problemCode}</span>}
            {event.problemCode && event.description && ' · '}
            {event.description}
          </p>
        )}
      </div>
    </li>
  );
}
