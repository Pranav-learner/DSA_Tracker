import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LevelIndicatorProps {
  level: number;
  tier?: string;
  className?: string;
  size?: 'sm' | 'md';
}

/**
 * Compact inline level chip — "Lv 5 · Practitioner". A reusable atom for headers,
 * navbars and cards where the full LevelCard would be too heavy.
 */
export function LevelIndicator({ level, tier, className, size = 'md' }: LevelIndicatorProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 font-medium text-primary',
        size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs',
        className,
      )}
    >
      <Sparkles className={size === 'sm' ? 'size-3' : 'size-3.5'} />
      <span className="tabular-nums">Lv {level}</span>
      {tier && <span className="text-primary/70">· {tier}</span>}
    </span>
  );
}
