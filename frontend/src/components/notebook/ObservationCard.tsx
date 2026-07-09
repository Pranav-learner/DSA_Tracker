import type { ReactNode } from 'react';
import { CardContainer } from '@/components/common/CardContainer';

interface ObservationCardProps {
  title: string;
  icon: ReactNode;
  content: string;
  emptyText?: string;
}

/**
 * Generic prose section (Observation, Core Algorithm, Lessons Learned, Personal
 * Notes). Preserves line breaks for a markdown-friendly feel.
 */
export function ObservationCard({ title, icon, content, emptyText = 'Not documented yet.' }: ObservationCardProps) {
  return (
    <CardContainer className="space-y-2">
      <div className="flex items-center gap-2 text-primary">
        {icon}
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{title}</h3>
      </div>
      {content.trim() ? (
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">{content}</p>
      ) : (
        <p className="text-sm italic text-muted-foreground">{emptyText}</p>
      )}
    </CardContainer>
  );
}
