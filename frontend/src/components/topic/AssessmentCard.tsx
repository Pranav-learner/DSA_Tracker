import { ClipboardCheck, Lock } from 'lucide-react';
import { CardContainer } from '@/components/common/CardContainer';
import { Badge } from '@/components/ui/badge';

interface AssessmentCardProps {
  /** Placeholder metadata — nothing is functional in Sprint 2. */
  questions?: number;
  estimatedMinutes?: number;
  passingScore?: number;
}

/** Placeholder assessment card. Real assessments arrive in a later sprint. */
export function AssessmentCard({
  questions = 10,
  estimatedMinutes = 30,
  passingScore = 80,
}: AssessmentCardProps) {
  return (
    <CardContainer className="space-y-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-lg border border-border bg-accent text-primary">
            <ClipboardCheck className="size-5" />
          </span>
          <div>
            <h3 className="font-semibold">Assessment</h3>
            <p className="text-sm text-muted-foreground">Checkpoint before advancing</p>
          </div>
        </div>
        <Badge variant="outline">
          <Lock className="size-3" /> Locked
        </Badge>
      </div>

      <dl className="grid grid-cols-3 gap-3">
        <Stat label="Questions" value={questions} />
        <Stat label="Est. Time" value={`${estimatedMinutes}m`} />
        <Stat label="Passing" value={`${passingScore}%`} />
      </dl>

      <p className="text-xs text-muted-foreground">
        Status: <span className="text-foreground/80">Not attempted</span> · assessments become
        available in a future sprint.
      </p>
    </CardContainer>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-md border border-border bg-accent/30 p-3 text-center">
      <p className="text-lg font-semibold tabular-nums leading-none">{value}</p>
      <p className="mt-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
    </div>
  );
}
