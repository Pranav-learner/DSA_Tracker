import type { Request, Response } from 'express';
import { aiOrchestratorService } from '../orchestrator/aiOrchestrator.service.js';
import { conversationService } from '../services/conversation.service.js';
import { aiSettingsService } from '../services/aiSettings.service.js';
import { AI_DEFAULTS } from '../../config/ai.js';
import {
  parseChat,
  parseSettings,
  parseCreateConversation,
  parseRenameConversation,
} from '../validators/ai.validator.js';
import { sanitizePrompt } from '../middleware/sanitize.js';
import { AIError } from '../types/ai.types.js';
import { currentUserId } from '../../utils/currentUser.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ok } from '../../utils/ApiResponse.js';
import { ApiError } from '../../utils/ApiError.js';
import { logger } from '../../utils/logger.js';

/** Map a typed AIError onto an HTTP ApiError for the JSON (non-stream) path. */
function aiErrorToApi(err: AIError): ApiError {
  const status =
    err.code === 'rate_limited' ? 429 : err.code === 'timeout' ? 504 : err.code === 'provider_unavailable' ? 503 : 502;
  return new ApiError(status, err.message, { code: err.code, provider: err.provider });
}

/**
 * POST /api/ai/chat — the single entry point to the AI pipeline. Streams the
 * response as Server-Sent Events when `stream: true`, otherwise returns a single
 * JSON result. Streaming is abortable: a client disconnect (or Stop button)
 * aborts the provider call mid-flight.
 */
export const postChat = asyncHandler(async (req: Request, res: Response) => {
  const body = parseChat(req.body);
  const userId = currentUserId(req);
  const message = sanitizePrompt(body.message);
  if (!message) throw ApiError.badRequest('Message is empty after sanitization');

  const input = { conversationId: body.conversationId, message, provider: body.provider, model: body.model };

  if (!body.stream) {
    // Non-streaming: one JSON response.
    try {
      const result = await aiOrchestratorService.chat(userId, input);
      res.status(200).json(ok(result));
    } catch (err) {
      if (err instanceof AIError) throw aiErrorToApi(err);
      throw err;
    }
    return;
  }

  // Streaming (SSE).
  res.status(200);
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  const send = (event: string, data: unknown) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  // Abort only on a genuine client disconnect. We listen on the RESPONSE (not the
  // request): `req`'s 'close' fires as soon as the body is consumed — which is
  // already done by the JSON parser — so it would abort us immediately. `res`
  // 'close' fires when the socket closes; the `writableEnded` guard ignores the
  // normal end-of-stream close.
  const controller = new AbortController();
  res.on('close', () => {
    if (!res.writableEnded) controller.abort();
  });

  send('start', { conversationId: input.conversationId ?? null });
  try {
    const result = await aiOrchestratorService.chat(userId, input, {
      onToken: (delta) => send('token', { delta }),
      signal: controller.signal,
    });
    send('done', result);
  } catch (err) {
    const code = err instanceof AIError ? err.code : 'provider_error';
    logger.warn('AI chat stream failed', err);
    send('error', { code, message: err instanceof Error ? err.message : 'AI request failed' });
  } finally {
    res.end();
  }
});

/** GET /api/ai/conversations — the user's conversation list. */
export const getConversations = asyncHandler(async (req: Request, res: Response) => {
  const conversations = await conversationService.list(currentUserId(req));
  res.status(200).json(ok(conversations, { count: conversations.length }));
});

/** GET /api/ai/conversations/:id — a conversation with its messages. */
export const getConversation = asyncHandler(async (req: Request, res: Response) => {
  const conversation = await conversationService.get(currentUserId(req), req.params.id);
  res.status(200).json(ok(conversation));
});

/** POST /api/ai/conversations — create an empty conversation. */
export const createConversation = asyncHandler(async (req: Request, res: Response) => {
  const { title } = parseCreateConversation(req.body ?? {});
  const conversation = await conversationService.create(currentUserId(req), title);
  res.status(201).json(ok(conversation));
});

/** PATCH /api/ai/conversations/:id — rename. */
export const renameConversation = asyncHandler(async (req: Request, res: Response) => {
  const { title } = parseRenameConversation(req.body);
  const conversation = await conversationService.rename(currentUserId(req), req.params.id, title);
  res.status(200).json(ok(conversation));
});

/** DELETE /api/ai/conversations/:id. */
export const deleteConversation = asyncHandler(async (req: Request, res: Response) => {
  await conversationService.remove(currentUserId(req), req.params.id);
  res.status(200).json(ok({ deleted: true }));
});

/** GET /api/ai/settings. */
export const getSettings = asyncHandler(async (req: Request, res: Response) => {
  const settings = await aiSettingsService.get(currentUserId(req));
  res.status(200).json(ok(settings));
});

/** PATCH /api/ai/settings. */
export const patchSettings = asyncHandler(async (req: Request, res: Response) => {
  const body = parseSettings(req.body);
  const settings = await aiSettingsService.update(currentUserId(req), body);
  res.status(200).json(ok(settings));
});

/** GET /api/ai/providers — supported providers, models, capabilities + health. */
export const getProviders = asyncHandler(async (_req: Request, res: Response) => {
  res.status(200).json(ok({ providers: aiOrchestratorService.providers(), defaultProvider: AI_DEFAULTS.provider }));
});
