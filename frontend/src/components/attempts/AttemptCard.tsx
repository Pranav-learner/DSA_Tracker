import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ChevronDown,
  Clock,
  Lightbulb,
  BookOpen,
  XCircle,
  Trophy,
  Pencil,
  Trash2,
  CalendarClock,
} from 'lucide-react';
import { CardContainer } from '@/components/common/CardContainer';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StatusChip } from './StatusChip';
import { VerdictBadge } from './VerdictBadge';
import { LanguageBadge } from './LanguageBadge';
import { formatDuration, formatDateTime } from '@/lib/attempts';
import { cn } from '@/lib/utils';
import type { Attempt } from '@/types';

interface AttemptCardProps {
  attempt: Attempt;
  onEdit?: (attempt: Attempt) => void;
  onDelete?: (attempt: Attempt) => void;
  index?: number;
}

/** One attempt in the timeline. Collapsed by default; expands to full detail. */
export function AttemptCard({ attempt, onEdit, onDelete, index = 0 }: AttemptCardProps) {
  const [open, setOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: Math.min(index * 0.03, 0.25) }}
    >
      <CardContainer className="p-0">
        {/* Header (click to expand) */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="flex w-full items-center gap-3 p-4 text-left"
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-accent text-sm font-semibold tabular-nums">
            #{attempt.attemptNumber}
          </span>
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
            <StatusChip status={attempt.status} />
            <VerdictBadge verdict={attempt.verdict} />
            <Badge variant={attempt.contestAttempt ? 'primary' : 'outline'}>
              {attempt.contestAttempt ? 'Contest' : 'Practice'}
            </Badge>
            {attempt.upsolved && (
              <Badge variant="success">
                <Trophy className="size-3" /> Upsolved
              </Badge>
            )}
          </div>
          <span className="inline-flex shrink-0 items-center gap-1 text-sm text-muted-foreground tabular-nums">
            <Clock className="size-3.5" /> {formatDuration(attempt.durationMinutes)}
          </span>
          <ChevronDown
            className={cn('size-4 shrink-0 text-muted-foreground transition-transform', open && 'rotate-180')}
          />
        </button>

        {/* Always-visible quick facts */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-border/60 px-4 py-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <XCircle className="size-3.5" /> {attempt.wrongAttempts} wrong
          </span>
          <span className={cn('inline-flex items-center gap-1', attempt.usedHint && 'text-warning')}>
            <Lightbulb className="size-3.5" /> {attempt.usedHint ? 'Hint used' : 'No hint'}
          </span>
          <span className={cn('inline-flex items-center gap-1', attempt.usedEditorial && 'text-warning')}>
            <BookOpen className="size-3.5" /> {attempt.usedEditorial ? 'Editorial used' : 'No editorial'}
          </span>
          <span className="ml-auto inline-flex items-center gap-1">
            <CalendarClock className="size-3.5" /> {formatDateTime(attempt.createdAt)}
          </span>
        </div>

        {/* Expanded detail */}
        {open && (
          <div className="space-y-4 border-t border-border/60 p-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <Detail label="Language">
                <LanguageBadge language={attempt.language} />
              </Detail>
              <Detail label="Duration">{formatDuration(attempt.durationMinutes)}</Detail>
              <Detail label="Wrong attempts">{attempt.wrongAttempts}</Detail>
              <Detail label="Start time">{formatDateTime(attempt.startTime)}</Detail>
              <Detail label="End time">{formatDateTime(attempt.endTime)}</Detail>
              <Detail label="Mode">{attempt.contestAttempt ? 'Contest' : 'Practice'}</Detail>
            </div>

            {attempt.notes && (
              <div>
                <p className="mb-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  Notes
                </p>
                <p className="whitespace-pre-wrap rounded-lg border border-border bg-accent/30 p-3 text-sm">
                  {attempt.notes}
                </p>
              </div>
            )}

            {(onEdit || onDelete) && (
              <div className="flex items-center gap-2">
                {onEdit && (
                  <Button variant="secondary" size="sm" onClick={() => onEdit(attempt)}>
                    <Pencil className="size-4" /> Edit
                  </Button>
                )}
                {onDelete && (
                  <Button variant="ghost" size="sm" onClick={() => onDelete(attempt)}>
                    <Trash2 className="size-4" /> Delete
                  </Button>
                )}
              </div>
            )}
          </div>
        )}
      </CardContainer>
    </motion.div>
  );
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
      <div className="mt-0.5 text-sm font-medium">{children}</div>
    </div>
  );
}
