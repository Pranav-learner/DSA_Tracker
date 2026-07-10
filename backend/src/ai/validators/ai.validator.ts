import { z } from 'zod';
import { ApiError } from '../../utils/ApiError.js';
import { PROVIDER_IDS, AI_INTENTS, CONTEXT_PROFILES } from '../types/ai.types.js';
import { AI_LIMITS } from '../../config/ai.js';
import { isValidObjectId } from 'mongoose';

const objectId = z.string().refine((v) => isValidObjectId(v), { message: 'must be a valid id' });
/** Parse a comma-separated query param into a string array. */
const csv = z
  .string()
  .transform((v) => v.split(',').map((s) => s.trim()).filter(Boolean))
  .optional();

/** POST /chat body. */
export const chatSchema = z
  .object({
    message: z.string().trim().min(1, 'message is required').max(AI_LIMITS.maxMessageChars),
    conversationId: objectId.optional(),
    provider: z.enum(PROVIDER_IDS).optional(),
    model: z.string().trim().min(1).max(100).optional(),
    /** Slash-command context override. */
    intent: z.enum(AI_INTENTS).optional(),
    profiles: z.array(z.enum(CONTEXT_PROFILES)).max(7).optional(),
    /** Context sections toggled off in the Context Preview. */
    excludeSections: z.array(z.string().max(60)).max(20).optional(),
    /** Explicitly request streaming (SSE) vs a single JSON response. */
    stream: z.boolean().optional(),
  })
  .strict();

/** PATCH /conversations/:id body (rename / pin / archive). */
export const patchConversationSchema = z
  .object({
    title: z.string().trim().min(1).max(200).optional(),
    pinned: z.boolean().optional(),
    archived: z.boolean().optional(),
  })
  .strict()
  .refine((o) => Object.keys(o).length > 0, { message: 'Provide at least one field to update' });

/** POST /conversations/export body. */
export const exportSchema = z
  .object({ conversationId: objectId, format: z.enum(['markdown', 'json']).default('markdown') })
  .strict();

/** GET /conversations/search query. */
export const searchQuerySchema = z.object({ q: z.string().trim().min(1).max(200) }).strip();

/** GET /context and /context/preview query. */
export const contextQuerySchema = z
  .object({
    intent: z.enum(AI_INTENTS).default('general'),
    profiles: csv,
    exclude: csv,
  })
  .strip();

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
export const parsePatchConversation = (b: unknown) => parse(patchConversationSchema, b, 'Invalid update');
export const parseExport = (b: unknown) => parse(exportSchema, b, 'Invalid export request');
export const parseSearchQuery = (q: unknown) => parse(searchQuerySchema, q, 'Invalid search query');
export const parseContextQuery = (q: unknown) => parse(contextQuerySchema, q, 'Invalid context query');

/** Resolve context-preview options from a parsed query (profiles as ContextProfileName[]). */
export function contextOptionsFromQuery(q: z.infer<typeof contextQuerySchema>) {
  const validProfiles = new Set<string>(CONTEXT_PROFILES);
  const profiles = q.profiles?.filter((p) => validProfiles.has(p)) as (typeof CONTEXT_PROFILES)[number][] | undefined;
  return { intent: q.intent, profiles: profiles?.length ? profiles : undefined, excludeSections: q.exclude };
}
