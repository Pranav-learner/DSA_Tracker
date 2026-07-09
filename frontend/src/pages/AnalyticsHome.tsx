import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, TrendingUp, Gauge, Brain, Puzzle, CheckCircle2, NotebookPen, CalendarClock, Flame, Activity, Sparkles, ShieldAlert, Award, Lightbulb, Compass, ArrowRight } from 'lucide-react';
import { useAnalyticsOverview, usePreviousOverview } from '@/hooks/useAnalytics';
import { useAppSelector } from '@/store/hooks';
import { SectionHeader } from '@/components/common/SectionHeader';
import { CardContainer } from '@/components/common/CardContainer';
import { ErrorState } from '@/components/common/ErrorState';
import {
  AnalyticsSection,
  AnalyticsGrid,
  FilterBar,
  LoadingAnalytics,
  EmptyAnalytics,
  InsightCard,
  MetricWidget,
  LearningOverviewWidget,
  ProblemOverviewWidget,
  KnowledgeWidget,
  RevisionWidget,
  RetentionWidget,
  ActivityWidget,
  TrendWidget,
  ContributionWidget,
  RadarChartCard,
  chartColor,
  type RadarPoint,
} from '@/components/analytics';
import { comparisonLabel, pctChange } from '@/lib/comparison';
import type { AnalyticsOverview } from '@/types';

/**
 * AnalyticsHome — the premium analytics dashboard. Pure presentation: it
 * visualises the aggregation-layer payload (current + previous window for
 * trends) and never computes a metric. Charts arrive from the reusable chart
 * library; widgets are drop-in and reused across scope pages.
 */
export function AnalyticsHome() {
  const { data, isLoading, isError, error, refetch } = useAnalyticsOverview();
  const { data: prev } = usePreviousOverview();
  const { range, comparison } = useAppSelector((s) => s.analytics);
  const cmpLabel = comparison ? comparisonLabel(range) : undefined;

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Analytics Engine"
        title="Insights"
        description="A unified, visual view across every engine — learning, problems, knowledge, revision, retention and activity."
        icon={<BarChart3 className="size-5" />}
      />
      <FilterBar />

      {isError ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : isLoading || !data ? (
        <LoadingAnalytics metrics={8} panels={3} />
      ) : isEmpty(data) ? (
        <EmptyAnalytics />
      ) : (
        <>
          {/* Quick summary */}
          <AnalyticsGrid cols={4}>
            <MetricWidget label="Overall Progress" value={`${data.learning.completionPercent}%`} icon={<TrendingUp className="size-4" />} tone="primary" changePercent={change(prev, data, (o) => o.learning.completionPercent)} changeLabel={cmpLabel} tooltip="Share of all topics completed" />
            <MetricWidget label="Overall Mastery" value={`${data.learning.averageMastery}%`} icon={<Gauge className="size-4" />} tone="primary" changePercent={change(prev, data, (o) => o.learning.averageMastery)} changeLabel={cmpLabel} />
            <MetricWidget label="Overall Retention" value={`${data.retention.averageRetention}%`} icon={<Brain className="size-4" />} tone="success" changePercent={change(prev, data, (o) => o.retention.averageRetention)} changeLabel={cmpLabel} />
            <MetricWidget label="Problems Solved" value={data.problems.solvedProblems} icon={<Puzzle className="size-4" />} changePercent={change(prev, data, (o) => o.problems.solvedProblems)} changeLabel={cmpLabel} />
            <MetricWidget label="Topics Completed" value={data.learning.topicsCompleted} icon={<CheckCircle2 className="size-4" />} tone="success" changePercent={change(prev, data, (o) => o.learning.topicsCompleted)} changeLabel={cmpLabel} />
            <MetricWidget label="Knowledge Entries" value={data.knowledge.notebookEntries} icon={<NotebookPen className="size-4" />} changePercent={change(prev, data, (o) => o.knowledge.notebookEntries)} changeLabel={cmpLabel} />
            <MetricWidget label="Revision Completion" value={`${data.revision.revisionConsistencyPercent}%`} icon={<CalendarClock className="size-4" />} tone="primary" changePercent={change(prev, data, (o) => o.revision.revisionConsistencyPercent)} changeLabel={cmpLabel} />
            <MetricWidget label="Current Streak" value={`${data.activity.currentStreak}d`} icon={<Flame className="size-4" />} tone="warning" />
          </AnalyticsGrid>

          {/* Pattern Intelligence nav */}
          <AnalyticsSection title="Pattern Intelligence" description="Rule-based insights into your learning" icon={<Brain className="size-4" />}>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
              <IntelLink to="/analytics/patterns" icon={<Brain className="size-4" />} label="Patterns" />
              <IntelLink to="/analytics/weaknesses" icon={<ShieldAlert className="size-4" />} label="Weaknesses" />
              <IntelLink to="/analytics/strengths" icon={<Award className="size-4" />} label="Strengths" />
              <IntelLink to="/analytics/insights" icon={<Lightbulb className="size-4" />} label="Insights" />
              <IntelLink to="/analytics/recommendations" icon={<Compass className="size-4" />} label="Recommendations" />
            </div>
          </AnalyticsSection>

          {/* Scope widgets */}
          <AnalyticsSection title="By Engine" description="Click any widget to explore" icon={<BarChart3 className="size-4" />}>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <LearningOverviewWidget data={data.learning} />
              <ProblemOverviewWidget data={data.problems} />
              <KnowledgeWidget data={data.knowledge} />
              <RevisionWidget data={data.revision} />
              <RetentionWidget data={data.retention} />
              <ActivityWidget data={data.activity} />
            </div>
          </AnalyticsSection>

          {/* Trends */}
          <AnalyticsSection title="Trends" icon={<TrendingUp className="size-4" />}>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <TrendWidget title="Daily activity" icon={<Activity className="size-4" />} data={data.activity.dailyActivity} name="Events" color={chartColor.primary} />
              <RadarChartCard title="Learning profile" icon={<Gauge className="size-4" />} data={profileRadar(data)} name="Score" color={chartColor.primary} />
            </div>
          </AnalyticsSection>

          {/* Contribution heatmap */}
          <AnalyticsSection title="Contribution" icon={<Activity className="size-4" />}>
            <ContributionWidget data={data.activity} />
          </AnalyticsSection>

          {/* Highlights (factual, non-derived) */}
          <AnalyticsSection title="Highlights" icon={<Sparkles className="size-4" />}>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <InsightCard icon={<Flame className="size-4" />} tone="warning" title={`${data.activity.currentStreak}-day streak`} description={`Longest so far: ${data.activity.longestStreak} days across ${data.activity.activeDays} active days.`} />
              <InsightCard icon={<Brain className="size-4" />} tone="success" title={`${data.retention.knowledgeHealthPercent}% knowledge health`} description={`${data.retention.masteredTopics} mastered · ${data.retention.atRiskTopics} at risk.`} />
              <InsightCard icon={<Puzzle className="size-4" />} tone="primary" title={`${data.problems.successRate}% success rate`} description={`${data.problems.solvedProblems} solved with an avg solve time of ${data.problems.averageSolveTimeMinutes}m.`} />
            </div>
          </AnalyticsSection>
        </>
      )}
    </div>
  );
}

function IntelLink({ to, icon, label }: { to: string; icon: ReactNode; label: string }) {
  return (
    <Link to={to}>
      <CardContainer interactive className="flex items-center justify-between gap-2 py-3">
        <span className="inline-flex items-center gap-2 text-sm font-medium">
          <span className="text-primary">{icon}</span>
          {label}
        </span>
        <ArrowRight className="size-4 text-muted-foreground" />
      </CardContainer>
    </Link>
  );
}

/** Percentage change of a metric vs the previous window (undefined if no prev). */
function change(prev: AnalyticsOverview | undefined, cur: AnalyticsOverview, pick: (o: AnalyticsOverview) => number): number | undefined {
  if (!prev) return undefined;
  return pctChange(pick(cur), pick(prev));
}

/** Map current metrics onto a 0–100 radar profile (pure re-shaping, no math). */
function profileRadar(d: AnalyticsOverview): RadarPoint[] {
  return [
    { axis: 'Mastery', value: d.learning.averageMastery },
    { axis: 'Completion', value: d.learning.completionPercent },
    { axis: 'Knowledge', value: d.knowledge.coveragePercent },
    { axis: 'Revision', value: d.revision.revisionConsistencyPercent },
    { axis: 'Retention', value: d.retention.averageRetention },
    { axis: 'Success', value: d.problems.successRate },
  ];
}

function isEmpty(d: AnalyticsOverview): boolean {
  return d.activity.totalActivities === 0 && d.problems.solvedProblems === 0 && d.learning.topicsCompleted === 0;
}
