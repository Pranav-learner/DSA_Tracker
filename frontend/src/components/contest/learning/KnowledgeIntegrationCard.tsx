import { Link } from 'react-router-dom';
import { Network, NotebookPen, RefreshCw, Gauge, ArrowRight } from 'lucide-react';
import { CardContainer } from '@/components/common/CardContainer';
import type { UpsolveTask } from '@/types';

/**
 * KnowledgeIntegrationCard — explains how completing upsolves feeds the rest of
 * CP-OS, and surfaces the links created by the last completed task.
 */
export function KnowledgeIntegrationCard({ tasks }: { tasks: UpsolveTask[] }) {
  const lastLinked = [...tasks].reverse().find((t) => t.linkedRevisionSchedule || t.linkedKnowledgeEntry);
  return (
    <CardContainer className="space-y-3">
      <h3 className="inline-flex items-center gap-2 text-sm font-semibold"><Network className="size-4 text-primary" /> Knowledge Integration</h3>
      <ul className="space-y-1.5 text-sm text-muted-foreground">
        <li className="inline-flex items-center gap-2"><Gauge className="size-3.5 text-primary" /> Completing an upsolve nudges topic mastery.</li>
        <li className="inline-flex items-center gap-2"><RefreshCw className="size-3.5 text-success" /> The topic enters spaced revision.</li>
        <li className="inline-flex items-center gap-2"><NotebookPen className="size-3.5 text-warning" /> It links to your notebook entry when one exists.</li>
      </ul>
      {lastLinked && (
        <div className="flex flex-wrap items-center gap-3 border-t border-border/60 pt-3 text-xs">
          <span className="text-muted-foreground">Latest sync:</span>
          {lastLinked.linkedRevisionSchedule && <span className="inline-flex items-center gap-1 text-success"><RefreshCw className="size-3" /> revision</span>}
          {lastLinked.linkedKnowledgeEntry && (
            <Link to={`/notebook/${lastLinked.linkedKnowledgeEntry}`} className="inline-flex items-center gap-1 text-primary hover:underline">
              <NotebookPen className="size-3" /> notebook <ArrowRight className="size-3" />
            </Link>
          )}
        </div>
      )}
    </CardContainer>
  );
}
