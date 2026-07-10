import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ChallengeProgressBarProps {
  value: number;
  max: number;
  /** Tailwind gradient/solid classes for the fill. */
  fillClassName?: string;
  showLabel?: boolean;
  className?: string;
  size?: 'sm' | 'md';
}

const HEIGHT = { sm: 'h-1.5', md: 'h-2.5' } as const;

/**
 * Generic progress bar for challenges (and any bounded progress). Animated fill,
 * optional "x / y" caption. Separate from XPProgressBar so challenge styling can
 * diverge (colour per cadence) without touching the XP bar.
 */
export function ChallengeProgressBar({
  value,
  max,
  fillClassName = 'bg-primary',
  showLabel,
  className,
  size = 'md',
}: ChallengeProgressBarProps) {
  const pct = max <= 0 ? 100 : Math.min(100, Math.round((value / max) * 100));
  return (
    <div className={cn('space-y-1', className)}>
      {showLabel && (
        <div className="flex items-center justify-between text-xs tabular-nums text-muted-foreground">
          <span>
            {value} / {max}
          </span>
          <span>{pct}%</span>
        </div>
      )}
      <div className={cn('overflow-hidden rounded-full bg-muted', HEIGHT[size])}>
        <motion.div
          className={cn('h-full rounded-full', fillClassName)}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ type: 'spring', stiffness: 120, damping: 20 }}
        />
      </div>
    </div>
  );
}
