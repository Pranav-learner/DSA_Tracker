import { AlertTriangle, AlertCircle, Info } from 'lucide-react';
import { SEVERITY_META } from '@/lib/intelligence';
import { ANALYTICS_TONE_TEXT } from '@/lib/analytics';
import { cn } from '@/lib/utils';
import type { Severity } from '@/types';

const ICON = { high: AlertTriangle, medium: AlertCircle, low: Info } as const;

/** A severity dot + label — the visual weight of a weakness signal. */
export function SeverityIndicator({ severity, showLabel = true, className }: { severity: Severity; showLabel?: boolean; className?: string }) {
  const meta = SEVERITY_META[severity];
  const Ico = ICON[severity];
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-xs font-medium', ANALYTICS_TONE_TEXT[meta.tone], className)}>
      <Ico className="size-3.5" />
      {showLabel && meta.label}
    </span>
  );
}
