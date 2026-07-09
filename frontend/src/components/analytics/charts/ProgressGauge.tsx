import { ResponsiveContainer, RadialBarChart, RadialBar, PolarAngleAxis } from 'recharts';
import { chartColor } from './chartTheme';
import { cn } from '@/lib/utils';

interface ProgressGaugeProps {
  /** 0–100 value. */
  value: number;
  label?: string;
  size?: number;
  color?: string;
  suffix?: string;
  className?: string;
}

/**
 * ProgressGauge — a 270° radial gauge for a single 0–100 metric (retention,
 * health, consistency…). Center shows the value; the arc fills proportionally.
 */
export function ProgressGauge({ value, label, size = 160, color = chartColor.primary, suffix = '%', className }: ProgressGaugeProps) {
  const clamped = Math.max(0, Math.min(100, value));
  const data = [{ name: label ?? 'value', value: clamped, fill: color }];

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)} style={{ width: size, height: size }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart
          data={data}
          startAngle={225}
          endAngle={-45}
          innerRadius="70%"
          outerRadius="100%"
          barSize={10}
        >
          <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
          <RadialBar dataKey="value" cornerRadius={8} background={{ fill: 'hsl(var(--muted))' }} isAnimationActive animationDuration={700} />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-semibold tabular-nums">
          {Math.round(clamped)}
          {suffix}
        </span>
        {label && <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>}
      </div>
    </div>
  );
}
