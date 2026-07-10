import { CardContainer } from '@/components/common/CardContainer';
import { EmptyState } from '@/components/common/EmptyState';
import { PartyPopper } from 'lucide-react';
import { relativeTime, cn } from '@/lib/utils';
import type { Celebration } from '@/types';

interface CelebrationFeedProps {
  celebrations: Celebration[];
  className?: string;
}

const TYPE_TINT: Record<Celebration['type'], string> = {
  'level-up': 'bg-primary/15 text-primary',
  'achievement-unlocked': 'bg-violet-500/15 text-violet-400',
  'badge-earned': 'bg-amber-500/15 text-amber-400',
  'challenge-completed': 'bg-success/15 text-success',
  'milestone-reached': 'bg-warning/15 text-warning',
};

/**
 * CelebrationFeed — a chronological list of recent celebration events (level-ups,
 * unlocks, completions). Read-only history; the live toasts/modals are handled by
 * the CelebrationProvider.
 */
export function CelebrationFeed({ celebrations, className }: CelebrationFeedProps) {
  if (celebrations.length === 0) {
    return (
      <EmptyState
        icon={<PartyPopper className="size-5" />}
        title="Nothing to celebrate yet"
        description="Level up, unlock achievements or finish challenges to fill this feed."
      />
    );
  }

  return (
    <ul className={cn('space-y-2', className)}>
      {celebrations.map((c) => (
        <li key={c.id}>
          <CardContainer className={cn('flex items-center gap-3 p-3', !c.seen && 'ring-1 ring-primary/20')}>
            <span className={cn('flex size-9 shrink-0 items-center justify-center rounded-lg text-lg', TYPE_TINT[c.type])}>
              {c.icon}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{c.title}</p>
              <p className="truncate text-xs text-muted-foreground">{c.description}</p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-0.5">
              {c.xp > 0 && <span className="text-xs font-semibold tabular-nums text-primary">+{c.xp} XP</span>}
              <span className="text-[10px] text-muted-foreground">{relativeTime(c.createdAt)}</span>
            </div>
          </CardContainer>
        </li>
      ))}
    </ul>
  );
}
