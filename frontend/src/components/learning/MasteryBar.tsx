import { motion } from 'framer-motion';
import { masteryColor, masteryTextClass } from '@/lib/mastery';
import { cn } from '@/lib/utils';

interface MasteryBarProps {
  value: number;
  label?: string;
  showValue?: boolean;
  className?: string;
}

/** Horizontal mastery bar, tone-coloured by value. */
export function MasteryBar({ value, label, showValue = true, className }: MasteryBarProps) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className={cn('w-full', className)}>
      {(label || showValue) && (
        <div className="mb-1 flex items-center justify-between text-xs">
          {label && <span className="text-muted-foreground">{label}</span>}
          {showValue && (
            <span className={cn('font-medium tabular-nums', masteryTextClass(clamped))}>
              {Math.round(clamped)}%
            </span>
          )}
        </div>
      )}
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: masteryColor(clamped) }}
          initial={{ width: 0 }}
          animate={{ width: `${clamped}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}
