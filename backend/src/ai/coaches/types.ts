import type {
  AiIntent,
  AIContext,
  AIContextSection,
  ContextProfileName,
  LLMMessage,
  LLMResult,
  ProviderId,
  TokenUsage,
  TokenSink,
} from '../types/ai.types.js';
import type { HistoryTurn } from '../prompts/promptBuilder.service.js';
import type { MessageDTO } from '../dto/ai.dto.js';

/**
 * Coaching Framework types (Module 7 · Sprint 3).
 *
 * A Coach turns the generic mentor into a domain specialist. Every coach shares
 * the SAME AI infrastructure (ContextComposer → PromptBuilder → LLMGateway) and
 * only declares WHAT context it needs and HOW to shape the structured response —
 * it never re-implements prompt generation, context building or business logic.
 */

/**
 * A coach's context declaration. The BaseCoach uses this to ask the
 * ContextComposer for exactly the right profiles and to trim to budget by
 * priority (required sections are never dropped).
 */
export interface CoachContextSpec {
  /** Profiles that MUST be present (their sections are never trimmed). */
  required: ContextProfileName[];
  /** Profiles included when they fit the budget. */
  optional: ContextProfileName[];
  /** Rough token ceiling for this coach's assembled context. */
  maxContextTokens: number;
  /** Section-key priority (first = most important) used when trimming to budget. */
  priority: string[];
}

/** A deep-link action button attached to a coach response. */
export interface CoachAction {
  id: string;
  label: string;
  /** Semantic kind (e.g. 'open-revision', 'practice-problem') for the UI icon. */
  kind: string;
  /** In-app route to deep-link into (empty when `intent` switches coach instead). */
  to: string;
  /** When set, tapping switches the active coach rather than navigating. */
  intent?: AiIntent;
  primary?: boolean;
}

/** A related topic/pattern reference (optionally deep-linkable). */
export interface CoachRelatedTopic {
  id: string | null;
  title: string;
  to: string | null;
}

/**
 * The deterministic, typed scaffolding a coach derives from CONTEXT (via the
 * existing services' DTOs) — independent of the LLM. The LLM only fills
 * `explanation` (and optionally refines `summary`).
 */
export interface CoachStructured {
  summary: string;
  explanation: string;
  recommendations: string[];
  suggestedActions: CoachAction[];
  relatedTopics: CoachRelatedTopic[];
  confidence: number;
  sourcesUsed: string[];
  followUpQuestions: string[];
}

/** The full coach turn result (structured response + telemetry + persistence). */
export interface CoachResult extends CoachStructured {
  coachId: string;
  intent: AiIntent;
  promptVersion: string;
  provider: ProviderId;
  model: string;
  /** True when the requested provider was unavailable and the gateway fell back. */
  fellBack: boolean;
  conversationId: string;
  contextSections: AIContextSection[];
  usage: TokenUsage;
  responseTime: number;
  userMessage: MessageDTO;
  assistantMessage: MessageDTO;
}

/** Public coach metadata (for GET /coaches and the coach selector). */
export interface CoachMeta {
  id: string;
  title: string;
  description: string;
  icon: string;
  /** The primary intent this coach owns. */
  intent: AiIntent;
  /** Every intent this coach can serve. */
  supportedIntents: AiIntent[];
  /** Human-readable outputs it produces (e.g. "Today's Study Plan"). */
  outputs: string[];
  /** Context profiles it draws on. */
  usesProfiles: ContextProfileName[];
  promptVersion: string;
  /** Seed follow-up questions the coach can suggest. */
  followUps: string[];
}

/** Input to a coach turn (from POST /ai/coach). */
export interface CoachInput {
  conversationId?: string;
  message: string;
  provider?: ProviderId;
  model?: string;
  /** Context sections toggled off in the Context Preview. */
  excludeSections?: string[];
}

/** Options controlling a coach turn (streaming + cancellation). */
export interface CoachHandleOptions {
  onToken?: TokenSink;
  signal?: AbortSignal;
}

/** Everything `formatResponse` needs to build the structured scaffolding. */
export interface CoachFormatInput {
  context: AIContext;
  content: string;
  message: string;
}

/**
 * The Coach contract. Concrete coaches extend BaseCoach and typically override
 * only the shaping hooks (`recommendations`, `suggestedActions`, `relatedTopics`,
 * `followUpQuestions`, `confidence`) — the pipeline lives in BaseCoach.
 */
export interface Coach {
  readonly id: string;
  readonly intent: AiIntent;
  readonly title: string;
  readonly description: string;
  readonly icon: string;
  readonly promptVersion: string;
  readonly outputs: string[];
  readonly contextSpec: CoachContextSpec;

  /** Whether this coach can serve the given intent. */
  supports(intent: AiIntent): boolean;
  /** Build the coach's context (required + optional profiles, trimmed to budget). */
  buildContext(userId: string, opts: { excludeSections?: string[] }): Promise<AIContext>;
  /** Assemble the provider-neutral prompt from the coach's external template. */
  buildPrompt(context: AIContext, history: HistoryTurn[], message: string): LLMMessage[];
  /** Guard raw provider output (defaults to the shared ResponseValidator). */
  validate(result: LLMResult): LLMResult;
  /** Deep-link actions derived from context. */
  suggestedActions(context: AIContext): CoachAction[];
  /** Shape the structured response from context + LLM content. */
  formatResponse(input: CoachFormatInput): CoachStructured;
  /** Public metadata. */
  meta(): CoachMeta;
  /** Run the full coach pipeline (orchestration lives in BaseCoach). */
  handle(userId: string, input: CoachInput, opts?: CoachHandleOptions): Promise<CoachResult>;
}
