import { Layers } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AiIntent } from '@/types';

interface ContextBadgeProps {
  intent: AiIntent;
  sections: { key: string; title: string }[];
  className?: string;
}

const INTENT_LABEL: Record<AiIntent, string> = {
  general: 'General',
  'study-plan': 'Study Plan',
  contest: 'Contest',
  revision: 'Revision',
  notebook: 'Notebook',
  pattern: 'Pattern',
  interview: 'Interview',
  analytics: 'Analytics',
  unknown: 'General',
};

/**
 * ContextBadge — shows which learner-context the mentor used for a turn: the
 * detected intent and the number of context sections, with the section titles in
 * a tooltip. Makes the "context-aware" nature of the assistant visible.
 */
export function ContextBadge({ intent, sections, className }: ContextBadgeProps) {
  const titles = sections.map((s) => s.title).join(', ');
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary',
        className,
      )}
      title={sections.length ? `Context: ${titles}` : 'No learner context'}
    >
      <Layers className="size-3" />
      {INTENT_LABEL[intent]}
      {sections.length > 0 && <span className="text-primary/70">· {sections.length} ctx</span>}
    </span>
  );
}
