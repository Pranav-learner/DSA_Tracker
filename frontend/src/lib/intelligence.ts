import type { BadgeProps } from '@/components/ui/badge';
import type { AnalyticsTone } from '@/lib/analytics';
import type { ImpactLevel, PatternStatus, Priority, Severity, TrendDirection, InsightTone } from '@/types';

/** Severity → label + tone + badge variant. */
export const SEVERITY_META: Record<Severity, { label: string; tone: AnalyticsTone; badge: NonNullable<BadgeProps['variant']> }> = {
  high: { label: 'High', tone: 'danger', badge: 'danger' },
  medium: { label: 'Medium', tone: 'warning', badge: 'warning' },
  low: { label: 'Low', tone: 'default', badge: 'outline' },
};

/** Priority → label + badge (mirrors severity). */
export const PRIORITY_META: Record<Priority, { label: string; badge: NonNullable<BadgeProps['variant']> }> = {
  high: { label: 'High priority', badge: 'danger' },
  medium: { label: 'Medium', badge: 'warning' },
  low: { label: 'Low', badge: 'outline' },
};

/** Pattern status → label + tone + badge. */
export const PATTERN_STATUS_META: Record<PatternStatus, { label: string; tone: AnalyticsTone; badge: NonNullable<BadgeProps['variant']> }> = {
  strong: { label: 'Strong', tone: 'success', badge: 'success' },
  developing: { label: 'Developing', tone: 'primary', badge: 'primary' },
  'needs-work': { label: 'Needs work', tone: 'danger', badge: 'danger' },
};

/** Trend direction → label + tone. */
export const TREND_META: Record<TrendDirection, { label: string; tone: AnalyticsTone }> = {
  increasing: { label: 'Increasing', tone: 'success' },
  stable: { label: 'Stable', tone: 'default' },
  declining: { label: 'Declining', tone: 'danger' },
};

/** Insight tone → tone. */
export const INSIGHT_TONE: Record<InsightTone, AnalyticsTone> = {
  positive: 'success',
  negative: 'danger',
  neutral: 'primary',
};

/** Learning-impact → tone. */
export const IMPACT_TONE: Record<ImpactLevel, AnalyticsTone> = {
  high: 'success',
  medium: 'primary',
  low: 'default',
};

/** The eight Pattern Confidence Matrix dimensions, in display order. */
export const MATRIX_DIMENSIONS: { key: keyof import('@/types').PatternMatrix; label: string }[] = [
  { key: 'understanding', label: 'Understanding' },
  { key: 'recognition', label: 'Recognition' },
  { key: 'implementation', label: 'Implementation' },
  { key: 'optimization', label: 'Optimization' },
  { key: 'contestReadiness', label: 'Contest Ready' },
  { key: 'confidence', label: 'Confidence' },
  { key: 'retention', label: 'Retention' },
  { key: 'overallMastery', label: 'Overall Mastery' },
];
