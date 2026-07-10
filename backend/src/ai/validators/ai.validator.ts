import { z } from 'zod';
import { ApiError } from '../../utils/ApiError.js';
import { PROVIDER_IDS } from '../types/ai.types.js';
import { AI_LIMITS } from '../../config/ai.js';
import { isValidObjectId } from 'mongoose';

const objectId = z.string().refine((v) => isValidObjectId(v), { message: 'must be a valid id' });

/** POST /chat body. */
export const chatSchema = z
  .object({
    message: z.string().trim().min(1, 'message is required').max(AI_LIMITS.maxMessageChars),
    conversationId: objectId.optional(),
    provider: z.enum(PROVIDER_IDS).optional(),
    model: z.string().trim().min(1).max(100).optional(),
    /** Explicitly request streaming (SSE) vs a single JSON response. */
    stream: z.boolean().optional(),
  })
  .strict();

/** PATCH /settings body. */
export const settingsSchema = z
  .object({
    preferredProvider: z.enum(PROVIDER_IDS).optional(),
    preferredModel: z.string().trim().min(1).max(100).optional(),
    temperature: z.number().min(AI_LIMITS.minTemperature).max(AI_LIMITS.maxTemperature).optional(),
    maxTokens: z.number().int().min(AI_LIMITS.minMaxTokens).max(AI_LIMITS.maxMaxTokens).optional(),
    streamingEnabled: z.boolean().optional(),
  })
  .strict()
  .refine((o) => Object.keys(o).length > 0, { message: 'Provide at least one field to update' });

/** POST /conversations body (optional title). */
export const createConversationSchema = z.object({ title: z.string().trim().max(200).optional() }).strict();

/** PATCH /conversations/:id body (rename). */
export const renameConversationSchema = z.object({ title: z.string().trim().min(1).max(200) }).strict();

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

export const parseChat = (b: unknown) => parse(chatSchema, b, 'Invalid chat request');
export const parseSettings = (b: unknown) => parse(settingsSchema, b, 'Invalid settings');
export const parseCreateConversation = (b: unknown) => parse(createConversationSchema, b, 'Invalid conversation');
export const parseRenameConversation = (b: unknown) => parse(renameConversationSchema, b, 'Invalid rename');
