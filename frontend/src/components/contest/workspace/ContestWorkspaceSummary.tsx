import { CardContainer } from '@/components/common/CardContainer';
import { StickyNote } from 'lucide-react';
import type { ContestWorkspace } from '@/types';

/** A short workspace summary line + quick notes. */
export function ContestWorkspaceSummary({ workspace }: { workspace: ContestWorkspace }) {
  const { performance, statistics, problems, notes } = workspace;
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr]">
      <CardContainer className="flex flex-col justify-center gap-1">
        <p className="text-sm">
          Solved <span className="font-semibold text-success">{performance.totalSolved}</span> of {problems.length} ·
          {' '}<span className="font-semibold">{statistics.acceptanceRate}%</span> acceptance ·
          {' '}penalty <span className="font-semibold text-warning">{performance.penalty}</span>
        </p>
        <p className="text-xs text-muted-foreground">
          {statistics.problemsAttempted} attempted · {statistics.problemsSkipped} skipped · pace {statistics.contestPace}/h
        </p>
      </CardContainer>
      <CardContainer className="space-y-1.5">
        <span className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          <StickyNote className="size-3.5" /> Quick Notes
        </span>
        <p className="text-sm text-muted-foreground">{notes || 'No contest notes yet.'}</p>
      </CardContainer>
    </div>
  );
}
