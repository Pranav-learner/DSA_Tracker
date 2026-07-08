import type { ReactNode } from 'react';
import { CardContainer } from './CardContainer';

interface StatCardProps {
  label: string;
  value: ReactNode;
  hint?: string;
  icon?: ReactNode;
}

/** Small metric tile used on the dashboard and roadmap summary strip. */
export function StatCard({ label, value, hint, icon }: StatCardProps) {
  return (
    <CardContainer className="flex items-center gap-4">
      {icon && (
        <div className="flex size-11 shrink-0 items-center justify-center rounded-lg border border-border bg-accent text-primary">
          {icon}
        </div>
      )}
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="mt-0.5 truncate text-xl font-semibold tabular-nums">{value}</p>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
    </CardContainer>
  );
}
