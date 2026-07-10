import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { RARITY_META } from '@/lib/gamification';
import { cn } from '@/lib/utils';
import type { Celebration, AchievementRarity } from '@/types';

interface CelebrationModalProps {
  celebration: Celebration;
  onClose: () => void;
}

const TYPE_LABEL: Record<Celebration['type'], string> = {
  'level-up': 'Level Up!',
  'achievement-unlocked': 'Achievement Unlocked',
  'badge-earned': 'Badge Earned',
  'challenge-completed': 'Challenge Complete',
  'milestone-reached': 'Milestone Reached',
};

/**
 * CelebrationModal — the centred, dismissable celebration for major moments
 * (level-ups, milestones, epic/legendary unlocks). Animation is deliberately
 * restrained: a spring scale-in with a soft rarity-tinted glow — meaningful, not
 * noisy. Respects reduced-motion via Framer's inherited settings.
 */
export function CelebrationModal({ celebration, onClose }: CelebrationModalProps) {
  const rarity = celebration.rarity ? RARITY_META[celebration.rarity as AchievementRarity] : null;

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <motion.div
        className={cn(
          'relative w-full max-w-sm overflow-hidden rounded-2xl border border-border bg-card p-8 text-center shadow-card',
          rarity?.glow,
        )}
        initial={{ scale: 0.85, y: 20, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 220, damping: 20 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Soft ambient glow behind the icon */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-primary/20 to-transparent" />

        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          aria-label="Dismiss"
        >
          <X className="size-4" />
        </button>

        <p className="relative text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
          {TYPE_LABEL[celebration.type]}
        </p>

        <motion.div
          className="relative mx-auto mt-4 flex size-24 items-center justify-center rounded-full bg-accent text-5xl"
          initial={{ scale: 0, rotate: -12 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 12, delay: 0.1 }}
        >
          {celebration.icon}
        </motion.div>

        <h2 className="relative mt-5 text-xl font-bold tracking-tight">{celebration.title}</h2>
        <p className="relative mt-1.5 text-sm text-muted-foreground">{celebration.description}</p>

        {rarity && (
          <span className={cn('relative mt-4 inline-block rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide', rarity.chip)}>
            {rarity.label}
          </span>
        )}

        {celebration.xp > 0 && (
          <div className="relative mt-4 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-sm font-semibold text-primary">
            +{celebration.xp} XP
          </div>
        )}

        <button
          type="button"
          onClick={onClose}
          className="relative mt-6 w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-transform active:scale-[0.98]"
        >
          Awesome
        </button>
      </motion.div>
    </motion.div>
  );
}
