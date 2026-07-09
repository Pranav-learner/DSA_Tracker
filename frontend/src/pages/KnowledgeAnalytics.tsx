import { NotebookPen, Puzzle, BookMarked, Layers3, HeartHandshake, FileText } from 'lucide-react';
import { useKnowledgeAnalytics } from '@/hooks/useAnalytics';
import { SectionHeader } from '@/components/common/SectionHeader';
import { ErrorState } from '@/components/common/ErrorState';
import { CardContainer } from '@/components/common/CardContainer';
import {
  AnalyticsSection,
  AnalyticsGrid,
  MetricCard,
  FilterBar,
  LoadingAnalytics,
  ProgressRing,
  chartColor,
} from '@/components/analytics';

/** Knowledge analytics — notebook coverage, documentation rate + confidence. */
export function KnowledgeAnalytics() {
  const { data, isLoading, isError, error, refetch } = useKnowledgeAnalytics();

  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="Analytics" title="Knowledge" icon={<NotebookPen className="size-5" />} />
      <FilterBar />

      {isError ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : isLoading || !data ? (
        <LoadingAnalytics />
      ) : (
        <>
          <AnalyticsGrid>
            <MetricCard label="Notebook Entries" value={data.notebookEntries} icon={<NotebookPen className="size-4" />} />
            <MetricCard label="Coverage" value={`${data.coveragePercent}%`} icon={<Layers3 className="size-4" />} tone="primary" hint={`${data.topicsCovered} topics`} />
            <MetricCard label="Documentation Rate" value={`${data.documentationRate}%`} icon={<FileText className="size-4" />} hint="of completed topics" />
            <MetricCard label="Avg Confidence" value={`${data.averageConfidence}%`} icon={<HeartHandshake className="size-4" />} tone="primary" />
            <MetricCard label="Patterns Learned" value={data.patternsLearned} icon={<BookMarked className="size-4" />} tone="success" />
            <MetricCard label="Problems Documented" value={data.representativeProblems} icon={<Puzzle className="size-4" />} />
          </AnalyticsGrid>

          <AnalyticsSection title="Coverage & Confidence" icon={<Layers3 className="size-4" />}>
            <CardContainer className="flex flex-wrap items-center justify-around gap-6 py-6">
              <ProgressRing value={data.coveragePercent} label="Coverage" color={chartColor.primary} size={120} strokeWidth={10} />
              <ProgressRing value={data.documentationRate} label="Documented" color={chartColor.success} size={120} strokeWidth={10} />
              <ProgressRing value={data.averageConfidence} label="Confidence" color={chartColor.warning} size={120} strokeWidth={10} />
            </CardContainer>
          </AnalyticsSection>
        </>
      )}
    </div>
  );
}
