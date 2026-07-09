import { z } from 'zod';
import { ApiError } from '../../utils/ApiError.js';
import {
  ANALYTICS_DATE_RANGES,
  ANALYTICS_DEFAULT_RANGE,
  type AnalyticsRangePreset,
} from '../../config/analytics.js';
import type { AnalyticsWindow } from '../types/analytics.types.js';

const DAY_MS = 86_400_000;
const isoDate = z.string().refine((v) => !Number.isNaN(Date.parse(v)), { message: 'must be a valid date' });

/** ?range=7d|30d|90d|… OR ?from=&to= (custom). Range and from/to are exclusive. */
export const analyticsQuerySchema = z
  .object({
    range: z.enum(Object.keys(ANALYTICS_DATE_RANGES) as [AnalyticsRangePreset, ...AnalyticsRangePreset[]]).optional(),
    from: isoDate.optional(),
    to: isoDate.optional(),
  })
  .strip()
  .refine((q) => !(q.range && (q.from || q.to)), {
    message: 'Provide either range OR from/to, not both',
  })
  .refine((q) => !(q.from && q.to) || Date.parse(q.from) <= Date.parse(q.to), {
    message: 'from must be on or before to',
  });

function parse<S extends z.ZodTypeAny>(schema: S, data: unknown, label: string): z.infer<S> {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw ApiError.badRequest(
      label,
      result.error.issues.map((i) => `${i.path.join('.') || '(query)'}: ${i.message}`),
    );
  }
  return result.data;
}

/** Resolve a validated query into an absolute, bounded analytics window. */
export function resolveAnalyticsWindow(query: unknown): AnalyticsWindow {
  const q = parse(analyticsQuerySchema, query, 'Invalid analytics query');
  const now = new Date();

  // Custom window.
  if (q.from || q.to) {
    const to = q.to ? new Date(q.to) : now;
    const from = q.from ? new Date(q.from) : null;
    if (to.getTime() > now.getTime() + DAY_MS) {
      throw ApiError.badRequest('Invalid analytics query', ['to: cannot be in the future']);
    }
    const days = from ? Math.max(1, Math.round((to.getTime() - from.getTime()) / DAY_MS)) : null;
    return { from, to, label: 'custom', days };
  }

  // Preset window.
  const preset = (q.range ?? ANALYTICS_DEFAULT_RANGE) as AnalyticsRangePreset;
  const days = ANALYTICS_DATE_RANGES[preset];
  const from = days ? new Date(now.getTime() - days * DAY_MS) : null;
  return { from, to: now, label: preset, days };
}
