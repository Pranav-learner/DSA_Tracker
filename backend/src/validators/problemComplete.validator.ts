import { z } from 'zod';
import { ApiError } from '../utils/ApiError.js';
import { ATTEMPT_LANGUAGES } from '../types/domain.js';

/**
 * Body for POST /api/problems/:id/complete. All optional — the endpoint records
 * a "solved" attempt with sensible defaults and triggers the integration flow.
 */
export const completeProblemSchema = z
  .object({
    language: z.enum(ATTEMPT_LANGUAGES).optional(),
    durationMinutes: z.number().min(0).optional(),
    notes: z.string().max(5000).optional(),
  })
  .strict();

export type CompleteProblemBody = z.infer<typeof completeProblemSchema>;

export function parseCompleteProblem(body: unknown): CompleteProblemBody {
  const result = completeProblemSchema.safeParse(body ?? {});
  if (!result.success) {
    throw ApiError.badRequest(
      'Invalid completion request',
      result.error.issues.map((i) => `${i.path.join('.') || '(body)'}: ${i.message}`),
    );
  }
  return result.data;
}
