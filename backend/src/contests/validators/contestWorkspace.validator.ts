import { z } from 'zod';
import { isValidObjectId } from 'mongoose';
import { ApiError } from '../../utils/ApiError.js';
import { CONTEST_EVENT_TYPES } from '../../types/domain.js';

const isoDate = z.string().refine((v) => !Number.isNaN(Date.parse(v)), { message: 'must be a valid date' });
const objectId = z.string().refine((v) => isValidObjectId(v), { message: 'must be a valid id' });

export const createProblemSchema = z
  .object({
    problemCode: z.string().trim().min(1).max(100),
    problemName: z.string().trim().min(1).max(300),
    platformProblemId: z.string().trim().max(200).optional(),
    url: z.string().trim().max(500).optional(),
    index: z.string().trim().max(5).optional(),
    difficulty: z.string().trim().max(40).optional(),
    tags: z.array(z.string().trim().min(1).max(60)).max(30).optional(),
    solved: z.boolean().default(false),
    skipped: z.boolean().default(false),
    attempted: z.boolean().default(false),
    attempts: z.number().int().min(0).max(1000).default(0),
    firstAttemptAt: isoDate.nullable().optional(),
    solvedAt: isoDate.nullable().optional(),
    totalTimeSpent: z.number().min(0).max(100_000).default(0),
    penalty: z.number().min(0).max(100_000).default(0),
  })
  .strict();

export const updateProblemSchema = z
  .object({
    problemName: z.string().trim().min(1).max(300).optional(),
    platformProblemId: z.string().trim().max(200).optional(),
    url: z.string().trim().max(500).optional(),
    index: z.string().trim().max(5).optional(),
    difficulty: z.string().trim().max(40).optional(),
    tags: z.array(z.string().trim().min(1).max(60)).max(30).optional(),
    solved: z.boolean().optional(),
    skipped: z.boolean().optional(),
    attempted: z.boolean().optional(),
    attempts: z.number().int().min(0).max(1000).optional(),
    firstAttemptAt: isoDate.nullable().optional(),
    solvedAt: isoDate.nullable().optional(),
    totalTimeSpent: z.number().min(0).max(100_000).optional(),
    penalty: z.number().min(0).max(100_000).optional(),
  })
  .strict()
  .refine((o) => Object.keys(o).length > 0, { message: 'Provide at least one field to update' });

export const createTimelineEventSchema = z
  .object({
    eventType: z.enum(CONTEST_EVENT_TYPES),
    timestamp: isoDate.optional(),
    problemRef: objectId.nullable().optional(),
    problemCode: z.string().trim().max(100).optional(),
    description: z.string().trim().max(500).optional(),
  })
  .strict();

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

export type CreateProblemBody = z.infer<typeof createProblemSchema>;
export type UpdateProblemBody = z.infer<typeof updateProblemSchema>;
export type CreateTimelineEventBody = z.infer<typeof createTimelineEventSchema>;

export const parseCreateProblem = (body: unknown) => parse(createProblemSchema, body, 'Invalid contest problem');
export const parseUpdateProblem = (body: unknown) => parse(updateProblemSchema, body, 'Invalid problem update');
export const parseCreateTimelineEvent = (body: unknown) => parse(createTimelineEventSchema, body, 'Invalid timeline event');
