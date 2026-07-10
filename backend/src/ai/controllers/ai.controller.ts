import type { Request, Response } from 'express';
import { aiOrchestratorService } from '../orchestrator/aiOrchestrator.service.js';
import { conversationService } from '../services/conversation.service.js';
import { aiSettingsService } from '../services/aiSettings.service.js';
import { workspaceService } from '../services/workspace.service.js';
import { suggestionService } from '../services/suggestion.service.js';
import { contextComposerService } from '../context/contextComposer.service.js';
import { coachRegistry } from '../coaches/index.js';
import { intentRouterService } from '../router/intentRouter.service.js';
import { aiOperatingSystem } from '../os/aiOperatingSystem.js';
import { AI_DEFAULTS } from '../../config/ai.js';
import {
  parseChat,
  parseSettings,
  parseCreateConversation,
  parsePatchConversation,
  parseExport,
  parseSearchQuery,
  parseContextQuery,
  parseCoach,
  parseWorkflowGenerate,
  parseWorkflowStatus,
  parseRecommendationPatch,
  parseRecommendationsQuery,
  parseBriefQuery,
  parseTimelineQuery,
  contextOptionsFromQuery,
} from '../validators/ai.validator.js';
import type { TimelineEntryType } from '../os/types.js';
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

  const input = {
    conversationId: body.conversationId,
    message,
    provider: body.provider,
    model: body.model,
    intent: body.intent,
    profiles: body.profiles,
    excludeSections: body.excludeSections,
  };

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

/**
 * POST /api/ai/coach — a specialized coaching turn. Resolves a Coach (by explicit
 * coachId, else by intent, else by classifying the message), then runs the shared
 * BaseCoach pipeline and returns a STRUCTURED coach response. Streams the
 * explanation as SSE when `stream: true` (the structured scaffolding arrives with
 * the final `done` event); otherwise returns one JSON result. Abortable.
 */
export const postCoach = asyncHandler(async (req: Request, res: Response) => {
  const body = parseCoach(req.body);
  const userId = currentUserId(req);
  const message = sanitizePrompt(body.message);
  if (!message) throw ApiError.badRequest('Message is empty after sanitization');

  // Coach availability: an explicit coachId must exist.
  if (body.coachId && !coachRegistry.has(body.coachId)) {
    throw ApiError.notFound(`Coach '${body.coachId}' not found`);
  }
  const intent = body.intent ?? (body.coachId ? undefined : intentRouterService.classify(message));
  const coach = coachRegistry.resolve({ coachId: body.coachId, intent });
  if (!coach) throw ApiError.badRequest('No coach is available for this request');

  const input = {
    conversationId: body.conversationId,
    message,
    provider: body.provider,
    model: body.model,
    excludeSections: body.excludeSections,
  };

  if (!body.stream) {
    try {
      const result = await coach.handle(userId, input);
      res.status(200).json(ok(result));
    } catch (err) {
      if (err instanceof AIError) throw aiErrorToApi(err);
      throw err;
    }
    return;
  }

  // Streaming (SSE) — only the explanation streams; the structured result is sent on 'done'.
  res.status(200);
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  const send = (event: string, data: unknown) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  const controller = new AbortController();
  res.on('close', () => {
    if (!res.writableEnded) controller.abort();
  });

  send('start', { conversationId: input.conversationId ?? null, coachId: coach.id, intent: coach.intent });
  try {
    const result = await coach.handle(userId, input, {
      onToken: (delta) => send('token', { delta }),
      signal: controller.signal,
    });
    send('done', result);
  } catch (err) {
    const code = err instanceof AIError ? err.code : 'provider_error';
    logger.warn('AI coach stream failed', err);
    send('error', { code, message: err instanceof Error ? err.message : 'Coach request failed' });
  } finally {
    res.end();
  }
});

/** GET /api/ai/coaches — every registered coach with capabilities + supported intents. */
export const getCoaches = asyncHandler(async (_req: Request, res: Response) => {
  const coaches = coachRegistry.all().map((c) => c.meta());
  res.status(200).json(ok({ coaches, supportedIntents: coachRegistry.supportedIntents() }, { count: coaches.length }));
});

/** GET /api/ai/coaches/:coachId — one coach's metadata / features / prompt version. */
export const getCoach = asyncHandler(async (req: Request, res: Response) => {
  const coach = coachRegistry.get(req.params.coachId);
  if (!coach) throw ApiError.notFound(`Coach '${req.params.coachId}' not found`);
  res.status(200).json(ok(coach.meta()));
});

/* ------------------------------------------------------------------ *
 *  Sprint 4 — AI Operating System (workflows, recommendations, briefs, timeline)
 * ------------------------------------------------------------------ */

/** GET /api/ai/overview — the AI OS dashboard header (brief + workflows + recs + actions). */
export const getMentorOverview = asyncHandler(async (req: Request, res: Response) => {
  const overview = await aiOperatingSystem.overview(currentUserId(req));
  res.status(200).json(ok(overview));
});

/** POST /api/ai/workflows — generate (optionally save) a structured workflow. */
export const postWorkflow = asyncHandler(async (req: Request, res: Response) => {
  const { key, save } = parseWorkflowGenerate(req.body);
  const workflow = await aiOperatingSystem.generateWorkflow(currentUserId(req), key, { save });
  res.status(save ? 201 : 200).json(ok(workflow));
});

/** GET /api/ai/workflows — saved workflows + the available context-populated templates. */
export const getWorkflows = asyncHandler(async (req: Request, res: Response) => {
  const userId = currentUserId(req);
  const [saved, available] = await Promise.all([
    aiOperatingSystem.listWorkflows(userId),
    aiOperatingSystem.previewWorkflows(userId),
  ]);
  res.status(200).json(ok({ saved, available }, { savedCount: saved.length }));
});

/** PATCH /api/ai/workflows/:id — a workflow status transition (learner-driven). */
export const patchWorkflow = asyncHandler(async (req: Request, res: Response) => {
  const { status } = parseWorkflowStatus(req.body);
  const workflow = await aiOperatingSystem.updateWorkflowStatus(currentUserId(req), req.params.id, status);
  res.status(200).json(ok(workflow));
});

/** GET /api/ai/recommendations — the recommendation center (generate+list, or by status). */
export const getRecommendations = asyncHandler(async (req: Request, res: Response) => {
  const userId = currentUserId(req);
  const { status } = parseRecommendationsQuery(req.query);
  const recommendations = status
    ? await aiOperatingSystem.listRecommendations(userId, status)
    : await aiOperatingSystem.recommendations(userId);
  const stats = await aiOperatingSystem.recommendationStats(userId);
  res.status(200).json(ok({ recommendations, stats }, { count: recommendations.length }));
});

/** PATCH /api/ai/recommendations/:id — a lifecycle transition (viewed/accepted/…). */
export const patchRecommendation = asyncHandler(async (req: Request, res: Response) => {
  const { status } = parseRecommendationPatch(req.body);
  const recommendation = await aiOperatingSystem.updateRecommendation(currentUserId(req), req.params.id, status);
  res.status(200).json(ok(recommendation));
});

/** GET /api/ai/mentor-brief — an on-demand mentor brief (?kind=daily|weekly|…). */
export const getMentorBrief = asyncHandler(async (req: Request, res: Response) => {
  const { kind } = parseBriefQuery(req.query);
  const brief = await aiOperatingSystem.brief(currentUserId(req), kind);
  res.status(200).json(ok(brief));
});

/** GET /api/ai/timeline — the searchable mentor timeline (?q=&types=&limit=). */
export const getTimeline = asyncHandler(async (req: Request, res: Response) => {
  const { q, types, limit } = parseTimelineQuery(req.query);
  const timeline = await aiOperatingSystem.timeline(currentUserId(req), {
    q,
    types: types as TimelineEntryType[] | undefined,
    limit,
  });
  res.status(200).json(ok(timeline, { count: timeline.length }));
});

/** GET /api/ai/actions — the contextual deep-link actions the learner can take now. */
export const getActions = asyncHandler(async (req: Request, res: Response) => {
  const actions = await aiOperatingSystem.actions(currentUserId(req));
  res.status(200).json(ok(actions, { count: actions.length }));
});

/** POST /api/ai/conversations/:id/summary — compress a conversation into a summary. */
export const summarizeConversation = asyncHandler(async (req: Request, res: Response) => {
  const conversation = await conversationService.summarize(currentUserId(req), req.params.id);
  res.status(200).json(ok(conversation));
});

/** GET /api/ai/conversations — the user's conversation list (?archived=true includes archived). */
export const getConversations = asyncHandler(async (req: Request, res: Response) => {
  const includeArchived = req.query.archived === 'true';
  const conversations = await conversationService.list(currentUserId(req), { includeArchived });
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

/** PATCH /api/ai/conversations/:id — rename / pin / archive. */
export const patchConversation = asyncHandler(async (req: Request, res: Response) => {
  const patch = parsePatchConversation(req.body);
  const conversation = await conversationService.update(currentUserId(req), req.params.id, patch);
  res.status(200).json(ok(conversation));
});

/** GET /api/ai/conversations/search?q= — search title + message content. */
export const searchConversations = asyncHandler(async (req: Request, res: Response) => {
  const { q } = parseSearchQuery(req.query);
  const results = await conversationService.search(currentUserId(req), q);
  res.status(200).json(ok(results, { count: results.length, query: q }));
});

/** POST /api/ai/conversations/export — export a conversation (markdown/json). */
export const exportConversation = asyncHandler(async (req: Request, res: Response) => {
  const { conversationId, format } = parseExport(req.body);
  const result = await conversationService.export(currentUserId(req), conversationId, format);
  res.status(200).json(ok(result));
});

/** GET /api/ai/context — the composed context for an intent (what the AI knows). */
export const getContext = asyncHandler(async (req: Request, res: Response) => {
  const opts = contextOptionsFromQuery(parseContextQuery(req.query));
  const context = await contextComposerService.compose(currentUserId(req), opts);
  res.status(200).json(ok(context));
});

/** GET /api/ai/context/preview — candidate sections with included/optional flags. */
export const getContextPreview = asyncHandler(async (req: Request, res: Response) => {
  const opts = contextOptionsFromQuery(parseContextQuery(req.query));
  const preview = await contextComposerService.preview(currentUserId(req), opts);
  res.status(200).json(ok(preview));
});

/** GET /api/ai/suggestions — personalised prompt suggestions. */
export const getSuggestions = asyncHandler(async (req: Request, res: Response) => {
  const snapshot = await workspaceService.getSnapshot(currentUserId(req));
  const suggestions = suggestionService.generate(snapshot);
  res.status(200).json(ok(suggestions, { count: suggestions.length }));
});

/** GET /api/ai/workspace — snapshot + suggestions + recent + recommendation + quick actions. */
export const getWorkspace = asyncHandler(async (req: Request, res: Response) => {
  const workspace = await workspaceService.getWorkspace(currentUserId(req));
  res.status(200).json(ok(workspace));
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
