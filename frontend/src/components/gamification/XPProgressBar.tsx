import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface XPProgressBarProps {
  /** XP earned within the current level. */
  value: number;
  /** XP span of the current level. */
  max: number;
  /** Show the "x / y XP" caption above the bar. */
  showLabel?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const HEIGHT: Record<NonNullable<XPProgressBarProps['size']>, string> = {
  sm: 'h-1.5',
  md: 'h-2.5',
  lg: 'h-3.5',
};

/**
 * Animated XP progress bar — fills to the learner's progress through the current
 * level. The width springs on mount and whenever progress changes, giving the
 * "meaningful progress animation" the design system calls for.
 */
export function XPProgressBar({ value, max, showLabel, className, size = 'md' }: XPProgressBarProps) {
  const pct = max <= 0 ? 100 : Math.min(100, Math.round((value / max) * 100));

  return (
    <div className={cn('space-y-1.5', className)}>
      {showLabel && (
        <div className="flex items-center justify-between text-xs tabular-nums text-muted-foreground">
          <span>
            {value.toLocaleString()} / {max.toLocaleString()} XP
          </span>
          <span>{pct}%</span>
        </div>
      )}
      <div className={cn('overflow-hidden rounded-full bg-muted', HEIGHT[size])}>
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-primary/80 to-primary"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ type: 'spring', stiffness: 120, damping: 20 }}
        />
      </div>
    </div>
  );
}
