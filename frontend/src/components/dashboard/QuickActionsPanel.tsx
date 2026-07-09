import { Link } from 'react-router-dom';
import {
  Play,
  RotateCcw,
  RefreshCw,
  BookOpen,
  NotebookPen,
  CalendarClock,
  Brain,
  type LucideIcon,
} from 'lucide-react';
import { CardContainer } from '@/components/common/CardContainer';
import { cn } from '@/lib/utils';
import type { QuickAction, QuickActionKind } from '@/types';

const ICON: Record<QuickActionKind, LucideIcon> = {
  'continue-learning': Play,
  'resume-session': RotateCcw,
  'start-revision': RefreshCw,
  'open-topic': BookOpen,
  'view-notebook': NotebookPen,
  'view-calendar': CalendarClock,
  'view-retention': Brain,
};

/**
 * Quick Actions — one-tap entry points into existing routes. Each action's
 * target + availability comes from the backend; disabled actions are shown
 * dimmed (not hidden) so the layout stays stable.
 */
export function QuickActionsPanel({ actions }: { actions: QuickAction[] }) {
  return (
    <CardContainer className="space-y-2">
      <ul className="grid grid-cols-1 gap-2">
        {actions.map((action) => {
          const Ico = ICON[action.kind];
          const primary = action.primary && action.enabled;
          if (!action.enabled) {
            return (
              <li
                key={action.kind}
                aria-disabled
                className="flex cursor-not-allowed items-center gap-3 rounded-lg border border-border/50 px-3 py-2.5 text-sm text-muted-foreground/50"
              >
                <Ico className="size-4" /> {action.label}
              </li>
            );
          }
          return (
            <li key={action.kind}>
              <Link
                to={action.to}
                className={cn(
                  'flex items-center gap-3 rounded-lg border px-3 py-2.5 text-sm font-medium transition-all',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
                  primary
                    ? 'border-primary/40 bg-primary/15 text-primary hover:bg-primary/20'
                    : 'border-border/60 text-foreground hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-glow',
                )}
              >
                <Ico className="size-4" /> {action.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </CardContainer>
  );
}
