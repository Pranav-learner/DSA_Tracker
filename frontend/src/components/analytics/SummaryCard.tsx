import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { CardContainer } from '@/components/common/CardContainer';
import { cn } from '@/lib/utils';

interface SummaryCardProps {
  title: string;
  icon?: ReactNode;
  to?: string;
  toLabel?: string;
  children: ReactNode;
  className?: string;
}

/** A titled summary surface grouping related metrics, with an optional deep-link. */
export function SummaryCard({ title, icon, to, toLabel = 'View', children, className }: SummaryCardProps) {
  return (
    <CardContainer className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between gap-2">
        <h3 className="inline-flex items-center gap-2 text-sm font-semibold">
          {icon && <span className="text-primary">{icon}</span>}
          {title}
        </h3>
        {to && (
          <Link to={to} className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
            {toLabel} <ArrowRight className="size-3" />
          </Link>
        )}
      </div>
      {children}
    </CardContainer>
  );
}
