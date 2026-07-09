import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface DashboardSectionProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  id?: string;
}

/**
 * A titled block on the dashboard — compact header (icon + title + optional
 * action) over its content. Lighter than the page-level SectionHeader; used to
 * separate the dashboard's stacked sections.
 */
export function DashboardSection({
  title,
  description,
  icon,
  action,
  children,
  className,
  id,
}: DashboardSectionProps) {
  return (
    <section id={id} className={cn('scroll-mt-24 space-y-4', className)}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          {icon && (
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-border bg-accent text-primary">
              {icon}
            </span>
          )}
          <div>
            <h2 className="text-base font-semibold tracking-tight">{title}</h2>
            {description && <p className="text-xs text-muted-foreground">{description}</p>}
          </div>
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      {children}
    </section>
  );
}
