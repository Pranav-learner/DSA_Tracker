import { CardContainer } from '@/components/common/CardContainer';
import { relativeTime, cn } from '@/lib/utils';
import type { Badge } from '@/types';

interface BadgeCardProps {
  badge: Badge;
  className?: string;
}

/**
 * BadgeCard — a single earned badge: its emoji medal, title, category and when
 * it was earned. Badges only exist once unlocked, so there is no locked variant.
 */
export function BadgeCard({ badge, className }: BadgeCardProps) {
  return (
    <CardContainer className={cn('flex flex-col items-center gap-2 p-4 text-center', className)}>
      <div className="flex size-14 items-center justify-center rounded-full bg-accent text-3xl shadow-glow">
        {badge.icon}
      </div>
      <div>
        <p className="text-sm font-semibold">{badge.title}</p>
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{badge.category}</p>
      </div>
      <p className="text-xs text-muted-foreground">{relativeTime(badge.unlockedAt)}</p>
    </CardContainer>
  );
}
