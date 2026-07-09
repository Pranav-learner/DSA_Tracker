import { z } from 'zod';
import { ApiError } from '../utils/ApiError.js';
import { REVISION_ENTITY_TYPES, REVISION_STATUSES, REVISION_STRATEGIES } from '../types/domain.js';
import { REVISION_SORT_FIELDS, type RevisionQuery } from '../services/revision.dto.js';

const isoDate = z.string().refine((v) => !Number.isNaN(Date.parse(v)), { message: 'must be a valid date' });
const priority = z.number().int().min(1).max(5);

/** POST /revision/schedules. */
export const createScheduleSchema = z
  .object({
    entityType: z.enum(REVISION_ENTITY_TYPES),
    entityId: z.string().trim().min(1).max(200),
    title: z.string().trim().min(1).max(300),
    strategy: z.enum(REVISION_STRATEGIES).optional(),
    priority: priority.optional(),
    nextReviewDate: isoDate.optional(),
    allowDuplicate: z.boolean().optional(),
  })
  .strict();

/** PATCH /revision/schedules/:id — lifecycle status only (Due/Overdue are derived). */
export const updateScheduleSchema = z
  .object({
    title: z.string().trim().min(1).max(300).optional(),
    priority: priority.optional(),
    status: z.enum(['Pending', 'Completed', 'Archived']).optional(),
    strategy: z.enum(REVISION_STRATEGIES).optional(),
    nextReviewDate: isoDate.optional(),
  })
  .strict()
  .refine((obj) => Object.keys(obj).length > 0, { message: 'Provide at least one field to update' });

export const scheduleQuerySchema = z.object({
  page: z.coerce.number().int().min(1).catch(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).catch(20).default(20),
  status: z.enum(REVISION_STATUSES).optional(),
  entityType: z.enum(REVISION_ENTITY_TYPES).optional(),
  from: isoDate.optional(),
  to: isoDate.optional(),
  sort: z.enum(REVISION_SORT_FIELDS).catch('nextReviewDate').default('nextReviewDate'),
  order: z.enum(['asc', 'desc']).catch('asc').default('asc'),
});

export const calendarQuerySchema = z.object({
  from: isoDate.optional(),
  to: isoDate.optional(),
});

export type CreateScheduleBody = z.infer<typeof createScheduleSchema>;
export type UpdateScheduleBody = z.infer<typeof updateScheduleSchema>;

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

export const parseCreateSchedule = (body: unknown) => parse(createScheduleSchema, body, 'Invalid revision schedule');
export const parseUpdateSchedule = (body: unknown) => parse(updateScheduleSchema, body, 'Invalid schedule update');
export const parseScheduleQuery = (query: unknown): RevisionQuery => parse(scheduleQuerySchema, query, 'Invalid revision query');
export const parseCalendarQuery = (query: unknown) => parse(calendarQuerySchema, query, 'Invalid calendar query');
