import { GraduationCap, CalendarClock, Swords, BarChart3, NotebookPen, Zap, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { QuickAction } from '@/types';

interface QuickActionPanelProps {
  actions: QuickAction[];
  /** Fired with the slash command for the tapped action. */
  onAction: (command: string) => void;
  className?: string;
  layout?: 'grid' | 'list';
}

/** Icon per quick-action command (falls back to a generic bolt). */
const ACTION_ICON: Record<string, LucideIcon> = {
  study: GraduationCap,
  revision: CalendarClock,
  contest: Swords,
  analytics: BarChart3,
  notebook: NotebookPen,
};

/**
 * QuickActionPanel — the "Learning Quick Actions" row: a curated set of slash
 * commands surfaced as buttons. Tapping one starts a mentor turn with the right
 * context profile preselected.
 */
export function QuickActionPanel({ actions, onAction, className, layout = 'grid' }: QuickActionPanelProps) {
  return (
    <div className={cn(layout === 'grid' ? 'grid grid-cols-2 gap-2' : 'flex flex-wrap gap-2', className)}>
      {actions.map((a) => {
        const Icon = ACTION_ICON[a.command] ?? Zap;
        return (
          <button
            key={a.command}
            type="button"
            onClick={() => onAction(a.command)}
            className="group flex items-center gap-2 rounded-lg border border-border bg-card/60 px-3 py-2 text-left text-xs font-medium transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:text-primary hover:shadow-glow"
          >
            <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-primary/12 text-primary transition-colors group-hover:bg-primary/20">
              <Icon className="size-3.5" />
            </span>
            <span className="min-w-0 truncate">{a.label}</span>
          </button>
        );
      })}
    </div>
  );
}
