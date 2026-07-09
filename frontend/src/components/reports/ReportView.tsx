import type { ReactNode } from 'react';
import { ReportHeader } from './ReportHeader';
import { ReportSummary } from './ReportSummary';
import { MetricSection } from './MetricSection';
import { ReportChart } from './ReportChart';
import { AchievementCard } from './AchievementCard';
import { ReportTimeline } from './ReportTimeline';
import { ExportPanel } from './ExportPanel';
import { PrintableLayout, PrintButton } from './PrintableLayout';
import { StrengthSection, WeaknessSection, RecommendationSection } from './ReportSections';
import { AnalyticsSection } from '@/components/analytics';
import { Trophy, TrendingUp } from 'lucide-react';
import { TrendCard } from '@/components/analytics';
import type { Report, ReportKind } from '@/types';

/**
 * ReportView — the shared, printable report body. Every report page renders this
 * over its fetched data; `extra` injects report-specific blocks (e.g. phase).
 */
export function ReportView({
  report,
  type,
  phaseId,
  extra,
}: {
  report: Report;
  type: ReportKind;
  phaseId?: string;
  extra?: ReactNode;
}) {
  return (
    <PrintableLayout>
      <ReportHeader
        meta={report.meta}
        actions={
          <>
            <ExportPanel type={type} phaseId={phaseId} compact />
            <PrintButton />
          </>
        }
      />

      <ReportSummary summary={report.summary} />
      {extra}

      <AnalyticsSection title="Key Metrics">
        <MetricSection metrics={report.keyMetrics} />
      </AnalyticsSection>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.2fr_1fr]">
        <ReportChart scores={report.scores} />
        <ReportTimeline goals={report.nextGoals} />
      </div>

      {report.trends.length > 0 && (
        <AnalyticsSection title="Trends" icon={<TrendingUp className="size-4" />}>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {report.trends.map((t) => (
              <TrendCard key={t.key} trend={t} />
            ))}
          </div>
        </AnalyticsSection>
      )}

      {report.achievements.length > 0 && (
        <AnalyticsSection title="Achievements" icon={<Trophy className="size-4" />}>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {report.achievements.map((a, i) => (
              <AchievementCard key={i} achievement={a} />
            ))}
          </div>
        </AnalyticsSection>
      )}

      <StrengthSection strengths={report.strengths} />
      <WeaknessSection weaknesses={report.weaknesses} />
      <RecommendationSection recommendations={report.recommendations} />
    </PrintableLayout>
  );
}
