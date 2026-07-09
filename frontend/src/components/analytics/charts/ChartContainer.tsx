import type { ReactNode } from 'react';
import { CardContainer } from '@/components/common/CardContainer';
import { EmptyChartState } from './EmptyChartState';
import { LoadingChartSkeleton } from './LoadingChartSkeleton';
import { cn } from '@/lib/utils';

interface ChartContainerProps {
  title?: string;
  subtitle?: string;
  icon?: ReactNode;
  action?: ReactNode;
  /** Show the loading skeleton instead of the body. */
  loading?: boolean;
  /** Show the empty state instead of the body. */
  empty?: boolean;
  emptyMessage?: string;
  height?: number;
  footer?: ReactNode;
  children: ReactNode;
  className?: string;
}

/**
 * ChartContainer — the shared frame around every chart: header (icon · title ·
 * action), a fixed-height body that swaps in loading / empty states, and an
 * optional footer (legend, hint). Keeps all charts visually consistent.
 */
export function ChartContainer({
  title,
  subtitle,
  icon,
  action,
  loading = false,
  empty = false,
  emptyMessage,
  height = 240,
  footer,
  children,
  className,
}: ChartContainerProps) {
  return (
    <CardContainer className={cn('flex flex-col gap-4', className)}>
      {(title || action) && (
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            {title && (
              <h3 className="inline-flex items-center gap-2 text-sm font-semibold">
                {icon && <span className="text-primary">{icon}</span>}
                {title}
              </h3>
            )}
            {subtitle && <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}

      {loading ? (
        <LoadingChartSkeleton height={height} />
      ) : empty ? (
        <EmptyChartState height={height} message={emptyMessage} />
      ) : (
        <div style={{ height }}>{children}</div>
      )}

      {!loading && !empty && footer && <div className="border-t border-border/60 pt-3">{footer}</div>}
    </CardContainer>
  );
}
