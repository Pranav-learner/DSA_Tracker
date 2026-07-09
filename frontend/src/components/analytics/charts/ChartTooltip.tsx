interface TooltipEntry {
  name?: string;
  value?: number | string;
  color?: string;
  payload?: Record<string, unknown>;
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string | number;
  /** Optional value formatter, e.g. (v) => `${v}%`. */
  formatter?: (value: number | string, name?: string) => string;
  /** Optional label formatter for the header. */
  labelFormatter?: (label: string | number) => string;
}

/**
 * ChartTooltip — a themed, accessible tooltip shared by every Recharts chart.
 * Passed as `content={<ChartTooltip … />}`.
 */
export function ChartTooltip({ active, payload, label, formatter, labelFormatter }: ChartTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded-lg border border-border bg-card/95 px-3 py-2 text-xs shadow-card backdrop-blur">
      {label !== undefined && label !== '' && (
        <p className="mb-1 font-medium text-foreground">{labelFormatter ? labelFormatter(label) : label}</p>
      )}
      <ul className="space-y-0.5">
        {payload.map((entry, i) => (
          <li key={i} className="flex items-center gap-2">
            <span className="size-2 rounded-full" style={{ background: entry.color }} aria-hidden />
            {entry.name && <span className="text-muted-foreground">{entry.name}</span>}
            <span className="ml-auto font-semibold tabular-nums text-foreground">
              {formatter && entry.value !== undefined ? formatter(entry.value, entry.name) : entry.value}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
