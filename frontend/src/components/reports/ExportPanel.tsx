import { FileText, FileCode, FileJson, Sheet, Loader2 } from 'lucide-react';
import { CardContainer } from '@/components/common/CardContainer';
import { Button } from '@/components/ui/button';
import { useExportReport } from '@/hooks/useReports';
import type { ExportFormat, ReportKind } from '@/types';

const FORMATS: { format: ExportFormat; label: string; icon: typeof FileText }[] = [
  { format: 'pdf', label: 'PDF', icon: FileText },
  { format: 'markdown', label: 'Markdown', icon: FileCode },
  { format: 'json', label: 'JSON', icon: FileJson },
  { format: 'csv', label: 'CSV', icon: Sheet },
];

/** Export buttons — the server renders each format; the client downloads. */
export function ExportPanel({ type, phaseId, compact = false }: { type: ReportKind; phaseId?: string; compact?: boolean }) {
  const exporter = useExportReport();
  const buttons = FORMATS.map(({ format, label, icon: Icon }) => (
    <Button
      key={format}
      variant="secondary"
      size="sm"
      disabled={exporter.isPending}
      onClick={() => exporter.mutate({ format, type, phaseId })}
    >
      {exporter.isPending && exporter.variables?.format === format ? <Loader2 className="size-4 animate-spin" /> : <Icon className="size-4" />}
      {label}
    </Button>
  ));

  if (compact) return <div className="flex flex-wrap items-center gap-2">{buttons}</div>;

  return (
    <CardContainer className="flex flex-col gap-3">
      <h3 className="text-sm font-semibold">Export</h3>
      <p className="text-xs text-muted-foreground">Server-rendered downloads. PDF preserves the score charts as bars.</p>
      <div className="flex flex-wrap items-center gap-2">{buttons}</div>
      {exporter.isError && <p className="text-xs text-danger">Export failed — please try again.</p>}
    </CardContainer>
  );
}
