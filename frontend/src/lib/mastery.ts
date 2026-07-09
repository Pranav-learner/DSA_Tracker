import type { LadderStage, MasteryMetric, TopicProgressStatus, PhaseStatus } from '@/types';
import type { BadgeProps } from '@/components/ui/badge';

export const STAGE_LABELS: Record<LadderStage, string> = {
  recognition: 'Recognition',
  implementation: 'Implementation',
  standard: 'Standard',
  variant: 'Variant',
  mixed: 'Mixed',
  contest: 'Contest',
};

export const METRIC_LABELS: Record<MasteryMetric, string> = {
  recognition: 'Recognition',
  implementation: 'Implementation',
  standard: 'Standard Problems',
  variant: 'Variant Problems',
  mixed: 'Mixed Problems',
  contest: 'Contest Readiness',
  assessment: 'Assessment',
  confidence: 'Confidence',
};

export type MasteryTone = 'muted' | 'warning' | 'primary' | 'success';

/** Bucket a 0–100 mastery value into a visual tone. */
export function masteryTone(value: number): MasteryTone {
  if (value >= 90) return 'success';
  if (value >= 70) return 'primary';
  if (value >= 40) return 'warning';
  return 'muted';
}

const STROKE: Record<MasteryTone, string> = {
  success: 'hsl(var(--success))',
  primary: 'hsl(var(--primary))',
  warning: 'hsl(var(--warning))',
  muted: 'hsl(var(--muted-foreground))',
};

/** SVG stroke / CSS colour for a mastery value. */
export function masteryColor(value: number): string {
  return STROKE[masteryTone(value)];
}

const TEXT: Record<MasteryTone, string> = {
  success: 'text-success',
  primary: 'text-primary',
  warning: 'text-warning',
  muted: 'text-muted-foreground',
};

export function masteryTextClass(value: number): string {
  return TEXT[masteryTone(value)];
}

/** Badge variant for a topic status. */
export function statusVariant(status: TopicProgressStatus): NonNullable<BadgeProps['variant']> {
  switch (status) {
    case 'Mastered':
      return 'success';
    case 'Completed':
      return 'primary';
    case 'In Progress':
      return 'warning';
    default:
      return 'outline';
  }
}

/** Badge variant for a phase status. */
export function phaseStatusVariant(status: PhaseStatus): NonNullable<BadgeProps['variant']> {
  switch (status) {
    case 'completed':
      return 'success';
    case 'in-progress':
      return 'primary';
    default:
      return 'outline';
  }
}
