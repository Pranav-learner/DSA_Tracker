import { Link } from 'react-router-dom';
import { ArrowRight, Zap, Target, RefreshCw } from 'lucide-react';
import { CardContainer } from '@/components/common/CardContainer';
import { Badge } from '@/components/ui/badge';
import { ProgressRing } from '@/components/analytics/charts';
import { TrendIndicator } from './TrendIndicator';
import { PATTERN_STATUS_META } from '@/lib/intelligence';
import { scoreColor } from '@/lib/retention';
import { cn } from '@/lib/utils';
import type { PatternProfile } from '@/types';

const trendDir = (d: PatternProfile['confidenceTrendDirection']) =>
  d === 'rising' ? 'increasing' : d === 'falling' ? 'declining' : 'stable';

/** Pattern summary card — mastery ring, status, key signals + drill-in link. */
export function PatternCard({ pattern, className }: { pattern: PatternProfile; className?: string }) {
  const meta = PATTERN_STATUS_META[pattern.status];
  return (
    <CardContainer className={cn('flex flex-col gap-4', className)} interactive>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{pattern.phaseTitle}</span>
            <Badge variant={meta.badge}>{meta.label}</Badge>
          </div>
          <h3 className="mt-1 truncate font-semibold">{pattern.title}</h3>
          <TrendIndicator direction={trendDir(pattern.confidenceTrendDirection)} delta={pattern.confidenceTrendDelta} unit="%" className="mt-1" />
        </div>
        <ProgressRing value={pattern.matrix.overallMastery} label="Mastery" color={scoreColor(pattern.matrix.overallMastery)} size={72} strokeWidth={7} />
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <Stat icon={<Target className="size-3.5" />} label="Success" value={`${pattern.attemptSuccessRate}%`} />
        <Stat icon={<Zap className="size-3.5" />} label="Solve" value={`${pattern.averageSolveTimeMinutes}m`} />
        <Stat icon={<RefreshCw className="size-3.5" />} label="Reviews" value={pattern.reviewCount} />
      </div>

      <Link to={`/analytics/patterns/${pattern.patternId}`} className="inline-flex items-center gap-1 self-start text-xs text-primary hover:underline">
        View matrix <ArrowRight className="size-3" />
      </Link>
    </CardContainer>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-0.5 rounded-lg border border-border/60 bg-card/40 py-2">
      <span className="text-muted-foreground">{icon}</span>
      <span className="text-sm font-semibold tabular-nums">{value}</span>
      <span className="text-[9px] uppercase tracking-wider text-muted-foreground">{label}</span>
    </div>
  );
}
