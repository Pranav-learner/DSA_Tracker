import { Hash } from 'lucide-react';
import { RevisionPanel } from './RevisionPanel';
import { KeywordChip } from '@/components/notebook';

/** Recognition keywords for fast pattern-recall — reuses the shared KeywordChip. */
export function RecognitionKeywordPanel({ keywords }: { keywords: string[] }) {
  return (
    <RevisionPanel title="Recognition Keywords" icon={<Hash className="size-4" />} panelKey="keywords">
      {keywords.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {keywords.map((kw) => (
            <KeywordChip key={kw} label={kw} />
          ))}
        </div>
      ) : (
        <p className="text-sm italic text-muted-foreground">No keywords yet.</p>
      )}
    </RevisionPanel>
  );
}
