import { z } from 'zod';
import { isValidObjectId } from 'mongoose';
import { ApiError } from '../utils/ApiError.js';
import { ATTEMPT_STATUSES, ATTEMPT_VERDICTS, ATTEMPT_LANGUAGES } from '../types/domain.js';

const objectId = z.string().refine((v) => isValidObjectId(v), { message: 'must be a valid id' });

/** Shared, per-field validators (reused by create + update). */
const notes = z.string().max(5000);
const startBeforeEnd = (d: { startTime?: Date; endTime?: Date | null }) =>
  !d.startTime || !d.endTime || d.startTime.getTime() <= d.endTime.getTime();

/**
 * Body for POST /attempts. status/verdict/language are required + enum-checked;
 * dates are coerced from ISO strings; duration is optional (derived when absent).
 */
export const createAttemptSchema = z
  .object({
    problemId: objectId,
    status: z.enum(ATTEMPT_STATUSES),
    verdict: z.enum(ATTEMPT_VERDICTS),
    language: z.enum(ATTEMPT_LANGUAGES),
    startTime: z.coerce.date(),
    endTime: z.coerce.date().nullable().optional(),
    durationMinutes: z.number().min(0).optional(),
    wrongAttempts: z.number().int().min(0).optional(),
    usedHint: z.boolean().optional(),
    usedEditorial: z.boolean().optional(),
    contestAttempt: z.boolean().optional(),
    upsolved: z.boolean().optional(),
    notes: notes.optional(),
  })
  .strict()
  .refine(startBeforeEnd, { message: 'startTime must be before endTime', path: ['endTime'] });

/** Body for PATCH /attempts/:id — every field optional, at least one required. */
export const updateAttemptSchema = z
  .object({
    status: z.enum(ATTEMPT_STATUSES).optional(),
    verdict: z.enum(ATTEMPT_VERDICTS).optional(),
    language: z.enum(ATTEMPT_LANGUAGES).optional(),
    startTime: z.coerce.date().optional(),
    endTime: z.coerce.date().nullable().optional(),
    durationMinutes: z.number().min(0).optional(),
    wrongAttempts: z.number().int().min(0).optional(),
    usedHint: z.boolean().optional(),
    usedEditorial: z.boolean().optional(),
    contestAttempt: z.boolean().optional(),
    upsolved: z.boolean().optional(),
    notes: notes.optional(),
  })
  .strict()
  .refine((obj) => Object.keys(obj).length > 0, { message: 'Provide at least one field to update' })
  .refine(startBeforeEnd, { message: 'startTime must be before endTime', path: ['endTime'] });

export type CreateAttemptBody = z.infer<typeof createAttemptSchema>;
export type UpdateAttemptBody = z.infer<typeof updateAttemptSchema>;

function parse<T>(schema: z.ZodType<T>, body: unknown, label: string): T {
  const result = schema.safeParse(body);
  if (!result.success) {
    throw ApiError.badRequest(
      label,
      result.error.issues.map((i) => `${i.path.join('.') || '(body)'}: ${i.message}`),
    );
  }
  return result.data;
}

export const parseCreateAttempt = (body: unknown) =>
  parse(createAttemptSchema, body, 'Invalid attempt');
export const parseUpdateAttempt = (body: unknown) =>
  parse(updateAttemptSchema, body, 'Invalid attempt update');
