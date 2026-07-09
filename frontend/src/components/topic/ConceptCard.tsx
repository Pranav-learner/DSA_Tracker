import type { ReactNode } from 'react';
import {
  Lightbulb,
  CheckCircle2,
  XCircle,
  Timer,
  Database,
  ThumbsUp,
  AlertTriangle,
  Boxes,
  BookOpen,
} from 'lucide-react';
import { CardContainer } from '@/components/common/CardContainer';
import type { Concept } from '@/types';

/** Renders the full conceptual study material for a topic (read-only). */
export function ConceptCard({ concept }: { concept: Concept }) {
  return (
    <div className="space-y-4">
      {/* Core idea — the hero statement */}
      <CardContainer className="border-primary/20 bg-primary/[0.04]">
        <Block icon={<Lightbulb className="size-4" />} title="Core Idea">
          <p className="text-sm leading-relaxed text-foreground/90">{concept.coreIdea}</p>
        </Block>
      </CardContainer>

      {/* When to use / not use */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <CardContainer>
          <Block icon={<CheckCircle2 className="size-4 text-success" />} title="When to Use">
            <p className="text-sm leading-relaxed text-muted-foreground">{concept.whenToUse}</p>
          </Block>
        </CardContainer>
        <CardContainer>
          <Block icon={<XCircle className="size-4 text-danger" />} title="When NOT to Use">
            <p className="text-sm leading-relaxed text-muted-foreground">{concept.whenNotToUse}</p>
          </Block>
        </CardContainer>
      </div>

      {/* Complexity summary */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <CardContainer className="flex items-start gap-3">
          <span className="mt-0.5 flex size-9 items-center justify-center rounded-lg border border-border bg-accent text-primary">
            <Timer className="size-4" />
          </span>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Time Complexity
            </p>
            <p className="mt-0.5 font-mono text-sm text-foreground/90">{concept.timeComplexity}</p>
          </div>
        </CardContainer>
        <CardContainer className="flex items-start gap-3">
          <span className="mt-0.5 flex size-9 items-center justify-center rounded-lg border border-border bg-accent text-primary">
            <Database className="size-4" />
          </span>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Space Complexity
            </p>
            <p className="mt-0.5 font-mono text-sm text-foreground/90">{concept.spaceComplexity}</p>
          </div>
        </CardContainer>
      </div>

      {/* Advantages / limitations / applications */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <CardContainer>
          <Block icon={<ThumbsUp className="size-4 text-success" />} title="Advantages">
            <BulletList items={concept.advantages} marker="success" />
          </Block>
        </CardContainer>
        <CardContainer>
          <Block icon={<AlertTriangle className="size-4 text-warning" />} title="Limitations">
            <BulletList items={concept.limitations} marker="warning" />
          </Block>
        </CardContainer>
        <CardContainer>
          <Block icon={<Boxes className="size-4 text-primary" />} title="Applications">
            <BulletList items={concept.applications} marker="primary" />
          </Block>
        </CardContainer>
      </div>

      {/* Worked examples */}
      {concept.examples.length > 0 && (
        <CardContainer>
          <Block icon={<BookOpen className="size-4" />} title="Examples">
            <div className="space-y-3">
              {concept.examples.map((ex, i) => (
                <div key={i} className="rounded-md border border-border bg-accent/30 p-3">
                  <p className="text-sm font-medium">{ex.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{ex.detail}</p>
                </div>
              ))}
            </div>
          </Block>
        </CardContainer>
      )}
    </div>
  );
}

function Block({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        {icon}
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function BulletList({
  items,
  marker,
}: {
  items: string[];
  marker: 'success' | 'warning' | 'primary';
}) {
  const dot = { success: 'bg-success', warning: 'bg-warning', primary: 'bg-primary' }[marker];
  return (
    <ul className="space-y-1.5">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2 text-sm text-muted-foreground">
          <span className={`mt-1.5 size-1.5 shrink-0 rounded-full ${dot}`} />
          {item}
        </li>
      ))}
    </ul>
  );
}
