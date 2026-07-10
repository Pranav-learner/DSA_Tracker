import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface LevelProgressRingProps {
  level: number;
  /** 0–1 progress through the current level. */
  progress: number;
  size?: number;
  strokeWidth?: number;
  /** Small caption under the level number (e.g. the tier name). */
  caption?: string;
  className?: string;
}

/**
 * Circular level indicator — an SVG ring that fills with the learner's progress
 * toward the next level, the level number centred inside. The arc animates on
 * mount/update for a premium, tactile feel.
 */
export function LevelProgressRing({
  level,
  progress,
  size = 96,
  strokeWidth = 8,
  caption,
  className,
}: LevelProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(1, progress));
  const offset = circumference * (1 - clamped);

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={strokeWidth}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ type: 'spring', stiffness: 90, damping: 18 }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Level</span>
        <span className="text-2xl font-bold leading-none tabular-nums">{level}</span>
        {caption && <span className="mt-0.5 text-[10px] text-muted-foreground">{caption}</span>}
      </div>
    </div>
  );
}
