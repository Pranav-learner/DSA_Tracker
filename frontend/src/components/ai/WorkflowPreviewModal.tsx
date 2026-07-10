import { Clock, Layers, Play, Sparkles } from 'lucide-react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/ui/button';
import { WorkflowStepCard } from './WorkflowStepCard';
import type { Workflow } from '@/types';

interface WorkflowPreviewModalProps {
  workflow: Workflow | null;
  open: boolean;
  onClose: () => void;
  onStart: () => void;
  starting?: boolean;
}

/**
 * WorkflowPreviewModal — the full plan for a workflow before the learner commits:
 * every suggested step with its module, estimate and deep link. Starting saves the
 * workflow; the learner still drives each step manually.
 */
export function WorkflowPreviewModal({ workflow, open, onClose, onStart, starting }: WorkflowPreviewModalProps) {
  return (
    <Modal open={open} onClose={onClose} title={workflow?.name ?? 'Workflow'} description={workflow?.description} className="max-w-xl">
      {workflow && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1"><Clock className="size-3.5" /> ~{workflow.estimatedMinutes} min</span>
            <span className="inline-flex items-center gap-1"><Layers className="size-3.5" /> {workflow.steps.length} steps</span>
            <span className="capitalize">{workflow.difficulty}</span>
          </div>

          <div className="space-y-2">
            {workflow.steps.map((s) => (
              <WorkflowStepCard key={s.id} step={s} />
            ))}
          </div>

          <p className="flex items-start gap-1.5 rounded-lg border border-primary/20 bg-primary/[0.05] p-2.5 text-xs text-muted-foreground">
            <Sparkles className="mt-0.5 size-3.5 shrink-0 text-primary" />
            <span><span className="font-medium text-foreground">Expected outcome:</span> {workflow.expectedOutcome}</span>
          </p>

          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={onClose}>Close</Button>
            <Button size="sm" onClick={onStart} disabled={starting}>
              <Play className="size-4" /> {starting ? 'Starting…' : 'Start workflow'}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
