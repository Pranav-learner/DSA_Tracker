import type { BadgeProps } from '@/components/ui/badge';
import type { AnalyticsTone } from '@/lib/analytics';
import type {
  CompetitiveActionType,
  CompetitiveInsightType,
  CorrelationDirection,
  ReadinessStatus,
} from '@/types';

export const READINESS_STATUS_META: Record<ReadinessStatus, { label: string; tone: AnalyticsTone; badge: NonNullable<BadgeProps['variant']> }> = {
  ready: { label: 'Contest-ready', tone: 'success', badge: 'success' },
  developing: { label: 'Developing', tone: 'primary', badge: 'primary' },
  early: { label: 'Building up', tone: 'warning', badge: 'warning' },
  'not-ready': { label: 'Not ready', tone: 'danger', badge: 'danger' },
};

export const CORRELATION_META: Record<CorrelationDirection, { label: string; tone: AnalyticsTone; badge: NonNullable<BadgeProps['variant']> }> = {
  positive: { label: 'Aligned', tone: 'success', badge: 'success' },
  negative: { label: 'Diverging', tone: 'danger', badge: 'danger' },
  neutral: { label: 'Unclear', tone: 'default', badge: 'outline' },
};

export const INSIGHT_TYPE_META: Record<CompetitiveInsightType, { tone: AnalyticsTone }> = {
  strength: { tone: 'success' },
  improvement: { tone: 'success' },
  opportunity: { tone: 'primary' },
  focus: { tone: 'warning' },
  weakness: { tone: 'warning' },
  warning: { tone: 'danger' },
};

/** Route-action label per competitive recommendation action. */
export const ACTION_LABEL: Record<CompetitiveActionType, string> = {
  'practice-contest': 'Log a contest',
  'virtual-contest': 'Log a virtual contest',
  upsolve: 'Open upsolve queue',
  'revise-patterns': 'Start revision',
  'strengthen-topic': 'Open topic',
  'improve-speed': 'Practice problems',
};

export function ratingTrendTone(trend: 'rising' | 'falling' | 'stable'): AnalyticsTone {
  return trend === 'rising' ? 'success' : trend === 'falling' ? 'danger' : 'default';
}
