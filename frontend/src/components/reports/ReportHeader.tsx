import type { ReactNode } from 'react';
import { FileText } from 'lucide-react';
import type { ReportMeta } from '@/types';

/** Report header — title, period, generated date + optional actions (print/export). */
export function ReportHeader({ meta, actions }: { meta: ReportMeta; actions?: ReactNode }) {
  return (
    <header className="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-end sm:justify-between print:border-black/20">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-border bg-accent text-primary print:hidden">
          <FileText className="size-5" />
        </span>
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{meta.periodLabel}</p>
          <h1 className="text-2xl font-semibold tracking-tight">{meta.title}</h1>
          <p className="text-xs text-muted-foreground">Generated {new Date(meta.generatedAt).toLocaleString()}</p>
        </div>
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2 print:hidden">{actions}</div>}
    </header>
  );
}
