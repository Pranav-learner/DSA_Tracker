import { motion } from 'framer-motion';
import { CardContainer } from '@/components/common/CardContainer';
import { cn } from '@/lib/utils';
import type { DailyActivity } from '@/types';

interface DailyXPCardProps {
  daily: DailyActivity[];
  title?: string;
  className?: string;
}

/**
 * Daily XP breakdown — a lightweight CSS bar chart of XP earned per day over the
 * recent window (no charting dependency, so it's safe in the eagerly-loaded
 * dashboard). Bars with activity are highlighted; empty days read as gaps.
 */
export function DailyXPCard({ daily, title = 'Daily Activity', className }: DailyXPCardProps) {
  const max = Math.max(1, ...daily.map((d) => d.xp));
  const activeDays = daily.filter((d) => d.active).length;

  return (
    <CardContainer className={cn('space-y-3', className)}>
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{title}</span>
        <span className="text-xs text-muted-foreground">
          {activeDays}/{daily.length} days active
        </span>
      </div>
      <div className="flex h-24 items-end gap-1">
        {daily.map((d) => {
          const heightPct = d.xp > 0 ? Math.max(8, Math.round((d.xp / max) * 100)) : 3;
          return (
            <div key={d.date} className="group relative flex flex-1 flex-col items-center justify-end">
              <motion.div
                className={cn(
                  'w-full rounded-t',
                  d.active ? 'bg-gradient-to-t from-primary/60 to-primary' : 'bg-muted',
                )}
                initial={{ height: 0 }}
                animate={{ height: `${heightPct}%` }}
                transition={{ type: 'spring', stiffness: 120, damping: 20 }}
              />
              <span className="pointer-events-none absolute -top-6 z-10 hidden whitespace-nowrap rounded bg-card px-1.5 py-0.5 text-[10px] tabular-nums shadow-card group-hover:block">
                {d.xp} XP
              </span>
            </div>
          );
        })}
      </div>
      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>{formatDay(daily[0]?.date)}</span>
        <span>Today</span>
      </div>
    </CardContainer>
  );
}

function formatDay(iso?: string): string {
  if (!iso) return '';
  const d = new Date(`${iso}T00:00:00Z`);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', timeZone: 'UTC' });
}
