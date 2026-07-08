import { cn } from '@/lib/utils';
import type { Progress } from '@/types';

interface ProgressChipProps {
  progress: Progress;
  /** Show the full bar (card footer) or a compact percentage pill. */
  variant?: 'bar' | 'pill';
  className?: string;
}

/**
 * Visualises completion. In Sprint 1 progress is always 0 (placeholder) — the
 * component is already wired to the real shape so nothing changes later.
 */
export function ProgressChip({ progress, variant = 'bar', className }: ProgressChipProps) {
  const percent = Math.min(100, Math.max(0, progress.percent));

  if (variant === 'pill') {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground',
          className,
        )}
      >
        <span className="size-1.5 rounded-full bg-primary" />
        {percent}%
      </span>
    );
  }

  return (
    <div className={cn('w-full', className)}>
      <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {progress.completedTopics}/{progress.totalTopics} topics
        </span>
        <span className="font-medium tabular-nums">{percent}%</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
