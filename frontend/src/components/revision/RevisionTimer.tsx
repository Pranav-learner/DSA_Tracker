import { useEffect } from 'react';
import { Timer } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { tickTimer } from '@/store/slices/revisionSlice';
import { formatClock } from '@/lib/revision';
import { cn } from '@/lib/utils';

/**
 * Session timer — ticks once a second while running (Redux-driven), so elapsed
 * time survives panel re-renders. Pausing stops the tick without losing time.
 */
export function RevisionTimer({ className }: { className?: string }) {
  const dispatch = useAppDispatch();
  const { elapsedSeconds, timerRunning } = useAppSelector((s) => s.revision);

  useEffect(() => {
    if (!timerRunning) return;
    const id = setInterval(() => dispatch(tickTimer()), 1000);
    return () => clearInterval(id);
  }, [timerRunning, dispatch]);

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-mono text-lg font-semibold tabular-nums',
        timerRunning ? 'text-primary' : 'text-muted-foreground',
        className,
      )}
    >
      <Timer className="size-4" /> {formatClock(elapsedSeconds)}
    </span>
  );
}
