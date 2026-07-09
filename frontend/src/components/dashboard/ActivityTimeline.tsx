import { memo } from 'react';
import { motion } from 'framer-motion';
import {
  Play,
  CheckCircle2,
  Trophy,
  LockOpen,
  TrendingUp,
  Sparkles,
  Flag,
  History,
  Code2,
  PencilLine,
  PartyPopper,
  NotebookPen,
  BookMarked,
  Compass,
  CalendarClock,
  CalendarPlus,
  AlarmClock,
  Pause,
  Timer,
  TrendingDown,
  Gauge,
  ShieldCheck,
  ShieldAlert,
  type LucideIcon,
} from 'lucide-react';
import { EmptyState } from '@/components/common/EmptyState';
import { cn, relativeTime } from '@/lib/utils';
import type { ActivityEvent, ActivityType } from '@/types';

type EventMeta = { icon: LucideIcon; tile: string };

const EVENT_META: Record<ActivityType, EventMeta> = {
  'topic-started': { icon: Play, tile: 'border-primary/40 bg-primary/15 text-primary' },
  'topic-completed': { icon: CheckCircle2, tile: 'border-primary/40 bg-primary/15 text-primary' },
  'topic-mastered': { icon: Trophy, tile: 'border-success/40 bg-success/15 text-success' },
  'topic-unlocked': { icon: LockOpen, tile: 'border-primary/40 bg-primary/15 text-primary' },
  'mastery-updated': { icon: TrendingUp, tile: 'border-warning/40 bg-warning/15 text-warning' },
  'phase-unlocked': { icon: Sparkles, tile: 'border-primary/40 bg-primary/15 text-primary' },
  'phase-completed': { icon: Flag, tile: 'border-success/40 bg-success/15 text-success' },
  'attempt-started': { icon: Code2, tile: 'border-primary/40 bg-primary/15 text-primary' },
  'attempt-updated': { icon: PencilLine, tile: 'border-warning/40 bg-warning/15 text-warning' },
  'problem-solved': { icon: PartyPopper, tile: 'border-success/40 bg-success/15 text-success' },
  'notebook-created': { icon: NotebookPen, tile: 'border-primary/40 bg-primary/15 text-primary' },
  'notebook-updated': { icon: PencilLine, tile: 'border-warning/40 bg-warning/15 text-warning' },
  'problem-documented': { icon: BookMarked, tile: 'border-success/40 bg-success/15 text-success' },
  'recommendation-updated': { icon: Compass, tile: 'border-primary/40 bg-primary/15 text-primary' },
  'revision-scheduled': { icon: CalendarPlus, tile: 'border-primary/40 bg-primary/15 text-primary' },
  'revision-due': { icon: CalendarClock, tile: 'border-warning/40 bg-warning/15 text-warning' },
  'revision-overdue': { icon: AlarmClock, tile: 'border-danger/40 bg-danger/15 text-danger' },
  'revision-started': { icon: Play, tile: 'border-primary/40 bg-primary/15 text-primary' },
  'revision-paused': { icon: Pause, tile: 'border-warning/40 bg-warning/15 text-warning' },
  'revision-resumed': { icon: Play, tile: 'border-primary/40 bg-primary/15 text-primary' },
  'revision-completed': { icon: CheckCircle2, tile: 'border-success/40 bg-success/15 text-success' },
  'revision-notes-updated': { icon: Timer, tile: 'border-warning/40 bg-warning/15 text-warning' },
  'confidence-increased': { icon: TrendingUp, tile: 'border-success/40 bg-success/15 text-success' },
  'confidence-decreased': { icon: TrendingDown, tile: 'border-danger/40 bg-danger/15 text-danger' },
  'retention-updated': { icon: Gauge, tile: 'border-primary/40 bg-primary/15 text-primary' },
  'knowledge-strengthened': { icon: ShieldCheck, tile: 'border-success/40 bg-success/15 text-success' },
  'knowledge-at-risk': { icon: ShieldAlert, tile: 'border-danger/40 bg-danger/15 text-danger' },
};

/**
 * Recent learning events as a vertical timeline (started / completed / unlocked
 * / mastery updated…). Events come from the backend Activity model.
 */
export const ActivityTimeline = memo(function ActivityTimeline({
  activities,
}: {
  activities: ActivityEvent[];
}) {
  if (activities.length === 0) {
    return (
      <EmptyState
        icon={<History className="size-6" />}
        title="No activity yet"
        description="Your recent learning events will appear here as you study."
      />
    );
  }

  return (
    <ol className="relative space-y-4 before:absolute before:left-[15px] before:top-2 before:h-[calc(100%-1.5rem)] before:w-px before:bg-border">
      {activities.map((event, i) => {
        const meta = EVENT_META[event.type] ?? EVENT_META['mastery-updated'];
        const Ico = meta.icon;
        return (
          <motion.li
            key={event.id}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: Math.min(i * 0.04, 0.3) }}
            className="relative flex gap-3"
          >
            <span
              className={cn(
                'z-10 flex size-8 shrink-0 items-center justify-center rounded-full border bg-card',
                meta.tile,
              )}
            >
              <Ico className="size-4" />
            </span>
            <div className="min-w-0 flex-1 pt-0.5">
              <p className="text-sm font-medium leading-tight">{event.title}</p>
              {event.description && (
                <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{event.description}</p>
              )}
              <p className="mt-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                {relativeTime(event.createdAt)}
              </p>
            </div>
          </motion.li>
        );
      })}
    </ol>
  );
});

// Default export enables lazy-loading this non-critical section (code-split).
export default ActivityTimeline;
