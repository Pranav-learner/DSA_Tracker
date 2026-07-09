import { Link } from 'react-router-dom';
import { NotebookPen, Hash, BookOpen, Layers, ExternalLink, Pencil, Check } from 'lucide-react';
import { CardContainer } from '@/components/common/CardContainer';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PlatformBadge } from '@/components/problems';
import { masteryTextClass } from '@/lib/mastery';
import { cn } from '@/lib/utils';
import type { NotebookDetail } from '@/types';

interface NotebookHeaderProps {
  entry: NotebookDetail;
  editing?: boolean;
  onToggleEdit?: () => void;
  /** e.g. "Saved" / "Saving…" shown while editing. */
  saveStatus?: string;
}

/** Workspace header — identity, context links and the edit toggle. */
export function NotebookHeader({ entry, editing, onToggleEdit, saveStatus }: NotebookHeaderProps) {
  return (
    <CardContainer className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-border bg-accent text-primary">
            <NotebookPen className="size-6" />
          </span>
          <div className="min-w-0">
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">{entry.title}</h1>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
              <Hash className="size-3.5" /> {entry.pattern}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          {onToggleEdit && (
            <Button variant={editing ? 'primary' : 'secondary'} size="sm" onClick={onToggleEdit}>
              {editing ? <Check className="size-4" /> : <Pencil className="size-4" />}
              {editing ? 'Done' : 'Edit'}
            </Button>
          )}
          {editing && saveStatus && <span className="text-[11px] text-muted-foreground">{saveStatus}</span>}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <PlatformBadge platform={entry.platform} />
        <Badge variant="outline" className={cn('font-semibold', masteryTextClass(entry.confidence))}>
          {entry.confidence}% confident
        </Badge>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
        {entry.phase && (
          <span className="inline-flex items-center gap-1.5">
            <Layers className="size-3.5" /> Phase {entry.phase.order} · {entry.phase.title}
          </span>
        )}
        {entry.topic && (
          <Link to={`/topic/${entry.topic.id}`} className="inline-flex items-center gap-1.5 text-primary hover:underline">
            <BookOpen className="size-3.5" /> {entry.topic.title}
          </Link>
        )}
        <Link to={`/problems/${entry.problemId}`} className="inline-flex items-center gap-1.5 text-primary hover:underline">
          <ExternalLink className="size-3.5" /> Open problem
        </Link>
      </div>
    </CardContainer>
  );
}
