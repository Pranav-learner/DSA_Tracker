import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Celebration } from '@/types';

interface AchievementToastProps {
  celebration: Celebration;
  onClose: () => void;
  /** Auto-dismiss delay in ms (0 disables). */
  duration?: number;
}

const TYPE_TINT: Record<Celebration['type'], string> = {
  'level-up': 'border-primary/30',
  'achievement-unlocked': 'border-violet-500/30',
  'badge-earned': 'border-amber-500/30',
  'challenge-completed': 'border-success/30',
  'milestone-reached': 'border-warning/30',
};

/**
 * AchievementToast — the lightweight, self-dismissing notification for minor
 * celebrations (badges, common unlocks, challenge completions). Slides in from
 * the corner; auto-dismisses so it never blocks the flow.
 */
export function AchievementToast({ celebration, onClose, duration = 4500 }: AchievementToastProps) {
  useEffect(() => {
    if (duration <= 0) return;
    const t = setTimeout(onClose, duration);
    return () => clearTimeout(t);
  }, [duration, onClose]);

  return (
    <motion.div
      className={cn(
        'pointer-events-auto flex w-80 items-center gap-3 rounded-xl border bg-card/95 p-3 shadow-card backdrop-blur',
        TYPE_TINT[celebration.type],
      )}
      initial={{ opacity: 0, x: 40, scale: 0.96 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 40, scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 260, damping: 24 }}
      role="status"
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-accent text-2xl">
        {celebration.icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{celebration.title}</p>
        <p className="truncate text-xs text-muted-foreground">{celebration.description}</p>
      </div>
      {celebration.xp > 0 && (
        <span className="shrink-0 text-xs font-semibold tabular-nums text-primary">+{celebration.xp}</span>
      )}
      <button
        type="button"
        onClick={onClose}
        className="shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        aria-label="Dismiss"
      >
        <X className="size-3.5" />
      </button>
    </motion.div>
  );
}
