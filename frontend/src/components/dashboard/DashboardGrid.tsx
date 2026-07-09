import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface DashboardGridProps {
  children: ReactNode;
  /** Target columns at the widest breakpoint (always 1 column on mobile). */
  cols?: 2 | 3 | 4;
  className?: string;
}

const COLS: Record<NonNullable<DashboardGridProps['cols']>, string> = {
  2: 'sm:grid-cols-2',
  3: 'sm:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-2 lg:grid-cols-4',
};

/** Responsive dashboard grid — consistent gap + mobile-first column collapse. */
export function DashboardGrid({ children, cols = 3, className }: DashboardGridProps) {
  return <div className={cn('grid grid-cols-1 gap-4', COLS[cols], className)}>{children}</div>;
}
