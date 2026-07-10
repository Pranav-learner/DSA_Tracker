import { z } from 'zod';
import { ApiError } from '../../utils/ApiError.js';
import { ACHIEVEMENT_RARITIES } from '../../types/domain.js';

/** GET /achievements query — optional category / rarity / unlocked filters. */
export const achievementsQuerySchema = z
  .object({
    category: z.string().trim().min(1).max(40).optional(),
    rarity: z.enum(ACHIEVEMENT_RARITIES).optional(),
    unlocked: z
      .enum(['true', 'false'])
      .transform((v) => v === 'true')
      .optional(),
  })
  .strip();

/** GET /celebrations query. */
export const celebrationsQuerySchema = z
  .object({
    unseen: z
      .enum(['true', 'false'])
      .transform((v) => v === 'true')
      .optional(),
    limit: z.coerce.number().int().min(1).max(50).default(20),
  })
  .strip();

/** PATCH /challenges/:id body. */
export const challengeActionSchema = z
  .object({ action: z.enum(['refresh', 'dismiss']) })
  .strict();

function parse<S extends z.ZodTypeAny>(schema: S, data: unknown, label: string): z.infer<S> {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw ApiError.badRequest(
      label,
      result.error.issues.map((i) => `${i.path.join('.') || '(input)'}: ${i.message}`),
    );
  }
  return result.data;
}

export const parseAchievementsQuery = (q: unknown) => parse(achievementsQuerySchema, q, 'Invalid achievements query');
export const parseCelebrationsQuery = (q: unknown) => parse(celebrationsQuerySchema, q, 'Invalid celebrations query');
export const parseChallengeAction = (b: unknown) => parse(challengeActionSchema, b, 'Invalid challenge action');
