import { useMemo } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { CONFIDENCE_TREND_META, RETENTION_TONE_TEXT, scoreColor } from '@/lib/retention';
import { cn } from '@/lib/utils';
import type { ConfidenceTrend } from '@/types';

interface ConfidenceTrendChartProps {
  trend: ConfidenceTrend;
  height?: number;
  className?: string;
  /** Hide the header row (label + delta) for compact inline sparklines. */
  bare?: boolean;
}

const TREND_ICON = { rising: TrendingUp, falling: TrendingDown, stable: Minus } as const;

/** Confidence sparkline over time + a rising/falling/stable header. */
export function ConfidenceTrendChart({ trend, height = 56, className, bare = false }: ConfidenceTrendChartProps) {
  const meta = CONFIDENCE_TREND_META[trend.direction];
  const Ico = TREND_ICON[trend.direction];

  const path = useMemo(() => buildPath(trend.series.map((p) => p.value), 100, height), [trend.series, height]);
  const last = trend.series.at(-1)?.value ?? 0;

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {!bare && (
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Confidence Trend
          </span>
          <span className={cn('inline-flex items-center gap-1 text-xs font-medium', RETENTION_TONE_TEXT[meta.tone])}>
            <Ico className="size-3.5" />
            {meta.label}
            {trend.delta !== 0 && <span className="tabular-nums">({trend.delta > 0 ? '+' : ''}{trend.delta})</span>}
          </span>
        </div>
      )}
      {trend.series.length < 2 ? (
        <div className="flex items-center justify-center text-xs text-muted-foreground" style={{ height }}>
          Not enough history yet
        </div>
      ) : (
        <svg viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" className="w-full" style={{ height }}>
          <polyline
            points={path}
            fill="none"
            stroke={scoreColor(last)}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      )}
    </div>
  );
}

/** Build sparkline points scaled to the viewBox (values are 0–100). */
function buildPath(values: number[], width: number, height: number): string {
  if (values.length < 2) return '';
  const pad = 3;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const stepX = (width - pad * 2) / (values.length - 1);
  return values
    .map((v, i) => {
      const x = pad + i * stepX;
      const y = pad + (1 - (v - min) / span) * (height - pad * 2);
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(' ');
}
