import type { RevisionEntityType } from '../types/domain.js';

/**
 * Central, configurable tuning for the Revision Engine. Intervals and estimates
 * live here (never hardcoded in services/strategies) so the whole schedule can be
 * retuned in one place, and future strategies (SM-2, AI) can read/override them.
 */

/** Default spaced-review intervals in days: 1 → 3 → 7 → 14 → 30 → 60 → 90. */
export const DEFAULT_REVISION_INTERVALS = [1, 3, 7, 14, 30, 60, 90] as const;

/** Starting ease factor (SM-2 style — reserved for future strategies). */
export const DEFAULT_EASE_FACTOR = 2.5;

/** Estimated minutes to review one item, by entity type. */
export const REVISION_ESTIMATED_MINUTES: Record<RevisionEntityType, number> = {
  knowledgeEntry: 8,
  topic: 15,
  pattern: 10,
};

/** Default base priority (1–5, higher = more important) by entity type. */
export const DEFAULT_ENTITY_PRIORITY: Record<RevisionEntityType, number> = {
  topic: 4,
  pattern: 3,
  knowledgeEntry: 3,
};

/** How many days ahead the daily queue's "upcoming" preview looks. */
export const UPCOMING_WINDOW_DAYS = 7;
