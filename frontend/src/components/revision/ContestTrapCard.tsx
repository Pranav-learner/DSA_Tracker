import { Zap } from 'lucide-react';
import { RevisionPanel } from './RevisionPanel';

/** Contest traps / pitfalls (from the topic's limitations) — a danger-tinted list. */
export function ContestTrapCard({ traps }: { traps: string[] }) {
  return (
    <RevisionPanel title="Contest Traps" icon={<Zap className="size-4" />} panelKey="traps" tone="danger">
      {traps.length > 0 ? (
        <ul className="space-y-1.5">
          {traps.map((t, i) => (
            <li key={i} className="flex gap-2 text-sm leading-relaxed text-foreground/90">
              <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-danger" />
              {t}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm italic text-muted-foreground">No traps noted for this pattern.</p>
      )}
    </RevisionPanel>
  );
}
