/**
 * Shared chart theme — colours, axis/grid/tooltip defaults derived from the
 * app's CSS design tokens so every chart is dark-theme-correct and consistent.
 * Colours are `hsl(var(--token))` strings; the SVG resolves them against :root,
 * so charts follow the theme with zero JS colour math.
 */

export const chartColor = {
  primary: 'hsl(var(--primary))',
  success: 'hsl(var(--success))',
  warning: 'hsl(var(--warning))',
  danger: 'hsl(var(--danger))',
  muted: 'hsl(var(--muted-foreground))',
  foreground: 'hsl(var(--foreground))',
  border: 'hsl(var(--border))',
  grid: 'hsl(var(--border) / 0.6)',
  axis: 'hsl(var(--muted-foreground))',
} as const;

/** Soft fill for the same token (area fills, hovered bars). */
export function softColor(token: keyof typeof chartColor, alpha = 0.15): string {
  const map: Record<string, string> = {
    primary: `hsl(var(--primary) / ${alpha})`,
    success: `hsl(var(--success) / ${alpha})`,
    warning: `hsl(var(--warning) / ${alpha})`,
    danger: `hsl(var(--danger) / ${alpha})`,
    muted: `hsl(var(--muted-foreground) / ${alpha})`,
    foreground: `hsl(var(--foreground) / ${alpha})`,
    border: `hsl(var(--border) / ${alpha})`,
    grid: `hsl(var(--border) / ${alpha})`,
    axis: `hsl(var(--muted-foreground) / ${alpha})`,
  };
  return map[token];
}

/** Ordered categorical palette for pie/bar series (platforms, difficulties…). */
export const CATEGORICAL_PALETTE: string[] = [
  'hsl(245 83% 67%)', // primary indigo
  'hsl(142 71% 45%)', // success green
  'hsl(38 92% 55%)', // warning amber
  'hsl(0 72% 58%)', // danger red
  'hsl(190 90% 50%)', // cyan
  'hsl(280 70% 65%)', // violet
  'hsl(330 75% 62%)', // pink
  'hsl(24 90% 58%)', // orange
];

export function paletteAt(i: number): string {
  return CATEGORICAL_PALETTE[i % CATEGORICAL_PALETTE.length];
}

/** Shared axis props for a compact, muted look. */
export const axisProps = {
  stroke: chartColor.axis,
  tick: { fill: chartColor.axis, fontSize: 11 },
  tickLine: false,
  axisLine: false,
} as const;

/** Shared cartesian-grid props (faint horizontal guides). */
export const gridProps = {
  stroke: chartColor.grid,
  strokeDasharray: '3 3',
  vertical: false,
} as const;

/** Default entrance animation for series. */
export const ANIM = { isAnimationActive: true, animationDuration: 600 } as const;
