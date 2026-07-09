import { useMemo, type ReactNode } from 'react';
import { CardContainer } from '@/components/common/CardContainer';
import { EmptyChartState } from './EmptyChartState';
import { cn } from '@/lib/utils';
import type { TimePoint } from '@/types';

interface ContributionHeatmapProps {
  title?: string;
  icon?: ReactNode;
  action?: ReactNode;
  data: TimePoint[];
  /** Number of trailing weeks to render (columns). */
  weeks?: number;
  loading?: boolean;
  className?: string;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WEEKDAYS = ['', 'Mon', '', 'Wed', '', 'Fri', ''];

function toKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function addDays(d: Date, n: number): Date {
  const c = new Date(d);
  c.setDate(c.getDate() + n);
  return c;
}

interface Cell {
  key: string;
  count: number;
  level: number;
  date: Date;
}

/**
 * ContributionHeatmap — a GitHub-style calendar of daily learning activity.
 * Intensity scales to the busiest day in range; hover shows the exact count.
 * Horizontally scrollable and ready for future contest-activity overlays.
 */
export function ContributionHeatmap({ title = 'Activity', icon, action, data, weeks = 26, loading, className }: ContributionHeatmapProps) {
  const { columns, max, total } = useMemo(() => buildGrid(data, weeks), [data, weeks]);
  const empty = !loading && total === 0;

  return (
    <CardContainer className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between gap-3">
        <h3 className="inline-flex items-center gap-2 text-sm font-semibold">
          {icon && <span className="text-primary">{icon}</span>}
          {title}
        </h3>
        {action}
      </div>

      {loading ? (
        <div className="h-32 animate-pulse rounded-lg bg-muted/40" />
      ) : empty ? (
        <EmptyChartState height={132} message="No activity in this period" />
      ) : (
        <div className="overflow-x-auto pb-1">
          <div className="flex gap-3">
            {/* Weekday labels */}
            <div className="flex flex-col gap-[3px] pt-[18px] text-[9px] text-muted-foreground">
              {WEEKDAYS.map((w, i) => (
                <span key={i} className="h-[11px] leading-[11px]">
                  {w}
                </span>
              ))}
            </div>

            <div className="flex flex-col gap-1">
              {/* Month labels */}
              <div className="flex gap-[3px] text-[9px] text-muted-foreground">
                {columns.map((col, i) => {
                  const first = col.find(Boolean);
                  const showMonth = first && first.date.getDate() <= 7;
                  return (
                    <span key={i} className="w-[11px]">
                      {showMonth ? MONTHS[first!.date.getMonth()] : ''}
                    </span>
                  );
                })}
              </div>

              {/* Grid */}
              <div className="flex gap-[3px]">
                {columns.map((col, ci) => (
                  <div key={ci} className="flex flex-col gap-[3px]">
                    {col.map((cell, ri) =>
                      cell ? (
                        <div
                          key={ri}
                          className="size-[11px] rounded-[2px]"
                          style={{ background: levelColor(cell.level) }}
                          title={`${cell.count} ${cell.count === 1 ? 'event' : 'events'} · ${cell.key}`}
                          aria-label={`${cell.count} events on ${cell.key}`}
                        />
                      ) : (
                        <div key={ri} className="size-[11px]" />
                      ),
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="mt-3 flex items-center justify-end gap-1.5 text-[10px] text-muted-foreground">
            <span>Less</span>
            {[0, 1, 2, 3, 4].map((l) => (
              <span key={l} className="size-[11px] rounded-[2px]" style={{ background: levelColor(l) }} />
            ))}
            <span>More · busiest {max}</span>
          </div>
        </div>
      )}
    </CardContainer>
  );
}

function levelColor(level: number): string {
  if (level <= 0) return 'hsl(var(--muted))';
  const alpha = [0, 0.3, 0.5, 0.72, 1][level] ?? 1;
  return `hsl(var(--primary) / ${alpha})`;
}

function buildGrid(data: TimePoint[], weeks: number): { columns: (Cell | null)[][]; max: number; total: number } {
  const countByDate = new Map(data.map((d) => [d.date, d.count]));
  const max = data.reduce((m, d) => Math.max(m, d.count), 0);
  const total = data.reduce((s, d) => s + d.count, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  // Align the end to the current week's Saturday, then step back `weeks`.
  const end = addDays(today, 6 - today.getDay());
  const start = addDays(end, -(weeks * 7 - 1));

  const level = (count: number): number => {
    if (count <= 0 || max <= 0) return 0;
    const ratio = count / max;
    if (ratio > 0.75) return 4;
    if (ratio > 0.5) return 3;
    if (ratio > 0.25) return 2;
    return 1;
  };

  const columns: (Cell | null)[][] = [];
  let cursor = new Date(start);
  for (let w = 0; w < weeks; w += 1) {
    const col: (Cell | null)[] = [];
    for (let d = 0; d < 7; d += 1) {
      if (cursor > today) {
        col.push(null);
      } else {
        const key = toKey(cursor);
        const count = countByDate.get(key) ?? 0;
        col.push({ key, count, level: level(count), date: new Date(cursor) });
      }
      cursor = addDays(cursor, 1);
    }
    columns.push(col);
  }
  return { columns, max, total };
}
