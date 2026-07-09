import { z } from 'zod';
import { isValidObjectId } from 'mongoose';
import { ApiError } from '../../utils/ApiError.js';
import { UPSOLVE_PRIORITIES, UPSOLVE_STATUSES } from '../../types/domain.js';

const objectId = z.string().refine((v) => isValidObjectId(v), { message: 'must be a valid id' });
const md = z.string().max(20_000);
const strList = z.array(z.string().trim().min(1).max(300)).max(50);

const goal = z.object({
  text: z.string().trim().min(1).max(300),
  topicId: objectId.nullable().optional(),
  done: z.boolean().optional(),
});

/** Create-or-update postmortem (all fields optional; upsert semantics). */
export const upsertPostmortemSchema = z
  .object({
    overallPerformance: z.string().trim().max(2000).optional(),
    whatWentWell: md.optional(),
    whatWentWrong: md.optional(),
    biggestMistake: md.optional(),
    biggestLearning: md.optional(),
    nextFocus: md.optional(),
    timeManagementNotes: md.optional(),
    strengths: strList.optional(),
    weaknesses: strList.optional(),
    missedPatterns: strList.optional(),
    implementationMistakes: strList.optional(),
    debuggingMistakes: strList.optional(),
    algorithmGaps: strList.optional(),
    learningGoals: z.array(goal).max(50).optional(),
    summary: z.string().max(4000).optional(),
  })
  .strict();

export const createUpsolveSchema = z
  .object({
    contestProblemRef: objectId,
    topicId: objectId.nullable().optional(),
    pattern: z.string().trim().max(100).optional(),
    priority: z.enum(UPSOLVE_PRIORITIES).optional(),
    estimatedTime: z.number().int().min(0).max(1000).optional(),
  })
  .strict();

export const updateUpsolveSchema = z
  .object({
    status: z.enum(UPSOLVE_STATUSES).optional(),
    priority: z.enum(UPSOLVE_PRIORITIES).optional(),
    topicId: objectId.nullable().optional(),
    pattern: z.string().trim().max(100).optional(),
    estimatedTime: z.number().int().min(0).max(1000).optional(),
  })
  .strict()
  .refine((o) => Object.keys(o).length > 0, { message: 'Provide at least one field to update' });

export const upsolveQuerySchema = z
  .object({
    status: z.enum(UPSOLVE_STATUSES).optional(),
    priority: z.enum(UPSOLVE_PRIORITIES).optional(),
    contestId: objectId.optional(),
  })
  .strip();

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

export type UpsertPostmortemBody = z.infer<typeof upsertPostmortemSchema>;
export type CreateUpsolveBody = z.infer<typeof createUpsolveSchema>;
export type UpdateUpsolveBody = z.infer<typeof updateUpsolveSchema>;
export type UpsolveQuery = z.infer<typeof upsolveQuerySchema>;

export const parseUpsertPostmortem = (body: unknown) => parse(upsertPostmortemSchema, body, 'Invalid postmortem');
export const parseCreateUpsolve = (body: unknown) => parse(createUpsolveSchema, body, 'Invalid upsolve task');
export const parseUpdateUpsolve = (body: unknown) => parse(updateUpsolveSchema, body, 'Invalid upsolve update');
export const parseUpsolveQuery = (query: unknown) => parse(upsolveQuerySchema, query, 'Invalid upsolve query');
