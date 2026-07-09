import { z } from 'zod';
import { isValidObjectId } from 'mongoose';
import { ApiError } from '../utils/ApiError.js';
import { PLATFORMS } from '../types/domain.js';
import { NOTEBOOK_SORT_FIELDS, type NotebookQuery } from '../services/notebook.dto.js';

const objectId = z.string().refine((v) => isValidObjectId(v), { message: 'must be a valid id' });
const confidence = z.number().min(0, 'must be ≥ 0').max(100, 'must be ≤ 100');
const alternative = z.object({ title: z.string().trim().min(1), detail: z.string().max(4000).default('') });

/** Content fields shared by create + update (all optional; text bounded). */
const contentFields = {
  title: z.string().trim().min(1).max(300).optional(),
  pattern: z.string().trim().min(1).max(200).optional(),
  platform: z.enum(PLATFORMS).optional(),
  recognitionKeywords: z.array(z.string().trim().min(1).max(80)).max(50).optional(),
  observation: z.string().max(8000).optional(),
  coreAlgorithm: z.string().max(8000).optional(),
  timeComplexity: z.string().max(200).optional(),
  spaceComplexity: z.string().max(200).optional(),
  alternativeSolutions: z.array(alternative).max(20).optional(),
  commonMistakes: z.array(z.string().trim().min(1).max(500)).max(50).optional(),
  lessonsLearned: z.string().max(8000).optional(),
  personalNotes: z.string().max(8000).optional(),
  confidence: confidence.optional(),
  relatedProblems: z.array(objectId).max(50).optional(),
  relatedEntries: z.array(objectId).max(50).optional(),
};

/** POST /notebook — problemId required; everything else optional (pre-filled from the problem). */
export const createNotebookSchema = z.object({ problemId: objectId, ...contentFields }).strict();

/** PATCH /notebook/:id — every field optional, at least one; `review` appends a revision. */
export const updateNotebookSchema = z
  .object({ ...contentFields, review: z.boolean().optional() })
  .strict()
  .refine((obj) => Object.keys(obj).length > 0, { message: 'Provide at least one field to update' });

/** GET /notebook & /notebook/search query. */
export const notebookQuerySchema = z.object({
  page: z.coerce.number().int().min(1).catch(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).catch(20).default(20),
  q: z.string().trim().min(1).max(100).optional(),
  pattern: z.string().trim().min(1).max(200).optional(),
  topic: objectId.optional(),
  phase: objectId.optional(),
  platform: z.enum(PLATFORMS).optional(),
  problem: objectId.optional(),
  tag: z.string().trim().min(1).max(80).optional(),
  confidenceMin: z.coerce.number().min(0).max(100).optional(),
  confidenceMax: z.coerce.number().min(0).max(100).optional(),
  sort: z.enum(NOTEBOOK_SORT_FIELDS).catch('recent').default('recent'),
  order: z.enum(['asc', 'desc']).catch('desc').default('desc'),
});

export type CreateNotebookBody = z.infer<typeof createNotebookSchema>;
export type UpdateNotebookBody = z.infer<typeof updateNotebookSchema>;

// Use `z.infer<S>` (not `z.ZodType<T>`) so the schema's OUTPUT type is preserved
// — `.default()` / `.coerce` fields stay correctly typed at call sites.
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

export const parseCreateNotebook = (body: unknown) => parse(createNotebookSchema, body, 'Invalid notebook entry');
export const parseUpdateNotebook = (body: unknown) => parse(updateNotebookSchema, body, 'Invalid notebook update');
export const parseNotebookQuery = (query: unknown): NotebookQuery =>
  parse(notebookQuerySchema, query, 'Invalid notebook query');
