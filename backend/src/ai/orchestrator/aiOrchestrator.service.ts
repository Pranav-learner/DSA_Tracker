import { intentRouterService } from '../router/intentRouter.service.js';
import { contextComposerService } from '../context/contextComposer.service.js';
import { promptBuilderService } from '../prompts/promptBuilder.service.js';
import { llmGateway } from '../services/llmGateway.js';
import { responseValidator } from '../services/responseValidator.js';
import { aiSettingsService } from '../services/aiSettings.service.js';
import { conversationService } from '../services/conversation.service.js';
import { providerRegistry } from '../providers/registry.js';
import { PROVIDER_CATALOGUE } from '../../config/ai.js';
import { Types } from 'mongoose';
import type { ChatResultDTO } from '../dto/ai.dto.js';
import type { TokenSink, ProviderId, LLMResult, AIContext, AiIntent, ContextProfileName } from '../types/ai.types.js';

export interface ChatInput {
  conversationId?: string;
  message: string;
  /** Optional per-request provider/model override (else the user's settings). */
  provider?: ProviderId;
  model?: string;
  /** Slash-command intent override (else the IntentRouter classifies). */
  intent?: AiIntent;
  /** Explicit context profiles (from a slash command). */
  profiles?: ContextProfileName[];
  /** Context sections toggled off in the Context Preview. */
  excludeSections?: string[];
}

export interface ChatOptions {
  /** When provided, the response streams and each delta is sent here. */
  onToken?: TokenSink;
  signal?: AbortSignal;
}

/**
 * AIOrchestratorService — coordinates the whole request pipeline and owns NO
 * provider-specific logic:
 *
 *   classify (IntentRouter) → build context (ContextBuilder) → assemble prompt
 *   (PromptBuilder) → call provider (LLMGateway) → validate (ResponseValidator)
 *   → persist (ConversationService).
 *
 * Streaming and non-streaming share this one path — pass `onToken` to stream.
 * Every stored message keeps full telemetry (provider/model/tokens/time + the
 * context snapshot) for future AI analytics.
 */
export const aiOrchestratorService = {
  async chat(userId: string, input: ChatInput, opts: ChatOptions = {}): Promise<ChatResultDTO> {
    const message = input.message;

    // 1. Settings + provider/model resolution (with graceful fallback).
    const settings = await aiSettingsService.resolve(userId);
    const requestedProvider = input.provider ?? settings.preferredProvider;
    const { id: provider, fellBack } = llmGateway.resolve(requestedProvider);
    const model = this.resolveModel(provider, fellBack ? undefined : input.model ?? settings.preferredModel);

    // 2. Resolve conversation + capture PRIOR history (before adding this turn).
    const conversation = await conversationService.resolveForChat(userId, input.conversationId, message);
    const conversationId = String(conversation._id);
    const history = await conversationService.history(conversationId);

    // 3. Persist the user turn.
    const userDoc = await conversationService.appendMessage({
      conversationId: conversation._id as Types.ObjectId,
      userId,
      role: 'user',
      content: message,
      contextSnapshot: null,
      provider: null,
      model: null,
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
      responseTime: 0,
    });

    // 4. Classify (or honour a slash-command override) → COMPOSE context →
    //    assemble prompt. The composer merges only the profiles this intent needs
    //    and drops any sections the learner toggled off in the Context Preview.
    const intent = input.intent ?? intentRouterService.classify(message);
    const context = await contextComposerService.compose(userId, {
      intent,
      profiles: input.profiles,
      excludeSections: input.excludeSections,
    });
    const messages = promptBuilderService.build({ context, history, userMessage: message });

    // 5. Call the provider (streaming or not) through the gateway.
    const req = { model, messages, temperature: settings.temperature, maxTokens: settings.maxTokens };
    let raw: LLMResult;
    if (opts.onToken) {
      raw = await llmGateway.stream(provider, req, opts.onToken, opts.signal);
    } else {
      raw = await llmGateway.generate(provider, req, opts.signal);
    }

    // 6. Validate + persist the assistant turn with telemetry + context snapshot.
    const result = responseValidator.validate(raw);
    const assistantDoc = await conversationService.appendMessage({
      conversationId: conversation._id as Types.ObjectId,
      userId,
      role: 'assistant',
      content: result.content,
      contextSnapshot: this.snapshot(context),
      provider: result.provider,
      model: result.model,
      promptTokens: result.usage.promptTokens,
      completionTokens: result.usage.completionTokens,
      totalTokens: result.usage.totalTokens,
      responseTime: result.responseTimeMs,
    });

    // Update conversation-level metadata (intent/provider/model/tokens) for the
    // sidebar + metadata card.
    await conversationService.recordTurnMeta(conversationId, {
      intent,
      provider: result.provider,
      model: result.model,
      tokens: result.usage.totalTokens,
    });

    return {
      conversationId,
      intent,
      profiles: context.profiles,
      provider,
      fellBack,
      contextSections: context.sections,
      userMessage: conversationService.toMessageDTO(userDoc),
      assistantMessage: conversationService.toMessageDTO(assistantDoc),
    };
  },

  /** Snap the model to one the provider actually serves (used on fallback). */
  resolveModel(provider: ProviderId, requested?: string): string {
    const models = PROVIDER_CATALOGUE[provider].models.map((m) => m.id);
    return requested && models.includes(requested) ? requested : models[0];
  },

  /** Compact, analytics-friendly context snapshot stored on the assistant turn. */
  snapshot(context: AIContext): Record<string, unknown> {
    return {
      intent: context.intent,
      profiles: context.profiles,
      sections: context.sections.map((s) => ({ key: s.key, title: s.title })),
      tokenEstimate: context.tokenEstimate,
      generatedAt: context.generatedAt,
    };
  },

  /** Provider catalogue + health for GET /providers. */
  providers() {
    return providerRegistry.describeAll();
  },
};
