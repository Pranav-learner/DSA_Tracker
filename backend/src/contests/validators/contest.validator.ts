import { z } from 'zod';
import { ApiError } from '../../utils/ApiError.js';
import { CONTEST_PLATFORMS, CONTEST_TYPES } from '../../types/domain.js';
import { CONTEST_SORT_FIELDS, RATING_BOUNDS } from '../../config/contest.js';
import type { ContestQuery } from '../dto/contest.dto.js';

const isoDate = z.string().refine((v) => !Number.isNaN(Date.parse(v)), { message: 'must be a valid date' });
const rating = z.number().min(RATING_BOUNDS.min).max(RATING_BOUNDS.max);

export const createContestSchema = z
  .object({
    platform: z.enum(CONTEST_PLATFORMS),
    contestId: z.string().trim().min(1).max(200),
    contestName: z.string().trim().min(1).max(300),
    contestUrl: z.string().trim().max(500).optional(),
    division: z.string().trim().max(60).optional(),
    contestType: z.enum(CONTEST_TYPES).default('Rated'),
    startTime: isoDate,
    durationMinutes: z.number().int().min(0).max(100_000).default(0),
    ratingBefore: rating.nullable().optional(),
    ratingAfter: rating.nullable().optional(),
    rank: z.number().int().min(0).nullable().optional(),
    percentile: z.number().min(0).max(100).nullable().optional(),
    participated: z.boolean().default(true),
    notes: z.string().max(8000).optional(),
  })
  .strict();

export const updateContestSchema = z
  .object({
    contestName: z.string().trim().min(1).max(300).optional(),
    contestUrl: z.string().trim().max(500).optional(),
    division: z.string().trim().max(60).optional(),
    contestType: z.enum(CONTEST_TYPES).optional(),
    startTime: isoDate.optional(),
    durationMinutes: z.number().int().min(0).max(100_000).optional(),
    ratingBefore: rating.nullable().optional(),
    ratingAfter: rating.nullable().optional(),
    rank: z.number().int().min(0).nullable().optional(),
    percentile: z.number().min(0).max(100).nullable().optional(),
    participated: z.boolean().optional(),
    notes: z.string().max(8000).optional(),
  })
  .strict()
  .refine((obj) => Object.keys(obj).length > 0, { message: 'Provide at least one field to update' });

export const contestQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).catch(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).catch(20).default(20),
    q: z.string().trim().max(200).optional(),
    platform: z.enum(CONTEST_PLATFORMS).optional(),
    contestType: z.enum(CONTEST_TYPES).optional(),
    division: z.string().trim().max(60).optional(),
    rated: z
      .enum(['true', 'false'])
      .transform((v) => v === 'true')
      .optional(),
    from: isoDate.optional(),
    to: isoDate.optional(),
    sort: z.enum(CONTEST_SORT_FIELDS).catch('startTime').default('startTime'),
    order: z.enum(['asc', 'desc']).catch('desc').default('desc'),
  })
  .refine((q) => !(q.from && q.to) || Date.parse(q.from) <= Date.parse(q.to), {
    message: 'from must be on or before to',
  });

function parse<S extends z.ZodTypeAny>(schema: S, data: unknown, label: string): z.infer<S> {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw ApiError.badRequest(
      label,
      result.error.issues.map((i) => `${i.path.join('.') || '(body)'}: ${i.message}`),
    );
  }
  return result.data;
}

export type CreateContestBody = z.infer<typeof createContestSchema>;
export type UpdateContestBody = z.infer<typeof updateContestSchema>;

export const parseCreateContest = (body: unknown) => parse(createContestSchema, body, 'Invalid contest');
export const parseUpdateContest = (body: unknown) => parse(updateContestSchema, body, 'Invalid contest update');
export const parseContestQuery = (query: unknown): ContestQuery => parse(contestQuerySchema, query, 'Invalid contest query');
