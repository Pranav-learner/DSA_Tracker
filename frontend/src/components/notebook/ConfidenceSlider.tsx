import { motion } from 'framer-motion';
import { masteryColor, masteryTextClass } from '@/lib/mastery';
import { cn } from '@/lib/utils';

interface ConfidenceSliderProps {
  value: number;
  /** When provided, renders an interactive range input (editor mode). */
  onChange?: (value: number) => void;
  readOnly?: boolean;
  label?: string;
  className?: string;
}

/**
 * Confidence control (0–100). Interactive range in the editor; a tone-coloured
 * meter when read-only. Reuses the shared mastery colour scale for consistency.
 */
export function ConfidenceSlider({ value, onChange, readOnly, label = 'Confidence', className }: ConfidenceSliderProps) {
  const clamped = Math.max(0, Math.min(100, value));

  return (
    <div className={cn('w-full', className)}>
      <div className="mb-1.5 flex items-center justify-between text-xs">
        <span className="font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
        <span className={cn('font-semibold tabular-nums', masteryTextClass(clamped))}>{clamped}%</span>
      </div>

      {readOnly || !onChange ? (
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: masteryColor(clamped) }}
            initial={{ width: 0 }}
            animate={{ width: `${clamped}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        </div>
      ) : (
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={clamped}
          onChange={(e) => onChange(Number(e.target.value))}
          aria-label={label}
          className="h-2 w-full cursor-pointer appearance-none rounded-full bg-muted accent-primary"
          style={{
            background: `linear-gradient(to right, ${masteryColor(clamped)} ${clamped}%, hsl(var(--muted)) ${clamped}%)`,
          }}
        />
      )}
    </div>
  );
}
