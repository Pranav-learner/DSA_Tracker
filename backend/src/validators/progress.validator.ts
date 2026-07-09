import { z } from 'zod';
import { ApiError } from '../utils/ApiError.js';
import type { MasteryMetrics } from '../types/domain.js';

const scoreField = z.number().min(0, 'must be ≥ 0').max(100, 'must be ≤ 100');

/**
 * Partial mastery-metrics update body (shared by PATCH /progress and /mastery).
 * At least one field is required; unknown keys are rejected.
 */
export const metricPatchSchema = z
  .object({
    recognition: scoreField.optional(),
    implementation: scoreField.optional(),
    standard: scoreField.optional(),
    variant: scoreField.optional(),
    mixed: scoreField.optional(),
    contest: scoreField.optional(),
    assessment: scoreField.optional(),
    confidence: scoreField.optional(),
  })
  .strict()
  .refine((obj) => Object.keys(obj).length > 0, {
    message: 'Provide at least one metric to update',
  });

/** Validate & narrow a request body into a partial metrics patch, or throw 400. */
export function parseMetricPatch(body: unknown): Partial<MasteryMetrics> {
  const result = metricPatchSchema.safeParse(body);
  if (!result.success) {
    throw ApiError.badRequest(
      'Invalid progress update',
      result.error.issues.map((i) => `${i.path.join('.') || '(body)'}: ${i.message}`),
    );
  }
  return result.data;
}
