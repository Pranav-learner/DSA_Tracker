import { useNavigate } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { timelineIcon } from '@/lib/coachIcons';
import { relativeTime, cn } from '@/lib/utils';
import type { TimelineEntry } from '@/types';

interface MentorInsightCardProps {
  entry: TimelineEntry;
  className?: string;
}

const TYPE_LABEL: Record<string, string> = {
  recommendation: 'Recommendation',
  'coaching-session': 'Coaching',
  workflow: 'Workflow',
  milestone: 'Milestone',
};

/**
 * MentorInsightCard — a single entry on the AI timeline (a recommendation,
 * coaching session, generated workflow or learning milestone). Deep-links to the
 * underlying artefact when one exists.
 */
export function MentorInsightCard({ entry, className }: MentorInsightCardProps) {
  const navigate = useNavigate();
  const Icon = timelineIcon(entry.icon);
  const clickable = Boolean(entry.to);

  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-lg border border-border bg-card/60 p-3 transition-colors',
        clickable && 'cursor-pointer hover:border-primary/40',
        className,
      )}
      onClick={() => entry.to && navigate(entry.to)}
      role={clickable ? 'button' : undefined}
    >
      <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/12 text-primary">
        <Icon className="size-3.5" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="rounded-full bg-accent px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider text-muted-foreground">
            {TYPE_LABEL[entry.type] ?? entry.type}
          </span>
          <p className="truncate text-sm font-medium">{entry.title}</p>
          {clickable && <ArrowUpRight className="ml-auto size-3.5 shrink-0 text-muted-foreground" />}
        </div>
        <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{entry.description}</p>
        <div className="mt-1 flex items-center gap-2 text-[10px] text-muted-foreground">
          <span>{relativeTime(entry.at)}</span>
          {entry.status && <span className="capitalize text-primary/80">· {entry.status}</span>}
        </div>
      </div>
    </div>
  );
}
