import { Hash, ListTree, AlertTriangle, Clock, Gauge } from 'lucide-react';
import { CardContainer } from '@/components/common/CardContainer';
import { KeywordChip } from '@/components/notebook';
import { RepresentativeProblemCard } from './RepresentativeProblemCard';
import { formatMinutes } from '@/lib/revision';
import { masteryTextClass } from '@/lib/mastery';
import { cn } from '@/lib/utils';
import type { RevisionContent } from '@/types';

/**
 * Quick Review — a 2–3 minute refresh: recognition keywords, the core algorithm,
 * top mistakes, one representative problem, read-only confidence + est. time.
 */
export function QuickReviewCard({ content }: { content: RevisionContent }) {
  const problem = content.representativeProblems[0];
  const algorithm = content.coreAlgorithm || content.coreIdea;

  return (
    <CardContainer className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold tracking-tight">{content.title}</h2>
        <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
          <Clock className="size-4" /> ~{formatMinutes(content.estimatedReviewMinutes)}
        </span>
      </div>

      <Section icon={<Hash className="size-4" />} label="Recognition Keywords">
        {content.recognitionKeywords.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {content.recognitionKeywords.map((k) => (
              <KeywordChip key={k} label={k} />
            ))}
          </div>
        ) : (
          <Empty />
        )}
      </Section>

      <Section icon={<ListTree className="size-4" />} label="Core Algorithm">
        {algorithm.trim() ? (
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">{algorithm}</p>
        ) : (
          <Empty />
        )}
      </Section>

      <Section icon={<AlertTriangle className="size-4" />} label="Common Mistakes">
        {content.commonMistakes.length > 0 ? (
          <ul className="space-y-1.5">
            {content.commonMistakes.slice(0, 3).map((m, i) => (
              <li key={i} className="flex gap-2 text-sm text-foreground/90">
                <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-warning" /> {m}
              </li>
            ))}
          </ul>
        ) : (
          <Empty />
        )}
      </Section>

      {problem && (
        <Section icon={<ListTree className="size-4" />} label="Representative Problem">
          <RepresentativeProblemCard problem={problem} />
        </Section>
      )}

      {content.confidence != null && (
        <div className="flex items-center gap-2 border-t border-border pt-3 text-sm">
          <Gauge className="size-4 text-muted-foreground" />
          <span className="text-muted-foreground">Confidence</span>
          <span className={cn('ml-auto font-semibold tabular-nums', masteryTextClass(content.confidence))}>
            {content.confidence}%
          </span>
        </div>
      )}
    </CardContainer>
  );
}

function Section({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-primary">
        {icon}
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</h3>
      </div>
      {children}
    </div>
  );
}

function Empty() {
  return <p className="text-sm italic text-muted-foreground">Not documented.</p>;
}
