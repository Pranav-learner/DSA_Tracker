import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface AnalyticsGridProps {
  children: ReactNode;
  cols?: 2 | 3 | 4;
  className?: string;
}

const COLS: Record<NonNullable<AnalyticsGridProps['cols']>, string> = {
  2: 'sm:grid-cols-2',
  3: 'sm:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-2 lg:grid-cols-4',
};

/** Responsive analytics grid — mobile-first column collapse with a consistent gap. */
export function AnalyticsGrid({ children, cols = 4, className }: AnalyticsGridProps) {
  return <div className={cn('grid grid-cols-1 gap-4', COLS[cols], className)}>{children}</div>;
}
