/**
 * Contest engine tuning — pagination defaults + rating bounds. Configurable in
 * one place, consistent with the rest of the app's config modules.
 */

export const CONTEST_PAGE = {
  defaultSize: 20,
  maxSize: 100,
} as const;

/** Sensible rating bounds for validation (covers all supported platforms). */
export const RATING_BOUNDS = {
  min: 0,
  max: 5000,
} as const;

/** Sort fields the contest list accepts. */
export const CONTEST_SORT_FIELDS = ['startTime', 'ratingChange', 'rank', 'contestName', 'createdAt'] as const;
export type ContestSortField = (typeof CONTEST_SORT_FIELDS)[number];
