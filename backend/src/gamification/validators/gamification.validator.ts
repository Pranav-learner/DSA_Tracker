import { z } from 'zod';
import { ApiError } from '../../utils/ApiError.js';
import { REWARD_TYPES, ACTIVITY_TYPES } from '../../types/domain.js';
import type { RewardHistoryFilter } from '../repositories/rewardHistory.repository.js';

/** Coerce a 'YYYY-MM-DD' or ISO date string into a Date, or fail. */
const dateString = z
  .string()
  .refine((v) => !Number.isNaN(Date.parse(v)), { message: 'must be a valid date' })
  .transform((v) => new Date(v));

/**
 * GET /rewards/history query. Supports filter (reward type, activity type, date
 * range), sort (newest/oldest) and pagination. `.strip()` tolerates unknown
 * query keys rather than 400-ing on them.
 */
export const rewardHistoryQuerySchema = z
  .object({
    rewardType: z.enum(REWARD_TYPES).optional(),
    rewardSource: z.enum(ACTIVITY_TYPES).optional(),
    from: dateString.optional(),
    to: dateString.optional(),
    sort: z.enum(['newest', 'oldest']).default('newest'),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    offset: z.coerce.number().int().min(0).default(0),
  })
  .strip()
  .refine((o) => !o.from || !o.to || o.from <= o.to, {
    message: 'from must be on or before to',
    path: ['from'],
  });

/** GET /rewards query — just an optional limit for the recent feed. */
export const recentRewardsQuerySchema = z
  .object({ limit: z.coerce.number().int().min(1).max(50).default(10) })
  .strip();

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

/** Parse + normalise the history query into the repository's filter shape. */
export function parseRewardHistoryQuery(query: unknown): RewardHistoryFilter {
  const q = parse(rewardHistoryQuerySchema, query, 'Invalid reward history query');
  return {
    rewardType: q.rewardType,
    rewardSource: q.rewardSource,
    from: q.from,
    to: q.to,
    sort: q.sort,
    limit: q.limit,
    skip: q.offset,
  };
}

export const parseRecentRewardsQuery = (query: unknown): { limit: number } =>
  parse(recentRewardsQuerySchema, query, 'Invalid rewards query');
