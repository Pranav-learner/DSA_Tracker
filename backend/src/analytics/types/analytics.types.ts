import type { AnalyticsRangePreset } from '../../config/analytics.js';
import type { ProgressDTO } from '../../services/learning.dto.js';

/**
 * Analytics domain types. The `analytics/` module is self-contained: it consumes
 * other modules' *services/repositories* but owns its own types, DTOs and
 * aggregation. No business logic from other modules lives here.
 */

/** A resolved, validated time window applied to time-based analytics. */
export interface AnalyticsWindow {
  /** Inclusive lower bound, or null for "all time". */
  from: Date | null;
  /** Exclusive-ish upper bound (defaults to "now"). */
  to: Date;
  /** Human label for metadata (e.g. '30d', 'custom'). */
  label: AnalyticsRangePreset | 'custom';
  /** Whole days in the window, or null for all-time. */
  days: number | null;
}

/** The six analytics scopes + the combined overview. */
export const ANALYTICS_SCOPES = [
  'learning',
  'problems',
  'knowledge',
  'revision',
  'retention',
  'activity',
] as const;
export type AnalyticsScope = (typeof ANALYTICS_SCOPES)[number];

/**
 * Shared context threaded from the aggregation service into each analytics
 * service so a heavy read (the learning overview) happens once per request
 * instead of once per scope. Standalone endpoints omit it and each service
 * fetches what it needs.
 */
export interface AnalyticsContext {
  overview?: ProgressDTO;
}
