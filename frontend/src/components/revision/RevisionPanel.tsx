import type { ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { CardContainer } from '@/components/common/CardContainer';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { togglePanel } from '@/store/slices/revisionSlice';
import { cn } from '@/lib/utils';

interface RevisionPanelProps {
  title: string;
  icon: ReactNode;
  /** Stable key for the collapsed-panels UI state. */
  panelKey: string;
  tone?: 'default' | 'danger';
  children: ReactNode;
}

/**
 * A collapsible workspace section. Collapse state lives in the revision slice
 * (focus-mode friendly) so panels stay closed as the learner scrolls the review.
 */
export function RevisionPanel({ title, icon, panelKey, tone = 'default', children }: RevisionPanelProps) {
  const dispatch = useAppDispatch();
  const collapsed = useAppSelector((s) => s.revision.collapsedPanels.includes(panelKey));

  return (
    <CardContainer className={cn('space-y-3', tone === 'danger' && 'border-danger/30 bg-danger/[0.03]')}>
      <button
        type="button"
        onClick={() => dispatch(togglePanel(panelKey))}
        aria-expanded={!collapsed}
        className="flex w-full items-center justify-between gap-2"
      >
        <span className={cn('flex items-center gap-2', tone === 'danger' ? 'text-danger' : 'text-primary')}>
          {icon}
          <span className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{title}</span>
        </span>
        <ChevronDown className={cn('size-4 text-muted-foreground transition-transform', collapsed && '-rotate-90')} />
      </button>
      {!collapsed && children}
    </CardContainer>
  );
}
