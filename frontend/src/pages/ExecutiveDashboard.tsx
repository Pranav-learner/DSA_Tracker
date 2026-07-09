import { Link } from 'react-router-dom';
import { LayoutDashboard, Zap, Wrench, ShieldAlert, BookOpen, ArrowRight, FileText } from 'lucide-react';
import { useExecutive } from '@/hooks/useReports';
import { useAnalyticsOverview } from '@/hooks/useAnalytics';
import { SectionHeader } from '@/components/common/SectionHeader';
import { ErrorState } from '@/components/common/ErrorState';
import { CardContainer } from '@/components/common/CardContainer';
import { Button } from '@/components/ui/button';
import {
  AnalyticsSection,
  AnalyticsGrid,
  MetricCard,
  FilterBar,
  LoadingAnalytics,
  KnowledgeWidget,
  RevisionWidget,
  RetentionWidget,
  IntelInsightCard,
} from '@/components/analytics';
import { OverallScoreCard, ReadinessCard, HealthBreakdown, ProgressOverview, ExecutiveRecommendationCard } from '@/components/executive';

/** Executive Dashboard — the whole learning journey at a glance. */
export function ExecutiveDashboard() {
  const { data, isLoading, isError, error, refetch } = useExecutive();
  const { data: overview } = useAnalyticsOverview();

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Analytics Engine"
        title="Executive Dashboard"
        description="Composite scores, health and readiness across your entire journey."
        icon={<LayoutDashboard className="size-5" />}
        action={
          <Button variant="secondary" size="sm" asChild>
            <Link to="/reports/summary">
              <FileText className="size-4" /> Reports
            </Link>
          </Button>
        }
      />
      <FilterBar />

      {isError ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : isLoading || !data ? (
        <LoadingAnalytics metrics={6} panels={3} />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr]">
            <OverallScoreCard scores={data.scores} />
            <div className="space-y-4">
              <ReadinessCard score={data.scores.overallReadiness} />
              {(data.currentPhase || data.currentTopic) && (
                <CardContainer className="space-y-1.5">
                  {data.currentPhase && (
                    <p className="text-sm">
                      <span className="text-muted-foreground">Current phase:</span> {data.currentPhase.title} · {data.currentPhase.completionPercent}%
                    </p>
                  )}
                  {data.currentTopic && (
                    <Link to={`/topic/${data.currentTopic.id}`} className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
                      <BookOpen className="size-3.5" /> {data.currentTopic.title} <ArrowRight className="size-3" />
                    </Link>
                  )}
                </CardContainer>
              )}
            </div>
          </div>

          <AnalyticsSection title="Progress Overview">
            <ProgressOverview progress={data.progress} />
          </AnalyticsSection>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <HealthBreakdown breakdown={data.breakdown} />
            <ExecutiveRecommendationCard recommendations={data.recommendations} />
          </div>

          <AnalyticsSection title="Pattern Health">
            <AnalyticsGrid cols={3}>
              <MetricCard label="Strong Patterns" value={data.patternHealth.strong} icon={<Zap className="size-4" />} tone="success" />
              <MetricCard label="Developing" value={data.patternHealth.developing} icon={<Wrench className="size-4" />} tone="primary" />
              <MetricCard label="Needs Work" value={data.patternHealth.needsWork} icon={<ShieldAlert className="size-4" />} tone={data.patternHealth.needsWork > 0 ? 'warning' : 'default'} />
            </AnalyticsGrid>
          </AnalyticsSection>

          {overview && (
            <AnalyticsSection title="Engine Health">
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                <KnowledgeWidget data={overview.knowledge} />
                <RevisionWidget data={overview.revision} />
                <RetentionWidget data={overview.retention} />
              </div>
            </AnalyticsSection>
          )}

          {data.insights.length > 0 && (
            <AnalyticsSection title="Key Insights">
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                {data.insights.slice(0, 4).map((i) => (
                  <IntelInsightCard key={i.id} insight={i} />
                ))}
              </div>
            </AnalyticsSection>
          )}
        </>
      )}
    </div>
  );
}
