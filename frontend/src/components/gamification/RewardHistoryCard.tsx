import { CardContainer } from '@/components/common/CardContainer';
import { rewardSourceMeta, MODULE_TINT } from '@/lib/gamification';
import { relativeTime } from '@/lib/utils';
import { cn } from '@/lib/utils';
import type { Reward } from '@/types';

interface RewardHistoryCardProps {
  reward: Reward;
  className?: string;
}

/**
 * A single reward as a card row — source icon, what earned it, the reason and
 * the XP granted with a relative timestamp. Used in the compact reward feed and
 * as the mobile layout of the reward history.
 */
export function RewardHistoryCard({ reward, className }: RewardHistoryCardProps) {
  const meta = rewardSourceMeta(reward.rewardSource);
  const Icon = meta.icon;

  return (
    <CardContainer className={cn('flex items-center gap-3 p-3', className)}>
      <span className={cn('flex size-9 shrink-0 items-center justify-center rounded-lg', MODULE_TINT[meta.module])}>
        <Icon className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{reward.title ?? meta.label}</p>
        <p className="truncate text-xs text-muted-foreground">
          {meta.label} · {relativeTime(reward.createdAt)}
        </p>
      </div>
      <span className="shrink-0 text-sm font-semibold tabular-nums text-primary">+{reward.xpAwarded}</span>
    </CardContainer>
  );
}
