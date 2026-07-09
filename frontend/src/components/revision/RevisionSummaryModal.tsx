import { Link } from 'react-router-dom';
import { Clock, NotebookPen, ListChecks, StickyNote, Gauge } from 'lucide-react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/ui/button';
import { DashboardMetricCard } from '@/components/dashboard';
import { formatMinutes } from '@/lib/revision';
import type { RevisionSession } from '@/types';

interface RevisionSummaryModalProps {
  open: boolean;
  onClose: () => void;
  session: RevisionSession | null;
}

/** Post-completion summary — stored values only (no confidence/retention math). */
export function RevisionSummaryModal({ open, onClose, session }: RevisionSummaryModalProps) {
  if (!session) return null;

  const conf = (v: number | null) => (v == null ? '—' : `${v}%`);

  return (
    <Modal open={open} onClose={onClose} title="Revision complete" description={session.title}>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <DashboardMetricCard label="Duration" value={formatMinutes(session.durationMinutes)} icon={<Clock className="size-4" />} />
          <DashboardMetricCard
            label="Knowledge"
            value={session.reviewedKnowledgeEntries.length}
            icon={<NotebookPen className="size-4" />}
          />
          <DashboardMetricCard
            label="Problems"
            value={session.reviewedProblems.length}
            icon={<ListChecks className="size-4" />}
          />
          <DashboardMetricCard
            label="Notes"
            value={session.reviewNotes.trim() ? 'Added' : 'None'}
            icon={<StickyNote className="size-4" />}
          />
          <DashboardMetricCard label="Confidence before" value={conf(session.selfConfidenceBefore)} icon={<Gauge className="size-4" />} />
          <DashboardMetricCard label="Confidence after" value={conf(session.selfConfidenceAfter)} icon={<Gauge className="size-4" />} />
        </div>

        {session.reviewNotes.trim() && (
          <div>
            <p className="mb-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Your notes</p>
            <p className="whitespace-pre-wrap rounded-lg border border-border bg-accent/30 p-3 text-sm">{session.reviewNotes}</p>
          </div>
        )}

        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
          <Button asChild>
            <Link to="/revision">Back to queue</Link>
          </Button>
        </div>
      </div>
    </Modal>
  );
}
