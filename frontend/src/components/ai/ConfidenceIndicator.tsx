import { cn } from '@/lib/utils';

interface ConfidenceIndicatorProps {
  /** 0–100. */
  value: number;
  className?: string;
  showLabel?: boolean;
}

/**
 * ConfidenceIndicator — a compact meter for a coach response's confidence (how
 * well-populated the coach's context was). Colour shifts with the level so the
 * learner can gauge how much to trust the structured guidance at a glance.
 */
export function ConfidenceIndicator({ value, className, showLabel = true }: ConfidenceIndicatorProps) {
  const v = Math.max(0, Math.min(100, Math.round(value)));
  const tone = v >= 75 ? 'success' : v >= 50 ? 'warning' : 'danger';
  const label = v >= 75 ? 'High' : v >= 50 ? 'Moderate' : 'Low';
  const bar = tone === 'success' ? 'bg-success' : tone === 'warning' ? 'bg-warning' : 'bg-danger';
  const text = tone === 'success' ? 'text-success' : tone === 'warning' ? 'text-warning' : 'text-danger';

  return (
    <div className={cn('flex items-center gap-2', className)} title={`Confidence ${v}/100`}>
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
        <div className={cn('h-full rounded-full transition-all', bar)} style={{ width: `${v}%` }} />
      </div>
      {showLabel && (
        <span className={cn('text-[11px] font-medium tabular-nums', text)}>
          {label} · {v}%
        </span>
      )}
    </div>
  );
}
