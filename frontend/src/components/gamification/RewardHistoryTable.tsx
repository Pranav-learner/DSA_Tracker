import { rewardSourceMeta, MODULE_TINT } from '@/lib/gamification';
import { EmptyState } from '@/components/common/EmptyState';
import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Reward } from '@/types';

interface RewardHistoryTableProps {
  rewards: Reward[];
  className?: string;
}

function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/**
 * Reward history table — Activity · Reward · XP · Reason · Timestamp. Scrolls
 * horizontally on small screens (never the page). Rendering only; sorting,
 * filtering and paging are driven by the parent via the gamification UI slice.
 */
export function RewardHistoryTable({ rewards, className }: RewardHistoryTableProps) {
  if (rewards.length === 0) {
    return (
      <EmptyState
        icon={<Sparkles className="size-5" />}
        title="No rewards yet"
        description="Solve problems, complete revisions or finish a contest to start earning XP."
      />
    );
  }

  return (
    <div className={cn('overflow-x-auto', className)}>
      <table className="w-full min-w-[640px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-border text-left text-[10px] uppercase tracking-wider text-muted-foreground">
            <th className="py-2.5 pr-4 font-medium">Activity</th>
            <th className="py-2.5 pr-4 font-medium">Reward</th>
            <th className="py-2.5 pr-4 text-right font-medium">XP</th>
            <th className="py-2.5 pr-4 font-medium">Reason</th>
            <th className="py-2.5 font-medium">Timestamp</th>
          </tr>
        </thead>
        <tbody>
          {rewards.map((reward) => {
            const meta = rewardSourceMeta(reward.rewardSource);
            const Icon = meta.icon;
            return (
              <tr key={reward.id} className="border-b border-border/50 last:border-0 hover:bg-accent/40">
                <td className="py-3 pr-4">
                  <div className="flex items-center gap-2.5">
                    <span className={cn('flex size-7 shrink-0 items-center justify-center rounded-md', MODULE_TINT[meta.module])}>
                      <Icon className="size-3.5" />
                    </span>
                    <span className="truncate font-medium">{reward.title ?? meta.label}</span>
                  </div>
                </td>
                <td className="py-3 pr-4 text-muted-foreground">{meta.label}</td>
                <td className="py-3 pr-4 text-right font-semibold tabular-nums text-primary">+{reward.xpAwarded}</td>
                <td className="py-3 pr-4 text-muted-foreground">{reward.reason}</td>
                <td className="py-3 whitespace-nowrap text-muted-foreground tabular-nums">{formatTimestamp(reward.createdAt)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
