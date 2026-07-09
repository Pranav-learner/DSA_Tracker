import { useNavigate } from 'react-router-dom';
import { Network, ChevronRight } from 'lucide-react';
import { CardContainer } from '@/components/common/CardContainer';
import { Badge } from '@/components/ui/badge';
import { masteryTextClass } from '@/lib/mastery';
import { cn } from '@/lib/utils';
import type { NotebookRef } from '@/types';

/**
 * Knowledge links — related notebook entries (the "second brain" graph edges).
 * Each row opens the linked entry. Backs the future Knowledge Graph (Module 4).
 */
export function KnowledgeLinkCard({ entries }: { entries: NotebookRef[] }) {
  const navigate = useNavigate();

  return (
    <CardContainer className="space-y-3">
      <div className="flex items-center gap-2 text-primary">
        <Network className="size-4" />
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Knowledge Links
        </h3>
      </div>

      {entries.length === 0 ? (
        <p className="text-sm italic text-muted-foreground">No linked entries yet.</p>
      ) : (
        <ul className="space-y-1.5">
          {entries.map((entry) => (
            <li key={entry.id}>
              <button
                type="button"
                onClick={() => navigate(`/notebook/${entry.id}`)}
                className="group flex w-full items-center gap-3 rounded-lg border border-border bg-card/40 px-3 py-2.5 text-left transition-colors hover:border-primary/40 hover:bg-accent/40"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{entry.title}</p>
                  <p className="truncate text-xs text-muted-foreground">{entry.pattern}</p>
                </div>
                <Badge variant="outline" className={cn('shrink-0', masteryTextClass(entry.confidence))}>
                  {entry.confidence}%
                </Badge>
                <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </CardContainer>
  );
}
