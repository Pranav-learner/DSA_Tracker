import { Link } from 'react-router-dom';
import { CalendarClock, AlarmClock, ArrowRight, Play, Clock, CheckCircle2, History } from 'lucide-react';
import { CardContainer } from '@/components/common/CardContainer';
import { Button } from '@/components/ui/button';
import { ScheduleChip } from './ScheduleChip';
import { reviewCountdown, formatMinutes, revisionEntityLink, revisionWorkspaceLink } from '@/lib/revision';
import { cn } from '@/lib/utils';
import type { DashboardRevision } from '@/types';

/**
 * Dashboard revision widget — Due Today / Overdue counts, estimated time, a
 * today's-queue preview and a quick-start into the Revision hub. Reusable.
 */
export function DueTodayWidget({ revision }: { revision: DashboardRevision }) {
  const nothing = revision.totalScheduled === 0;

  return (
    <CardContainer className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-primary">
          <CalendarClock className="size-4" />
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Revision</h3>
        </div>
        <Button variant="link" size="sm" asChild>
          <Link to="/revision">
            Open hub <ArrowRight className="size-4" />
          </Link>
        </Button>
      </div>

      {/* Active session — quick resume (Sprint 2) */}
      {revision.activeSession && (
        <div className="flex items-center gap-2 rounded-lg border border-primary/40 bg-primary/[0.08] px-3 py-2">
          <Play className="size-4 shrink-0 text-primary" />
          <span className="min-w-0 flex-1 truncate text-sm">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-primary">In progress · </span>
            {revision.activeSession.title}
          </span>
          <Button size="sm" asChild>
            <Link to={revisionWorkspaceLink(revision.activeSession.entityType, revision.activeSession.entityId)}>
              Resume
            </Link>
          </Button>
        </div>
      )}

      {nothing && !revision.activeSession ? (
        <p className="text-sm text-muted-foreground">
          No revisions scheduled yet — complete a topic or document a problem to start your review plan.
        </p>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
            <Stat icon={<CalendarClock className="size-4 text-warning" />} label="Due today" value={revision.dueTodayCount} />
            <Stat icon={<AlarmClock className="size-4 text-danger" />} label="Overdue" value={revision.overdueCount} />
            <Stat icon={<CheckCircle2 className="size-4 text-success" />} label="Done today" value={revision.completedToday} />
            <Stat icon={<Clock className="size-4 text-muted-foreground" />} label="Est." value={formatMinutes(revision.estimatedReviewMinutes)} />
          </div>

          {revision.preview.length > 0 && (
            <ul className="space-y-1.5">
              {revision.preview.map((s) => (
                <li
                  key={s.id}
                  className={cn(
                    'flex items-center gap-3 rounded-lg border border-border bg-card/40 px-3 py-2',
                    s.urgency === 'overdue' && 'border-danger/40',
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{s.title}</p>
                    <div className="mt-0.5 flex items-center gap-2">
                      <ScheduleChip entityType={s.entityType} />
                      <span className={cn('text-[11px]', s.urgency === 'overdue' ? 'text-danger' : 'text-muted-foreground')}>
                        {reviewCountdown(s.daysUntilReview)}
                      </span>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <Link to={revisionEntityLink(s)}>
                      <Play className="size-3.5" /> Review
                    </Link>
                  </Button>
                </li>
              ))}
            </ul>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" asChild>
              <Link to="/revision">
                <Play className="size-4" /> Start revision
              </Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/revision/history">
                <History className="size-4" /> History
              </Link>
            </Button>
          </div>

          {revision.recentSessions.length > 0 && (
            <div className="space-y-1.5 border-t border-border pt-3">
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Recent revisions
              </p>
              {revision.recentSessions.slice(0, 3).map((s) => (
                <div key={s.id} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <CheckCircle2 className="size-3.5 shrink-0 text-success" />
                  <span className="min-w-0 flex-1 truncate">{s.title}</span>
                  <span className="tabular-nums">{formatMinutes(s.durationMinutes)}</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </CardContainer>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      {icon}
      <span className="font-semibold tabular-nums">{value}</span>
      <span className="text-muted-foreground">{label}</span>
    </span>
  );
}
