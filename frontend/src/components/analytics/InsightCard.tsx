import type { ReactNode } from 'react';
import { CardContainer } from '@/components/common/CardContainer';
import { ANALYTICS_TONE_TEXT, type AnalyticsTone } from '@/lib/analytics';
import { cn } from '@/lib/utils';

interface InsightCardProps {
  icon?: ReactNode;
  title: string;
  description: string;
  tone?: AnalyticsTone;
  className?: string;
}

/**
 * InsightCard — a highlighted takeaway (icon + title + one-liner). Sprint 1 uses
 * it for static reads; Sprint 2's insight engine will feed it generated copy.
 */
export function InsightCard({ icon, title, description, tone = 'primary', className }: InsightCardProps) {
  return (
    <CardContainer className={cn('flex items-start gap-3', className)}>
      {icon && (
        <span className={cn('mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg border border-border bg-accent', ANALYTICS_TONE_TEXT[tone])}>
          {icon}
        </span>
      )}
      <div className="space-y-0.5">
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </CardContainer>
  );
}
