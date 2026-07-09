import { motion } from 'framer-motion';
import { Zap, TrendingUp, Gauge, Layers, CircleDashed, CheckCircle2 } from 'lucide-react';
import { CardContainer } from '@/components/common/CardContainer';
import { DashboardMetricCard } from '@/components/dashboard';
import { MasteryBar } from '@/components/learning/MasteryBar';
import { masteryTone } from '@/lib/mastery';
import type { LearningImpact } from '@/types';

/**
 * Learning Impact — how this problem moves the learner's progress. Shows the
 * live topic mastery (+ the delta from the last solve), topic progress and the
 * dashboard-level aggregates it feeds.
 */
export function LearningImpactCard({ impact }: { impact: LearningImpact }) {
  const gained = impact.masteryDelta != null && impact.masteryDelta > 0;

  return (
    <CardContainer className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-primary">
          <Zap className="size-4" />
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Learning Impact
          </h3>
        </div>
        {gained && (
          <motion.span
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2 py-0.5 text-xs font-semibold text-success"
          >
            <TrendingUp className="size-3" /> +{impact.masteryDelta}% mastery
          </motion.span>
        )}
      </div>

      <MasteryBar value={impact.currentMastery} label="Topic Mastery" />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <DashboardMetricCard
          label="Topic Mastery"
          value={`${impact.currentMastery}%`}
          icon={<Gauge className="size-4" />}
          tone={masteryTone(impact.currentMastery)}
        />
        <DashboardMetricCard
          label="Overall Mastery"
          value={`${impact.dashboard.overallMastery}%`}
          icon={<Gauge className="size-4" />}
          tone={masteryTone(impact.dashboard.overallMastery)}
        />
        <DashboardMetricCard
          label="Topics Done"
          value={impact.dashboard.topicsCompleted}
          icon={<CheckCircle2 className="size-4" />}
        />
        <DashboardMetricCard
          label="Topics Left"
          value={impact.dashboard.topicsRemaining}
          icon={<CircleDashed className="size-4" />}
        />
      </div>

      {impact.topicProgress && (
        <div className="flex items-center gap-2 rounded-lg border border-border bg-accent/30 px-3 py-2 text-xs text-muted-foreground">
          <Layers className="size-3.5 shrink-0" />
          <span>
            Phase progress: <span className="font-semibold text-foreground">{impact.topicProgress.completionPercent}%</span>{' '}
            ({impact.topicProgress.topicsCompleted}/{impact.topicProgress.topicsTotal} topics)
            {impact.topicCompleted && <span className="ml-1 font-semibold text-success">· topic complete!</span>}
          </span>
        </div>
      )}
    </CardContainer>
  );
}
