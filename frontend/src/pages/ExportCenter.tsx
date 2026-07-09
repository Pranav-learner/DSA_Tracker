import { Link } from 'react-router-dom';
import { Download, CalendarRange, CalendarDays, FileText, Layers, ArrowRight } from 'lucide-react';
import { SectionHeader } from '@/components/common/SectionHeader';
import { CardContainer } from '@/components/common/CardContainer';
import { ExportPanel } from '@/components/reports';
import type { ReportKind } from '@/types';

const REPORTS: { type: Exclude<ReportKind, 'phase'>; title: string; description: string; icon: typeof FileText }[] = [
  { type: 'weekly', title: 'Weekly Report', description: 'The last 7 days of learning.', icon: CalendarRange },
  { type: 'monthly', title: 'Monthly Report', description: 'A 30-day progress review.', icon: CalendarDays },
  { type: 'summary', title: 'Learning Summary', description: 'A current-snapshot retrospective.', icon: FileText },
];

/** Export Center — download any report as PDF, Markdown, JSON or CSV. */
export function ExportCenter() {
  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Reports"
        title="Export Center"
        description="Server-rendered exports — PDF (with score charts), Markdown, JSON and CSV."
        icon={<Download className="size-5" />}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {REPORTS.map(({ type, title, description, icon: Icon }) => (
          <CardContainer key={type} className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <span className="flex size-9 items-center justify-center rounded-lg border border-border bg-accent text-primary">
                <Icon className="size-4" />
              </span>
              <div>
                <h3 className="text-sm font-semibold">{title}</h3>
                <p className="text-xs text-muted-foreground">{description}</p>
              </div>
            </div>
            <ExportPanel type={type} compact />
            <Link to={`/reports/${type === 'summary' ? 'summary' : type}`} className="mt-auto inline-flex items-center gap-1 text-xs text-primary hover:underline">
              View report <ArrowRight className="size-3" />
            </Link>
          </CardContainer>
        ))}
      </div>

      <CardContainer className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Layers className="size-4 text-primary" />
          <div>
            <h3 className="text-sm font-semibold">Phase Completion Report</h3>
            <p className="text-xs text-muted-foreground">Pick a phase to generate and export its report.</p>
          </div>
        </div>
        <Link to="/reports/phase" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
          Choose phase <ArrowRight className="size-3" />
        </Link>
      </CardContainer>
    </div>
  );
}
