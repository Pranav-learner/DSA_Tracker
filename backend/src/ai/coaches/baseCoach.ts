import { Types } from 'mongoose';
import { contextComposerService } from '../context/contextComposer.service.js';
import { estimateSections } from '../context/contextBuilder.service.js';
import { promptBuilderService } from '../prompts/promptBuilder.service.js';
import { buildCoachSystemMessage } from '../prompts/templates.js';
import { loadCoachTemplate } from '../prompts/coaches/templateLoader.js';
import { responseValidator } from '../services/responseValidator.js';
import { llmGateway } from '../services/llmGateway.js';
import { aiSettingsService } from '../services/aiSettings.service.js';
import { conversationService } from '../services/conversation.service.js';
import { aiOrchestratorService } from '../orchestrator/aiOrchestrator.service.js';
import { sectionsForProfiles } from '../context/profiles.js';
import { sectionData, entityRoute, dedupeActions, ROUTES } from './actions.js';
import type { HistoryTurn } from '../prompts/promptBuilder.service.js';
import type {
  AIContext,
  AIContextSection,
  AiIntent,
  ContextProfileName,
  LLMMessage,
  LLMResult,
} from '../types/ai.types.js';
import type {
  Coach,
  CoachAction,
  CoachContextSpec,
  CoachFormatInput,
  CoachHandleOptions,
  CoachInput,
  CoachMeta,
  CoachRelatedTopic,
  CoachResult,
  CoachStructured,
} from './types.js';

/**
 * BaseCoach — the reusable orchestration every coach shares (Module 7 · Sprint 3).
 *
 * It owns the WHOLE pipeline exactly once (settings → conversation → context →
 * prompt → gateway → validate → persist → structured response) by REUSING the
 * existing platform services — it never re-implements prompt generation, context
 * building, provider routing or persistence. Concrete coaches only declare their
 * context spec + external template and override the small shaping hooks
 * (`recommendations`, `suggestedActions`, `relatedTopics`, `followUpQuestions`,
 * `confidence`). This is what eliminates duplicated logic across coaches.
 */
export abstract class BaseCoach implements Coach {
  abstract readonly id: string;
  abstract readonly intent: AiIntent;
  abstract readonly title: string;
  abstract readonly description: string;
  abstract readonly icon: string;
  /** External Markdown template basename (prompts/coaches/<templateName>.md). */
  abstract readonly templateName: string;
  abstract readonly outputs: string[];
  abstract readonly contextSpec: CoachContextSpec;

  /** Additional intents this coach can serve (besides its primary `intent`). */
  readonly extraIntents: AiIntent[] = [];
  /** Seed follow-up questions (coaches may extend/override). */
  readonly baseFollowUps: string[] = [];

  /** Content-derived version of the coach's external prompt template. */
  get promptVersion(): string {
    return loadCoachTemplate(this.templateName).version;
  }

  supports(intent: AiIntent): boolean {
    return intent === this.intent || this.extraIntents.includes(intent);
  }

  /** All profiles the coach draws on (required first, then optional). */
  get profiles(): ContextProfileName[] {
    return [...this.contextSpec.required, ...this.contextSpec.optional];
  }

  /** Build the coach's context via the ContextComposer, then trim to budget. */
  async buildContext(userId: string, opts: { excludeSections?: string[] } = {}): Promise<AIContext> {
    const context = await contextComposerService.compose(userId, {
      intent: this.intent,
      profiles: this.profiles,
      excludeSections: opts.excludeSections,
    });
    return this.trimToBudget(context);
  }

  /**
   * Enforce the coach's `maxContextTokens` using its priority order — required
   * sections are never dropped; the lowest-priority OPTIONAL sections go first.
   */
  protected trimToBudget(context: AIContext): AIContext {
    if (context.tokenEstimate <= this.contextSpec.maxContextTokens) return context;

    const requiredKeys = new Set(sectionsOf(this.contextSpec.required));
    const priority = this.contextSpec.priority;
    const rank = (key: string) => {
      const i = priority.indexOf(key);
      return i === -1 ? priority.length : i;
    };

    // Drop optional sections from the lowest priority upward until within budget.
    const sections = [...context.sections];
    const droppable = sections
      .filter((s) => !requiredKeys.has(s.key))
      .sort((a, b) => rank(b.key) - rank(a.key)); // worst-priority first

    let kept = sections;
    for (const drop of droppable) {
      if (estimateSections(kept) <= this.contextSpec.maxContextTokens) break;
      kept = kept.filter((s) => s.key !== drop.key);
    }

    return { ...context, sections: kept, tokenEstimate: estimateSections(kept) };
  }

  /** Assemble the prompt from the coach's EXTERNAL template (reuses PromptBuilder). */
  buildPrompt(context: AIContext, history: HistoryTurn[], message: string): LLMMessage[] {
    const tpl = loadCoachTemplate(this.templateName);
    const systemMessage = buildCoachSystemMessage(tpl.body, context);
    return promptBuilderService.build({ context, history, userMessage: message, systemMessage });
  }

  /** Default guard — the shared ResponseValidator. */
  validate(result: LLMResult): LLMResult {
    return responseValidator.validate(result);
  }

  /* ---- Shaping hooks (override in concrete coaches) ------------------- */

  /** Actionable recommendations derived from context (strings). */
  protected recommendations(_context: AIContext): string[] {
    return [];
  }

  /** Deep-link actions derived from context (override per coach). */
  suggestedActions(_context: AIContext): CoachAction[] {
    return [];
  }

  /** Related topics — default derives from weak/strong pattern sections. */
  protected relatedTopics(context: AIContext): CoachRelatedTopic[] {
    const out: CoachRelatedTopic[] = [];
    const weak = sectionData<{ items: { title: string; entityType: string; entityId: string | null }[] }>(context, 'weak-patterns');
    const strong = sectionData<{ items: { title: string; entityType: string; entityId: string | null }[] }>(context, 'strong-patterns');
    for (const x of weak?.items ?? []) out.push({ id: x.entityId, title: x.title, to: entityRoute(x.entityType, x.entityId) });
    for (const x of strong?.items ?? []) out.push({ id: x.entityId, title: x.title, to: entityRoute(x.entityType, x.entityId) });
    const learner = sectionData<{ currentTopicId: string | null; currentTopicTitle: string | null }>(context, 'learner-profile');
    if (learner?.currentTopicTitle) {
      out.unshift({ id: learner.currentTopicId, title: learner.currentTopicTitle, to: learner.currentTopicId ? ROUTES.topic(learner.currentTopicId) : null });
    }
    // Dedupe by title, cap.
    const seen = new Set<string>();
    return out.filter((t) => (seen.has(t.title) ? false : (seen.add(t.title), true))).slice(0, 5);
  }

  /** Follow-up questions (default: the coach's seeds). */
  protected followUpQuestions(_context: AIContext): string[] {
    return this.baseFollowUps.slice(0, 4);
  }

  /**
   * Confidence 40–95: how well the coach's context is populated. More of the
   * expected sections present (with data) → higher confidence.
   */
  protected confidence(context: AIContext): number {
    const expected = sectionsOf(this.profiles);
    if (expected.length === 0) return 60;
    const present = context.sections.filter((s) => expected.includes(s.key)).length;
    return Math.round(Math.min(95, Math.max(40, 45 + (present / expected.length) * 50)));
  }

  /** One-line summary — first meaningful line of the LLM answer, else a default. */
  protected summarize(content: string, _context: AIContext): string {
    const firstLine = content
      .split('\n')
      .map((l) => l.replace(/^#{1,6}\s*/, '').replace(/\*\*/g, '').trim())
      .find((l) => l.length > 0);
    const line = firstLine ?? `${this.title} guidance`;
    return line.length > 180 ? `${line.slice(0, 179)}…` : line;
  }

  /** Build the typed structured response from context + LLM content. */
  formatResponse({ context, content }: CoachFormatInput): CoachStructured {
    return {
      summary: this.summarize(content, context),
      explanation: content,
      recommendations: this.recommendations(context).slice(0, 6),
      suggestedActions: dedupeActions(this.suggestedActions(context)),
      relatedTopics: this.relatedTopics(context),
      confidence: this.confidence(context),
      sourcesUsed: context.sections.map((s) => s.title),
      followUpQuestions: this.followUpQuestions(context),
    };
  }

  meta(): CoachMeta {
    return {
      id: this.id,
      title: this.title,
      description: this.description,
      icon: this.icon,
      intent: this.intent,
      supportedIntents: [this.intent, ...this.extraIntents],
      outputs: this.outputs,
      usesProfiles: this.profiles,
      promptVersion: this.promptVersion,
      followUps: this.baseFollowUps,
    };
  }

  /**
   * Run the full coach turn. Streaming when `opts.onToken` is provided (only the
   * `explanation` streams; the structured scaffolding is deterministic and sent
   * with the final result). Cancellation via `opts.signal`.
   */
  async handle(userId: string, input: CoachInput, opts: CoachHandleOptions = {}): Promise<CoachResult> {
    // 1. Settings + provider/model resolution (graceful fallback).
    const settings = await aiSettingsService.resolve(userId);
    const requestedProvider = input.provider ?? settings.preferredProvider;
    const { id: provider, fellBack } = llmGateway.resolve(requestedProvider);
    const model = aiOrchestratorService.resolveModel(provider, fellBack ? undefined : input.model ?? settings.preferredModel);

    // 2. Conversation + prior history (before this turn).
    const conversation = await conversationService.resolveForChat(userId, input.conversationId, input.message);
    const conversationId = String(conversation._id);
    const history = await conversationService.history(conversationId);

    // 3. Persist the user turn.
    const userDoc = await conversationService.appendMessage({
      conversationId: conversation._id as Types.ObjectId,
      userId,
      role: 'user',
      content: input.message,
      contextSnapshot: null,
      provider: null,
      model: null,
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
      responseTime: 0,
    });

    // 4. Coach-specific context + prompt (reusing composer + prompt builder).
    const context = await this.buildContext(userId, { excludeSections: input.excludeSections });
    const messages = this.buildPrompt(context, history, input.message);

    // 5. Provider call (streaming or not).
    const req = { model, messages, temperature: settings.temperature, maxTokens: settings.maxTokens };
    const raw = opts.onToken
      ? await llmGateway.stream(provider, req, opts.onToken, opts.signal)
      : await llmGateway.generate(provider, req, opts.signal);

    // 6. Validate + shape the structured response.
    const result = this.validate(raw);
    const structured = this.formatResponse({ context, content: result.content, message: input.message });

    // 7. Persist the assistant turn with a coach-tagged context snapshot.
    const assistantDoc = await conversationService.appendMessage({
      conversationId: conversation._id as Types.ObjectId,
      userId,
      role: 'assistant',
      content: result.content,
      contextSnapshot: { ...aiOrchestratorService.snapshot(context), coachId: this.id, promptVersion: this.promptVersion },
      provider: result.provider,
      model: result.model,
      promptTokens: result.usage.promptTokens,
      completionTokens: result.usage.completionTokens,
      totalTokens: result.usage.totalTokens,
      responseTime: result.responseTimeMs,
    });

    await conversationService.recordTurnMeta(conversationId, {
      intent: this.intent,
      provider: result.provider,
      model: result.model,
      tokens: result.usage.totalTokens,
    });

    return {
      ...structured,
      coachId: this.id,
      intent: this.intent,
      promptVersion: this.promptVersion,
      provider,
      model: result.model,
      fellBack,
      conversationId,
      contextSections: context.sections,
      usage: result.usage,
      responseTime: result.responseTimeMs,
      userMessage: conversationService.toMessageDTO(userDoc),
      assistantMessage: conversationService.toMessageDTO(assistantDoc),
    };
  }
}

/** Resolve the concrete section keys contributed by a set of profiles. */
function sectionsOf(profiles: ContextProfileName[]): string[] {
  return sectionsForProfiles(profiles);
}

/** Re-export for concrete coaches that build actions from section data. */
export { sectionData, entityRoute, dedupeActions, ROUTES };
export type { AIContext, AIContextSection };
