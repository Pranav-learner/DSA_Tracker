import { cn } from '@/lib/utils';
import { rewardSourceMeta, MODULE_TINT } from '@/lib/gamification';

interface RewardBadgeProps {
  /** XP granted. */
  xp: number;
  /** Originating activity type (rewardSource) — drives icon + colour. */
  source: string;
  /** Show the source label alongside the XP. */
  showLabel?: boolean;
  className?: string;
}

/**
 * A single reward chip: a source-coloured icon + "+N XP" (optionally the source
 * label). The atomic unit used across the reward feed, history and timeline.
 */
export function RewardBadge({ xp, source, showLabel, className }: RewardBadgeProps) {
  const meta = rewardSourceMeta(source);
  const Icon = meta.icon;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
        MODULE_TINT[meta.module],
        className,
      )}
    >
      <Icon className="size-3.5" />
      {showLabel && <span>{meta.label}</span>}
      <span className="tabular-nums font-semibold">+{xp}</span>
    </span>
  );
}
