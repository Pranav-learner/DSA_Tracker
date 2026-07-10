import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Compact provider-latency badge (ms under 1s, otherwise seconds). */
export function ResponseTimeBadge({ ms, className }: { ms: number; className?: string }) {
  if (!ms) return null;
  const label = ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`;
  return (
    <span className={cn('inline-flex items-center gap-1 text-[10px] tabular-nums text-muted-foreground', className)} title="Response time">
      <Clock className="size-3" />
      {label}
    </span>
  );
}
