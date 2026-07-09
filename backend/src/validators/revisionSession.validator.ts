import { z } from 'zod';
import { isValidObjectId } from 'mongoose';
import { ApiError } from '../utils/ApiError.js';
import { REVISION_ENTITY_TYPES, REVISION_SESSION_STATUSES } from '../types/domain.js';
import { SESSION_HISTORY_SORTS, type SessionHistoryQuery } from '../services/revisionSession.dto.js';

const objectId = z.string().refine((v) => isValidObjectId(v), { message: 'must be a valid id' });
const isoDate = z.string().refine((v) => !Number.isNaN(Date.parse(v)), { message: 'must be a valid date' });
const confidence = z.number().min(0).max(100);
const idList = z.array(z.string().min(1).max(200)).max(500);

/** POST /revision/session/start — a scheduleId OR an entity to review. */
export const startSessionSchema = z
  .object({
    scheduleId: objectId.optional(),
    entityType: z.enum(REVISION_ENTITY_TYPES).optional(),
    entityId: z.string().trim().min(1).max(200).optional(),
    selfConfidenceBefore: confidence.optional(),
  })
  .strict()
  .refine((d) => Boolean(d.scheduleId) || Boolean(d.entityType && d.entityId), {
    message: 'Provide a scheduleId, or an entityType + entityId',
  });

/** POST /revision/session/complete. */
export const completeSessionSchema = z
  .object({
    sessionId: objectId,
    durationMinutes: z.number().min(0).optional(),
    reviewNotes: z.string().max(8000).optional(),
    selfConfidenceAfter: confidence.optional(),
    reviewedKnowledgeEntries: idList.optional(),
    reviewedProblems: idList.optional(),
  })
  .strict();

/** PATCH /revision/session/:id — partial updates + optional control action. */
export const updateSessionSchema = z
  .object({
    reviewNotes: z.string().max(8000).optional(),
    selfConfidenceBefore: confidence.optional(),
    selfConfidenceAfter: confidence.optional(),
    reviewedKnowledgeEntries: idList.optional(),
    reviewedProblems: idList.optional(),
    action: z.enum(['pause', 'resume', 'abandon']).optional(),
  })
  .strict()
  .refine((obj) => Object.keys(obj).length > 0, { message: 'Provide at least one field or action' });

export const sessionHistoryQuerySchema = z.object({
  page: z.coerce.number().int().min(1).catch(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).catch(20).default(20),
  entityType: z.enum(REVISION_ENTITY_TYPES).optional(),
  status: z.enum(REVISION_SESSION_STATUSES).optional(),
  from: isoDate.optional(),
  to: isoDate.optional(),
  sort: z.enum(SESSION_HISTORY_SORTS).catch('recent').default('recent'),
});

export const workspaceQuerySchema = z
  .object({
    scheduleId: objectId.optional(),
    entityType: z.enum(REVISION_ENTITY_TYPES).optional(),
    entityId: z.string().trim().min(1).max(200).optional(),
  })
  .refine((d) => Boolean(d.scheduleId) || Boolean(d.entityType && d.entityId), {
    message: 'Provide a scheduleId, or an entityType + entityId',
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

export const parseStartSession = (body: unknown) => parse(startSessionSchema, body, 'Invalid session start');
export const parseCompleteSession = (body: unknown) => parse(completeSessionSchema, body, 'Invalid session completion');
export const parseUpdateSession = (body: unknown) => parse(updateSessionSchema, body, 'Invalid session update');
export const parseSessionHistoryQuery = (query: unknown): SessionHistoryQuery =>
  parse(sessionHistoryQuerySchema, query, 'Invalid history query');
export const parseWorkspaceQuery = (query: unknown) => parse(workspaceQuerySchema, query, 'Invalid workspace query');
