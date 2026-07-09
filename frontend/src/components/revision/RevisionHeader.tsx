import { Link } from 'react-router-dom';
import { ArrowLeft, Clock, LayoutList, Zap } from 'lucide-react';
import { CardContainer } from '@/components/common/CardContainer';
import { ScheduleChip } from './ScheduleChip';
import { SessionStatusBadge } from './SessionStatusBadge';
import { PriorityBadge } from './PriorityBadge';
import { formatMinutes } from '@/lib/revision';
import { cn } from '@/lib/utils';
import type { RevisionContent, RevisionSchedule, RevisionSession } from '@/types';
import type { WorkspaceMode } from '@/store/slices/revisionSlice';

interface RevisionHeaderProps {
  content: RevisionContent;
  schedule: RevisionSchedule | null;
  session: RevisionSession | null;
  mode: WorkspaceMode;
  onModeChange: (mode: WorkspaceMode) => void;
}

/** Workspace header — identity, status, and the Full ↔ Quick mode toggle. */
export function RevisionHeader({ content, schedule, session, mode, onModeChange }: RevisionHeaderProps) {
  return (
    <CardContainer className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 space-y-2">
          <Link to="/revision" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-3.5" /> Revision hub
          </Link>
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">{content.title}</h1>
          <div className="flex flex-wrap items-center gap-2">
            <ScheduleChip entityType={content.entityType} />
            {content.pattern && (
              <span className="text-xs text-muted-foreground">Pattern · {content.pattern}</span>
            )}
            {session && <SessionStatusBadge status={session.sessionStatus} />}
            {schedule && !session && <PriorityBadge urgency={schedule.urgency} />}
          </div>
        </div>

        <div className="flex shrink-0 rounded-md border border-border p-0.5">
          <ModeButton active={mode === 'full'} onClick={() => onModeChange('full')} label="Full review">
            <LayoutList className="size-4" />
          </ModeButton>
          <ModeButton active={mode === 'quick'} onClick={() => onModeChange('quick')} label="Quick review">
            <Zap className="size-4" />
          </ModeButton>
        </div>
      </div>

      <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
        <Clock className="size-3.5" /> Estimated review ~{formatMinutes(content.estimatedReviewMinutes)}
      </p>
    </CardContainer>
  );
}

function ModeButton({
  active,
  onClick,
  label,
  children,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      className={cn(
        'flex h-8 items-center gap-1.5 rounded px-2.5 text-xs font-medium transition-colors',
        active ? 'bg-accent text-foreground' : 'text-muted-foreground hover:text-foreground',
      )}
    >
      {children}
    </button>
  );
}
