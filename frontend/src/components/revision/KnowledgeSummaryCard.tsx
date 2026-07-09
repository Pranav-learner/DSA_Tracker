import type { ReactNode } from 'react';
import { RevisionPanel } from './RevisionPanel';

interface KnowledgeSummaryCardProps {
  title: string;
  icon: ReactNode;
  content: string;
  panelKey: string;
  emptyText?: string;
}

/** A collapsible prose section (Core Idea, When To Use, Knowledge Notes…). */
export function KnowledgeSummaryCard({ title, icon, content, panelKey, emptyText = 'Not documented.' }: KnowledgeSummaryCardProps) {
  return (
    <RevisionPanel title={title} icon={icon} panelKey={panelKey}>
      {content.trim() ? (
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">{content}</p>
      ) : (
        <p className="text-sm italic text-muted-foreground">{emptyText}</p>
      )}
    </RevisionPanel>
  );
}
