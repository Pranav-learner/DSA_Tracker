import { ProgressGauge } from '@/components/analytics/charts';
import { scoreColor } from '@/lib/retention';

/** A readiness gauge (0–100) — reuses the Module-4 radial gauge. */
export function ReadinessGauge({ score, label = 'Readiness', size = 170 }: { score: number; label?: string; size?: number }) {
  return <ProgressGauge value={score} label={label} color={scoreColor(score)} size={size} />;
}
