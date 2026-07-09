import { NotebookPen, Lock } from 'lucide-react';
import { CardContainer } from '@/components/common/CardContainer';
import { Badge } from '@/components/ui/badge';

const SECTIONS = ['Future Notes', 'Observations', 'Mistakes', 'Lessons Learned'];

/** Placeholder notebook card. Editing arrives in a later sprint. */
export function NotebookCard() {
  return (
    <CardContainer className="space-y-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-lg border border-border bg-accent text-primary">
            <NotebookPen className="size-5" />
          </span>
          <div>
            <h3 className="font-semibold">Notebook</h3>
            <p className="text-sm text-muted-foreground">Your notes for this topic</p>
          </div>
        </div>
        <Badge variant="outline">
          <Lock className="size-3" /> Not started
        </Badge>
      </div>

      <ul className="space-y-2">
        {SECTIONS.map((section) => (
          <li
            key={section}
            className="flex items-center justify-between rounded-md border border-dashed border-border bg-accent/20 px-3 py-2 text-sm text-muted-foreground"
          >
            {section}
            <span className="text-xs text-muted-foreground/60">empty</span>
          </li>
        ))}
      </ul>

      <p className="text-xs text-muted-foreground">Note editing becomes available in a later sprint.</p>
    </CardContainer>
  );
}
