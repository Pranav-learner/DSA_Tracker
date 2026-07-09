import { Trophy } from 'lucide-react';
import { CardContainer } from '@/components/common/CardContainer';
import { cn } from '@/lib/utils';
import type { Achievement } from '@/types';

/** A single achievement / highlight. */
export function AchievementCard({ achievement, className }: { achievement: Achievement; className?: string }) {
  return (
    <CardContainer className={cn('flex items-start gap-3', className)}>
      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg border border-success/40 bg-success/15 text-success">
        <Trophy className="size-4" />
      </span>
      <div>
        <p className="font-semibold leading-snug">{achievement.title}</p>
        <p className="text-sm text-muted-foreground">{achievement.description}</p>
      </div>
    </CardContainer>
  );
}
