import { cn } from '@/lib/utils';

export interface LegendItem {
  label: string;
  color: string;
  value?: string | number;
}

/** A themed, wrapping legend row shared by pie/bar/multi-series charts. */
export function ChartLegend({ items, className }: { items: LegendItem[]; className?: string }) {
  return (
    <ul className={cn('flex flex-wrap items-center gap-x-4 gap-y-1.5', className)}>
      {items.map((item) => (
        <li key={item.label} className="inline-flex items-center gap-1.5 text-xs">
          <span className="size-2.5 rounded-sm" style={{ background: item.color }} aria-hidden />
          <span className="text-muted-foreground">{item.label}</span>
          {item.value !== undefined && <span className="font-semibold tabular-nums text-foreground">{item.value}</span>}
        </li>
      ))}
    </ul>
  );
}
