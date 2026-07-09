import { motion } from 'framer-motion';
import { masteryColor, masteryTextClass } from '@/lib/mastery';
import { cn } from '@/lib/utils';

interface MasteryRingProps {
  /** 0–100 mastery value. */
  value: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  className?: string;
}

/** Circular mastery indicator with an animated arc. Reused across the app. */
export function MasteryRing({
  value,
  size = 96,
  strokeWidth = 8,
  label = 'Mastery',
  className,
}: MasteryRingProps) {
  const clamped = Math.max(0, Math.min(100, value));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

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
          stroke={masteryColor(clamped)}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn('text-xl font-semibold tabular-nums', masteryTextClass(clamped))}>
          {Math.round(clamped)}%
        </span>
        {label && <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>}
      </div>
    </div>
  );
}
