import { z } from 'zod';
import { ApiError } from '../utils/ApiError.js';
import { REVISION_ENTITY_TYPES } from '../types/domain.js';

const confidence = z.number().min(0).max(100);

/** GET /retention — optional entity-type filter. */
export const retentionListQuerySchema = z
  .object({
    entityType: z.enum(REVISION_ENTITY_TYPES).optional(),
  })
  .strip();

/** GET /retention/history — bounded row limit. */
export const retentionHistoryQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).catch(40).default(40),
});

/** PATCH /retention/:entityId — manual confidence override. */
export const updateRetentionSchema = z
  .object({
    confidenceScore: confidence,
  })
  .strict()
  .refine((obj) => Object.keys(obj).length > 0, { message: 'Provide at least one field' });

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

export const parseRetentionListQuery = (query: unknown) =>
  parse(retentionListQuerySchema, query, 'Invalid retention query');
export const parseRetentionHistoryQuery = (query: unknown) =>
  parse(retentionHistoryQuerySchema, query, 'Invalid retention history query');
export const parseUpdateRetention = (body: unknown) => parse(updateRetentionSchema, body, 'Invalid retention update');
