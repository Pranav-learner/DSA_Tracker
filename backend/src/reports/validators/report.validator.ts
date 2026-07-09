import { z } from 'zod';
import { isValidObjectId } from 'mongoose';
import { ApiError } from '../../utils/ApiError.js';
import { REPORT_TYPES, type ReportType } from '../../config/reports.js';

const exportQuerySchema = z
  .object({
    type: z.enum(REPORT_TYPES).catch('summary').default('summary'),
    phaseId: z
      .string()
      .refine((v) => isValidObjectId(v), { message: 'must be a valid phase id' })
      .optional(),
  })
  .strip()
  .refine((q) => q.type !== 'phase' || Boolean(q.phaseId), {
    message: 'phaseId is required when type=phase',
  });

/** Validate the export query (report type + optional phase). */
export function parseExportParams(query: unknown): { type: ReportType; phaseId?: string } {
  const result = exportQuerySchema.safeParse(query);
  if (!result.success) {
    throw ApiError.badRequest(
      'Invalid export query',
      result.error.issues.map((i) => `${i.path.join('.') || '(query)'}: ${i.message}`),
    );
  }
  return result.data;
}
