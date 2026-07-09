import { motion } from 'framer-motion';
import { chartColor } from './chartTheme';
import { cn } from '@/lib/utils';

interface ProgressRingProps {
  value: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  color?: string;
  suffix?: string;
  className?: string;
}

/**
 * ProgressRing — a lightweight full-circle SVG progress ring for a single 0–100
 * metric. Cheaper than a Recharts gauge for dense grids of small indicators.
 */
export function ProgressRing({
  value,
  size = 88,
  strokeWidth = 8,
  label,
  color = chartColor.primary,
  suffix = '%',
  className,
}: ProgressRingProps) {
  const clamped = Math.max(0, Math.min(100, value));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth={strokeWidth} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-semibold tabular-nums">
          {Math.round(clamped)}
          {suffix}
        </span>
        {label && <span className="text-[9px] uppercase tracking-wider text-muted-foreground">{label}</span>}
      </div>
    </div>
  );
}
