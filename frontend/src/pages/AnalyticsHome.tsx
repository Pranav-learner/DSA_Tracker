import type { ReactNode } from 'react';
import { BarChart3, GraduationCap, Puzzle, NotebookPen, CalendarClock, Brain, Activity } from 'lucide-react';
import { useAnalyticsOverview } from '@/hooks/useAnalytics';
import { SectionHeader } from '@/components/common/SectionHeader';
import { ErrorState } from '@/components/common/ErrorState';
import {
  AnalyticsSection,
  AnalyticsGrid,
  SummaryCard,
  FilterBar,
  LoadingAnalytics,
  EmptyAnalytics,
  PlaceholderChart,
} from '@/components/analytics';

/**
 * AnalyticsHome — the analytics landing page. Surfaces one summary card per
 * scope (every figure from the aggregation layer) and links into the detail
 * pages. Charts arrive in Sprint 2; placeholders reserve their space.
 */
export function AnalyticsHome() {
  const { data, isLoading, isError, error, refetch } = useAnalyticsOverview();

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Analytics Engine"
        title="Insights"
        description="A unified view across learning, problems, knowledge, revision, retention and activity."
        icon={<BarChart3 className="size-5" />}
      />
      <FilterBar />

      {isError ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : isLoading || !data ? (
        <LoadingAnalytics metrics={6} panels={1} />
      ) : (
        <>
          <AnalyticsGrid cols={3}>
            <SummaryCard title="Learning" icon={<GraduationCap className="size-4" />} to="/analytics/learning" toLabel="Explore">
              <MiniStats
                rows={[
                  ['Completion', `${data.learning.completionPercent}%`],
                  ['Velocity', `${data.learning.learningVelocityPerWeek}/wk`],
                  ['Topics done', `${data.learning.topicsCompleted}/${data.learning.topicsTotal}`],
                  ['Avg mastery', `${data.learning.averageMastery}%`],
                ]}
              />
            </SummaryCard>

            <SummaryCard title="Problems" icon={<Puzzle className="size-4" />} to="/analytics/problems" toLabel="Explore">
              <MiniStats
                rows={[
                  ['Solved', `${data.problems.solvedProblems}`],
                  ['Success', `${data.problems.successRate}%`],
                  ['Attempted', `${data.problems.attemptedProblems}`],
                  ['Avg time', `${data.problems.averageSolveTimeMinutes}m`],
                ]}
              />
            </SummaryCard>

            <SummaryCard title="Knowledge" icon={<NotebookPen className="size-4" />} to="/analytics/knowledge" toLabel="Explore">
              <MiniStats
                rows={[
                  ['Entries', `${data.knowledge.notebookEntries}`],
                  ['Coverage', `${data.knowledge.coveragePercent}%`],
                  ['Patterns', `${data.knowledge.patternsLearned}`],
                  ['Avg confidence', `${data.knowledge.averageConfidence}%`],
                ]}
              />
            </SummaryCard>

            <SummaryCard title="Revision" icon={<CalendarClock className="size-4" />} to="/analytics/revision" toLabel="Explore">
              <MiniStats
                rows={[
                  ['Completed', `${data.revision.reviewsCompleted}`],
                  ['Overdue', `${data.revision.overdueReviews}`],
                  ['Frequency', `${data.revision.reviewFrequencyPerWeek}/wk`],
                  ['Consistency', `${data.revision.revisionConsistencyPercent}%`],
                ]}
              />
            </SummaryCard>

            <SummaryCard title="Retention" icon={<Brain className="size-4" />} to="/analytics/retention" toLabel="Explore">
              <MiniStats
                rows={[
                  ['Avg retention', `${data.retention.averageRetention}%`],
                  ['Health', `${data.retention.knowledgeHealthPercent}%`],
                  ['Mastered', `${data.retention.masteredTopics}`],
                  ['At risk', `${data.retention.atRiskTopics}`],
                ]}
              />
            </SummaryCard>

            <SummaryCard title="Activity" icon={<Activity className="size-4" />} to="/analytics/activity" toLabel="Explore">
              <MiniStats
                rows={[
                  ['Current streak', `${data.activity.currentStreak}d`],
                  ['Longest streak', `${data.activity.longestStreak}d`],
                  ['Active days', `${data.activity.activeDays}`],
                  ['Total events', `${data.activity.totalActivities}`],
                ]}
              />
            </SummaryCard>
          </AnalyticsGrid>

          {data.activity.totalActivities === 0 && data.problems.solvedProblems === 0 ? (
            <EmptyAnalytics />
          ) : (
            <AnalyticsSection title="Trends" description="Visualizations arrive in Sprint 2" icon={<BarChart3 className="size-4" />}>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <PlaceholderChart title="Learning & solve activity over time" kind="Timeline" />
                <PlaceholderChart title="Mastery vs retention" kind="Radar" />
              </div>
            </AnalyticsSection>
          )}
        </>
      )}
    </div>
  );
}

function MiniStats({ rows }: { rows: [string, ReactNode][] }) {
  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-2">
      {rows.map(([label, value]) => (
        <div key={label} className="flex flex-col">
          <span className="text-lg font-semibold tabular-nums">{value}</span>
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
        </div>
      ))}
    </div>
  );
}
