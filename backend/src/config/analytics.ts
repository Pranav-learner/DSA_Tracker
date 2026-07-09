/**
 * Analytics infrastructure tuning — cache TTLs, background-refresh cadence and
 * date-range defaults. All configurable in one place (env-overridable), so the
 * whole analytics layer can be retuned without touching services.
 */

/** Per-scope cache TTLs (ms). Overview is the priciest → cached longest. */
export const ANALYTICS_CACHE_TTL = {
  overview: Number(process.env.ANALYTICS_TTL_OVERVIEW_MS ?? 5 * 60_000),
  section: Number(process.env.ANALYTICS_TTL_SECTION_MS ?? 3 * 60_000),
} as const;

/** Master cache switch (disabled cleanly under tests to keep them deterministic). */
export const ANALYTICS_CACHE_ENABLED =
  (process.env.ANALYTICS_CACHE_ENABLED ?? 'true') !== 'false' && process.env.NODE_ENV !== 'test';

/** Background analytics-refresh job cadence (ms) + toggle. */
export const ANALYTICS_JOB = {
  intervalMs: Number(process.env.ANALYTICS_JOB_INTERVAL_MS ?? 30 * 60_000),
  enabled: (process.env.ANALYTICS_JOB_ENABLED ?? 'true') !== 'false',
} as const;

/** Trailing-window presets a client may request (days; `all` = no lower bound). */
export const ANALYTICS_DATE_RANGES = {
  '7d': 7,
  '30d': 30,
  '90d': 90,
  '180d': 180,
  '365d': 365,
  all: null,
} as const;

export type AnalyticsRangePreset = keyof typeof ANALYTICS_DATE_RANGES;

/** Default trailing window when a request omits one. */
export const ANALYTICS_DEFAULT_RANGE: AnalyticsRangePreset = '30d';

/** Windows (days) used for velocity / frequency normalisation. */
export const ANALYTICS_WINDOWS = {
  velocityDays: 7, // learning velocity is expressed per this window (a week)
  frequencyDays: 7, // revision frequency per week
} as const;
