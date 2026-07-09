import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface WorkspaceSectionProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  id?: string;
}

/** A titled block within the Topic Workspace — consistent spacing & heading. */
export function WorkspaceSection({
  title,
  description,
  icon,
  action,
  children,
  className,
  id,
}: WorkspaceSectionProps) {
  return (
    <section id={id} className={cn('scroll-mt-24 space-y-4', className)}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          {icon && <span className="text-primary">{icon}</span>}
          <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        </div>
        {action}
      </div>
      {description && <p className="-mt-2 text-sm text-muted-foreground">{description}</p>}
      {children}
    </section>
  );
}
