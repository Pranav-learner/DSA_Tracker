import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, Play } from 'lucide-react';
import { CardContainer } from '@/components/common/CardContainer';
import { Button } from '@/components/ui/button';
import { PriorityBadge } from './PriorityBadge';
import { ScheduleChip } from './ScheduleChip';
import { reviewCountdown, formatMinutes, revisionEntityLink, priorityMeta } from '@/lib/revision';
import { cn } from '@/lib/utils';
import type { RevisionSchedule } from '@/types';

/** A single revision item — what to revise, when, and a quick "Review" action. */
export function RevisionCard({ schedule, index = 0 }: { schedule: RevisionSchedule; index?: number }) {
  const overdue = schedule.urgency === 'overdue';
  const p = priorityMeta(schedule.priority);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: Math.min(index * 0.03, 0.25) }}
    >
      <CardContainer
        className={cn(
          'flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between',
          overdue && 'border-danger/40 bg-danger/[0.04]',
        )}
      >
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <PriorityBadge urgency={schedule.urgency} />
            <ScheduleChip entityType={schedule.entityType} />
            <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              {p.label} priority
            </span>
          </div>
          <h3 className="truncate font-semibold leading-tight">{schedule.title}</h3>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span className={cn(overdue && 'font-medium text-danger')}>
              {reviewCountdown(schedule.daysUntilReview)}
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock className="size-3.5" /> {formatMinutes(schedule.estimatedMinutes)}
            </span>
          </div>
        </div>

        <Button size="sm" asChild className="shrink-0">
          <Link to={revisionEntityLink(schedule)}>
            <Play className="size-4" /> Review
          </Link>
        </Button>
      </CardContainer>
    </motion.div>
  );
}
