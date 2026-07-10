/**
 * Core AI-platform types (Module 7 · Sprint 1). These describe the *contract*
 * between the pipeline stages (router → context → prompt → gateway → provider) —
 * deliberately provider-agnostic so no OpenAI/Anthropic detail leaks upward.
 */

/** The message roles the pipeline and providers understand. */
export const CHAT_ROLES = ['system', 'user', 'assistant'] as const;
export type ChatRole = (typeof CHAT_ROLES)[number];

/** Rule-based intents the IntentRouter can classify a request into. */
export const AI_INTENTS = [
  'general',
  'study-plan',
  'contest',
  'revision',
  'notebook',
  'pattern',
  'interview',
  'analytics',
  'unknown',
] as const;
export type AiIntent = (typeof AI_INTENTS)[number];

/** The LLM providers the gateway can route to. */
export const PROVIDER_IDS = ['openai', 'anthropic', 'gemini', 'ollama', 'mock'] as const;
export type ProviderId = (typeof PROVIDER_IDS)[number];

/** A single message in the LLM conversation (provider-neutral). */
export interface LLMMessage {
  role: ChatRole;
  content: string;
}

/** A normalized request handed to a provider by the gateway. */
export interface LLMRequest {
  model: string;
  messages: LLMMessage[];
  temperature: number;
  maxTokens: number;
}

/** Token accounting returned by a provider (estimated for providers w/o usage). */
export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

/** The normalized result of a completion (streaming or not). */
export interface LLMResult {
  content: string;
  usage: TokenUsage;
  model: string;
  provider: ProviderId;
  finishReason: 'stop' | 'length' | 'error' | 'aborted';
  /** Wall-clock time the provider call took, in ms. */
  responseTimeMs: number;
}

/** Called for every streamed token/delta. */
export type TokenSink = (delta: string) => void;

/** Model metadata surfaced to the client via GET /providers. */
export interface ModelInfo {
  id: string;
  label: string;
  contextWindow: number;
}

/** Provider capabilities + health surfaced to the client. */
export interface ProviderInfo {
  id: ProviderId;
  label: string;
  models: ModelInfo[];
  capabilities: { streaming: boolean; contextWindow: number };
  /** True when the provider can actually serve requests (e.g. key present). */
  available: boolean;
  /** Human-readable health note (e.g. "no API key configured"). */
  health: string;
}

/* ------------------------------------------------------------------ *
 *  Structured context (never raw DB models — always DTO-derived text)
 * ------------------------------------------------------------------ */

/** One named summary block of learner context. */
export interface AIContextSection {
  key: string;
  title: string;
  /** Concise, human-readable summary safe to send to the LLM. */
  summary: string;
  /** Optional structured data for the UI's context indicator (not the LLM). */
  data?: Record<string, unknown>;
}

/**
 * Named, reusable context profiles (Sprint 2). Each profile is a bundle of
 * context sections; the ContextComposer merges the profiles an intent needs.
 */
export const CONTEXT_PROFILES = [
  'learning',
  'knowledge',
  'revision',
  'contest',
  'analytics',
  'gamification',
  'conversation',
] as const;
export type ContextProfileName = (typeof CONTEXT_PROFILES)[number];

/** The full structured context the ContextComposer assembles for a request. */
export interface AIContext {
  intent: AiIntent;
  /** The profiles that were merged to produce this context. */
  profiles: ContextProfileName[];
  sections: AIContextSection[];
  generatedAt: string;
  /** Rough token estimate of the serialized context (for budgeting/telemetry). */
  tokenEstimate: number;
}

/** A typed error for provider/pipeline failures, mapped to graceful responses. */
export class AIError extends Error {
  constructor(
    public readonly code:
      | 'provider_unavailable'
      | 'provider_error'
      | 'timeout'
      | 'rate_limited'
      | 'invalid_response'
      | 'empty_response'
      | 'context_error'
      | 'aborted',
    message: string,
    public readonly provider?: ProviderId,
  ) {
    super(message);
    this.name = 'AIError';
  }
}
