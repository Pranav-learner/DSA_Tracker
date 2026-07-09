import { Play, Pause, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface RevisionSessionControlsProps {
  active: boolean;
  running: boolean;
  busy?: boolean;
  /** A session is active for a DIFFERENT entity — starting is blocked. */
  blocked?: boolean;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onComplete: () => void;
  onAbandon: () => void;
}

/** Start · Pause · Resume · Complete · Abandon controls for a review session. */
export function RevisionSessionControls({
  active,
  running,
  busy,
  blocked,
  onStart,
  onPause,
  onResume,
  onComplete,
  onAbandon,
}: RevisionSessionControlsProps) {
  if (!active) {
    return (
      <Button onClick={onStart} disabled={busy || blocked} title={blocked ? 'Finish your active session first' : undefined}>
        <Play className="size-4" /> Start Review
      </Button>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {running ? (
        <Button variant="secondary" size="sm" onClick={onPause} disabled={busy}>
          <Pause className="size-4" /> Pause
        </Button>
      ) : (
        <Button variant="secondary" size="sm" onClick={onResume} disabled={busy}>
          <Play className="size-4" /> Resume
        </Button>
      )}
      <Button size="sm" onClick={onComplete} disabled={busy}>
        <CheckCircle2 className="size-4" /> Complete
      </Button>
      <Button variant="ghost" size="sm" onClick={onAbandon} disabled={busy} className="text-danger hover:text-danger">
        <XCircle className="size-4" /> Abandon
      </Button>
    </div>
  );
}
