import { useParams, Link } from 'react-router-dom';
import { Brain, ArrowLeft, Target, Zap, RefreshCw, Lightbulb, BookOpen } from 'lucide-react';
import { usePattern } from '@/hooks/useAnalytics';
import { SectionHeader } from '@/components/common/SectionHeader';
import { ErrorState } from '@/components/common/ErrorState';
import { CardContainer } from '@/components/common/CardContainer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AnalyticsGrid,
  MetricCard,
  LoadingAnalytics,
  ConfidenceRadar,
  PatternMatrix,
} from '@/components/analytics';
import { PATTERN_STATUS_META } from '@/lib/intelligence';

/** Pattern detail — the flagship Pattern Confidence Matrix + behavioural signals. */
export function PatternDetail() {
  const { patternId } = useParams<{ patternId: string }>();
  const { data, isLoading, isError, error, refetch } = usePattern(patternId);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link to="/analytics/patterns">
            <ArrowLeft className="size-4" /> Patterns
          </Link>
        </Button>
      </div>

      {isError ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : isLoading || !data ? (
        <LoadingAnalytics metrics={4} panels={2} />
      ) : (
        <>
          <SectionHeader
            eyebrow={data.phaseTitle}
            title={data.title}
            icon={<Brain className="size-5" />}
            action={<Badge variant={PATTERN_STATUS_META[data.status].badge}>{PATTERN_STATUS_META[data.status].label}</Badge>}
          />

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <ConfidenceRadar matrix={data.matrix} icon={<Brain className="size-4" />} />
            <PatternMatrix matrix={data.matrix} />
          </div>

          <AnalyticsGrid>
            <MetricCard label="Attempt Success" value={`${data.attemptSuccessRate}%`} icon={<Target className="size-4" />} tone="primary" hint={`${data.problemsSolved}/${data.problemsAttempted} solved`} />
            <MetricCard label="Avg Solve Time" value={`${data.averageSolveTimeMinutes}m`} icon={<Zap className="size-4" />} />
            <MetricCard label="Revision Success" value={`${data.revisionSuccessRate}%`} icon={<RefreshCw className="size-4" />} hint={`${data.reviewCount} reviews`} />
            <MetricCard label="Hint / Editorial" value={`${data.hintDependency}% / ${data.editorialDependency}%`} icon={<Lightbulb className="size-4" />} tone={data.hintDependency > 40 ? 'warning' : 'default'} />
          </AnalyticsGrid>

          <CardContainer className="flex items-center justify-between gap-3">
            <span className="text-sm text-muted-foreground">Ready to work on this pattern?</span>
            <Button asChild size="sm">
              <Link to={`/topic/${data.patternId}`}>
                <BookOpen className="size-4" /> Open topic
              </Link>
            </Button>
          </CardContainer>
        </>
      )}
    </div>
  );
}
