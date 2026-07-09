import { z } from 'zod';
import { isValidObjectId } from 'mongoose';
import { ApiError } from '../utils/ApiError.js';
import { DIFFICULTIES, PLATFORMS, PROBLEM_STATUSES } from '../types/domain.js';
import { PROBLEM_SORT_FIELDS, type ProblemQuery } from '../services/problem.dto.js';

/** Coerce the common truthy/falsey query strings into a boolean. */
const boolish = z
  .enum(['true', 'false', '1', '0'])
  .transform((v) => v === 'true' || v === '1');

const objectId = z
  .string()
  .refine((v) => isValidObjectId(v), { message: 'must be a valid id' });

/**
 * Query schema for GET /problems and /problems/search. Everything arrives as a
 * string from the URL, so values are coerced and bounded here; unknown keys are
 * ignored (not rejected) so links stay forgiving.
 */
export const problemQuerySchema = z.object({
  page: z.coerce.number().int().min(1).catch(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).catch(20).default(20),
  q: z.string().trim().min(1).max(100).optional(),
  platform: z.enum(PLATFORMS).optional(),
  difficulty: z.enum(DIFFICULTIES).optional(),
  phase: objectId.optional(),
  topic: objectId.optional(),
  pattern: z.string().trim().min(1).max(100).optional(),
  status: z.enum(PROBLEM_STATUSES).optional(),
  representative: boolish.optional(),
  favorite: boolish.optional(),
  sort: z.enum(PROBLEM_SORT_FIELDS).catch('difficulty').default('difficulty'),
  order: z.enum(['asc', 'desc']).catch('asc').default('asc'),
});

/** Validate & normalise the request query, or throw a 400. */
export function parseProblemQuery(query: unknown): ProblemQuery {
  const result = problemQuerySchema.safeParse(query);
  if (!result.success) {
    throw ApiError.badRequest(
      'Invalid problem query',
      result.error.issues.map((i) => `${i.path.join('.') || '(query)'}: ${i.message}`),
    );
  }
  return result.data;
}
