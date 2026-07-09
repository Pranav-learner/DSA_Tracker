/**
 * Reporting infrastructure tuning — cache TTLs and the report background-job
 * cadence. Env-overridable, consistent with the analytics config.
 */

/** Report cache TTL (ms) — reports are pricey composites, cached a while. */
export const REPORT_CACHE_TTL = Number(process.env.REPORT_TTL_MS ?? 10 * 60_000);

/** Report background-generation job cadence (ms) + toggle. */
export const REPORT_JOB = {
  intervalMs: Number(process.env.REPORT_JOB_INTERVAL_MS ?? 60 * 60_000),
  enabled: (process.env.REPORT_JOB_ENABLED ?? 'true') !== 'false',
} as const;

/** Trailing windows (days) for the time-boxed reports. */
export const REPORT_WINDOWS = {
  weekly: 7,
  monthly: 30,
} as const;

/** Supported export formats. */
export const EXPORT_FORMATS = ['pdf', 'markdown', 'json', 'csv'] as const;
export type ExportFormat = (typeof EXPORT_FORMATS)[number];

/** Report types the export endpoints can target. */
export const REPORT_TYPES = ['weekly', 'monthly', 'summary', 'phase'] as const;
export type ReportType = (typeof REPORT_TYPES)[number];
