import { useParams, Link } from 'react-router-dom';
import { Layers, ArrowRight } from 'lucide-react';
import { usePhaseReport } from '@/hooks/useReports';
import { useRoadmap } from '@/hooks/useRoadmap';
import { ErrorState } from '@/components/common/ErrorState';
import { SectionHeader } from '@/components/common/SectionHeader';
import { CardContainer } from '@/components/common/CardContainer';
import { Badge } from '@/components/ui/badge';
import { LoadingAnalytics } from '@/components/analytics';
import { ReportView, ScoreBars } from '@/components/reports';
import type { PhaseReport as PhaseReportData } from '@/types';

/** Phase Completion Report — pick a phase, then a printable readiness report. */
export function PhaseReport() {
  const { phaseId } = useParams<{ phaseId: string }>();
  if (!phaseId) return <PhasePicker />;
  return <PhaseReportBody phaseId={phaseId} />;
}

function PhaseReportBody({ phaseId }: { phaseId: string }) {
  const { data, isLoading, isError, error, refetch } = usePhaseReport(phaseId);
  if (isError) return <ErrorState error={error} onRetry={refetch} />;
  if (isLoading || !data) return <LoadingAnalytics metrics={8} panels={3} />;
  return <ReportView report={data} type="phase" phaseId={phaseId} extra={<PhaseBlock report={data} />} />;
}

function PhaseBlock({ report }: { report: PhaseReportData }) {
  return (
    <CardContainer className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="inline-flex items-center gap-2 text-sm font-semibold">
          <Layers className="size-4 text-primary" /> {report.phase.title}
        </h3>
        <Badge variant={report.estimatedReadiness >= 80 ? 'success' : report.estimatedReadiness >= 60 ? 'primary' : 'warning'}>
          {report.readinessLabel} · {report.estimatedReadiness}%
        </Badge>
      </div>
      <ScoreBars
        items={[
          { label: 'Completion', score: report.phase.completionPercent },
          { label: 'Mastery', score: report.phase.mastery },
          { label: 'Estimated readiness', score: report.estimatedReadiness },
        ]}
      />
      <p className="text-xs text-muted-foreground">
        {report.phase.topicsCompleted}/{report.phase.topicsTotal} topics · {report.patterns.length} patterns analysed
      </p>
    </CardContainer>
  );
}

function PhasePicker() {
  const { data, isLoading, isError, error, refetch } = useRoadmap();
  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="Reports" title="Phase Report" description="Choose a phase to generate its completion report." icon={<Layers className="size-5" />} />
      {isError ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : isLoading || !data ? (
        <LoadingAnalytics metrics={0} panels={2} />
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {data.phases.map((p) => (
            <Link key={p.id} to={`/reports/phase/${p.id}`}>
              <CardContainer interactive className="flex items-center justify-between gap-3">
                <span className="inline-flex items-center gap-2 font-medium">
                  <Layers className="size-4 text-primary" /> Phase {p.order} · {p.title}
                </span>
                <ArrowRight className="size-4 text-muted-foreground" />
              </CardContainer>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
