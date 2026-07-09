import { LineChart } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PlaceholderChartProps {
  /** What the chart will show, e.g. "Activity heatmap". */
  title: string;
  /** Optional hint about the chart type coming in Sprint 2. */
  kind?: string;
  height?: number;
  className?: string;
}

/**
 * PlaceholderChart — a labelled dashed container that reserves the exact space a
 * Sprint-2 visualisation will occupy. Keeps the analytics pages laid out and
 * honest ("chart coming"), with no charting dependency yet.
 */
export function PlaceholderChart({ title, kind = 'Visualization', height = 220, className }: PlaceholderChartProps) {
  return (
    <div
      role="img"
      aria-label={`${title} — ${kind} placeholder`}
      className={cn(
        'flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-card/40 p-6 text-center',
        className,
      )}
      style={{ minHeight: height }}
    >
      <LineChart className="size-7 text-muted-foreground/60" />
      <p className="text-sm font-medium text-muted-foreground">{title}</p>
      <p className="text-xs text-muted-foreground/70">{kind} · arriving in Sprint 2</p>
    </div>
  );
}
