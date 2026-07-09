import { Sparkles, BookOpen, RefreshCw, Clock, ArrowRight } from 'lucide-react';
import { CardContainer } from '@/components/common/CardContainer';
import { Badge } from '@/components/ui/badge';
import { QuickActionButton } from './QuickActionButton';
import { PLAN_PRIORITY_META } from '@/lib/health';
import { formatMinutes } from '@/lib/revision';
import { cn } from '@/lib/utils';
import type { DashboardTodayPlan } from '@/types';

/**
 * Today's Learning Plan — the single "do this now" card. Headline + priority
 * from the backend recommendation engine, with study/revision time estimates
 * and one-tap actions. No recommendation logic lives here.
 */
export function LearningPlanCard({ plan, revisionTo = '/revision' }: { plan: DashboardTodayPlan; revisionTo?: string }) {
  const priority = PLAN_PRIORITY_META[plan.priority];
  return (
    <CardContainer className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            <Sparkles className="size-3.5 text-primary" /> Today's Plan
          </span>
          <h3 className="text-lg font-semibold leading-snug">{plan.headline}</h3>
          {plan.currentTopic && (
            <p className="text-sm text-muted-foreground">{plan.recommendation.message}</p>
          )}
        </div>
        <Badge variant={priority.badge}>{priority.label}</Badge>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <PlanStat icon={<BookOpen className="size-4" />} label="Study" value={formatMinutes(plan.estimatedStudyMinutes)} />
        <PlanStat icon={<RefreshCw className="size-4" />} label="Revision" value={formatMinutes(plan.estimatedRevisionMinutes)} />
        <PlanStat
          icon={<Clock className="size-4" />}
          label="Due Reviews"
          value={plan.revisionsDue}
          tone={plan.revisionsDue > 0 ? 'text-warning' : undefined}
        />
      </div>

      <div className="flex flex-wrap items-center gap-3 pt-1">
        <QuickActionButton
          to={plan.recommendation.actionTo}
          label={plan.recommendation.actionLabel}
          icon={<ArrowRight className="size-4" />}
        />
        {plan.revisionsDue > 0 && (
          <QuickActionButton
            to={revisionTo}
            label="Start Revision"
            icon={<RefreshCw className="size-4" />}
            variant="secondary"
          />
        )}
      </div>
    </CardContainer>
  );
}

function PlanStat({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  tone?: string;
}) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-border/60 bg-card/40 p-3">
      <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground">
        {icon} {label}
      </span>
      <span className={cn('text-base font-semibold tabular-nums', tone ?? 'text-foreground')}>{value}</span>
    </div>
  );
}
