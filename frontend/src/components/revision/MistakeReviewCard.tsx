import { AlertTriangle } from 'lucide-react';
import { RevisionPanel } from './RevisionPanel';

/** Common mistakes for this topic/entry — a collapsible bullet list. */
export function MistakeReviewCard({ mistakes }: { mistakes: string[] }) {
  return (
    <RevisionPanel title="Common Mistakes" icon={<AlertTriangle className="size-4" />} panelKey="mistakes">
      {mistakes.length > 0 ? (
        <ul className="space-y-1.5">
          {mistakes.map((m, i) => (
            <li key={i} className="flex gap-2 text-sm leading-relaxed text-foreground/90">
              <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-warning" />
              {m}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm italic text-muted-foreground">No mistakes recorded — add them as you review.</p>
      )}
    </RevisionPanel>
  );
}
