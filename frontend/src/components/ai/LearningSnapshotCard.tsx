import { Link } from 'react-router-dom';
import {
  Layers,
  BookOpen,
  Gauge,
  CalendarClock,
  TrendingDown,
  TrendingUp,
  Flame,
  Swords,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { CardContainer } from '@/components/common/CardContainer';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { LearningSnapshot } from '@/types';

interface LearningSnapshotCardProps {
  snapshot?: LearningSnapshot;
  isLoading?: boolean;
  className?: string;
}

/**
 * LearningSnapshotCard — the auto-updating "Current Learning Snapshot". Renders
 * the learner's live state (phase, topic, mastery, revision backlog, weakest &
 * strongest pattern, streak, contest readiness) plus the current recommendation.
 * Pure presentation — the data comes from GET /ai/workspace and refreshes with it.
 */
export function LearningSnapshotCard({ snapshot, isLoading, className }: LearningSnapshotCardProps) {
  if (isLoading || !snapshot) {
    return (
      <CardContainer className={cn('space-y-3', className)}>
        <Skeleton className="h-5 w-32 rounded" />
        <div className="grid grid-cols-2 gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-lg" />
          ))}
        </div>
      </CardContainer>
    );
  }

  const pct = (n: number) => `${Math.round(n)}%`;

  return (
    <CardContainer className={cn('space-y-4', className)}>
      <header className="flex items-center gap-2">
        <span className="flex size-7 items-center justify-center rounded-lg bg-primary/15 text-primary">
          <Sparkles className="size-4" />
        </span>
        <h3 className="text-sm font-semibold">Learning Snapshot</h3>
        <span className="ml-auto text-[10px] uppercase tracking-wider text-muted-foreground">Live</span>
      </header>

      <div className="grid grid-cols-2 gap-2">
        <Metric icon={<Layers className="size-3.5" />} label="Phase" value={snapshot.currentPhase ?? '—'} />
        <Metric icon={<BookOpen className="size-3.5" />} label="Topic" value={snapshot.currentTopic ?? '—'} />
        <Metric icon={<Gauge className="size-3.5" />} label="Mastery" value={pct(snapshot.mastery)} accent />
        <Metric
          icon={<CalendarClock className="size-3.5" />}
          label="Revision due"
          value={String(snapshot.revisionDue)}
          accent={snapshot.revisionDue > 0}
          tone={snapshot.revisionDue > 0 ? 'warn' : undefined}
        />
        <Metric
          icon={<TrendingDown className="size-3.5" />}
          label="Weakest"
          value={snapshot.weakestPattern ?? '—'}
          tone={snapshot.weakestPattern ? 'warn' : undefined}
        />
        <Metric
          icon={<TrendingUp className="size-3.5" />}
          label="Strongest"
          value={snapshot.strongestPattern ?? '—'}
          tone={snapshot.strongestPattern ? 'good' : undefined}
        />
        <Metric icon={<Flame className="size-3.5" />} label="Streak" value={`${snapshot.currentStreak}d`} />
        <Metric
          icon={<Swords className="size-3.5" />}
          label="Contest ready"
          value={snapshot.contestReadiness !== null ? `${snapshot.contestReadiness}/100` : '—'}
        />
      </div>

      {snapshot.recommendation && (
        <Link
          to={snapshot.recommendation.actionTo}
          className="group flex items-start gap-2 rounded-lg border border-primary/25 bg-primary/[0.06] p-3 transition-colors hover:border-primary/40"
        >
          <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md bg-primary/15 text-primary">
            <ArrowRight className="size-3.5" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-foreground">{snapshot.recommendation.title}</p>
            <p className="line-clamp-2 text-[11px] text-muted-foreground">{snapshot.recommendation.message}</p>
            <span className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-primary">
              {snapshot.recommendation.actionLabel}
              <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
            </span>
          </div>
        </Link>
      )}
    </CardContainer>
  );
}

function Metric({
  icon,
  label,
  value,
  accent,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent?: boolean;
  tone?: 'warn' | 'good';
}) {
  return (
    <div className="rounded-lg border border-border bg-background/40 px-2.5 py-2">
      <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground">
        {icon}
        <span className="truncate">{label}</span>
      </div>
      <p
        className={cn(
          'mt-0.5 truncate text-sm font-semibold tabular-nums',
          accent && 'text-primary',
          tone === 'warn' && 'text-warning',
          tone === 'good' && 'text-success',
        )}
        title={value}
      >
        {value}
      </p>
    </div>
  );
}
