import type { ProviderId, ModelInfo } from '../ai/types/ai.types.js';

/**
 * Central, configurable tuning for the AI Platform Layer (Module 7 · Sprint 1).
 * Provider catalogue, default generation settings, safety limits and secrets all
 * live here — the pipeline reads config, never hardcodes a model or a key.
 *
 * Secrets come from the environment and NEVER reach the client. When no OpenAI
 * key is configured the platform still works end-to-end via the offline `mock`
 * provider, which is the safe default.
 */

/** Provider API credentials — server-only, read from env (may be undefined). */
export const AI_SECRETS = {
  openaiApiKey: process.env.OPENAI_API_KEY ?? '',
  anthropicApiKey: process.env.ANTHROPIC_API_KEY ?? '',
  geminiApiKey: process.env.GEMINI_API_KEY ?? '',
  ollamaBaseUrl: process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434',
} as const;

/** Static provider metadata (models + capabilities), surfaced via /providers. */
export const PROVIDER_CATALOGUE: Record<ProviderId, { label: string; models: ModelInfo[]; streaming: boolean }> = {
  openai: {
    label: 'OpenAI',
    streaming: true,
    models: [
      { id: 'gpt-4o-mini', label: 'GPT-4o mini', contextWindow: 128_000 },
      { id: 'gpt-4o', label: 'GPT-4o', contextWindow: 128_000 },
    ],
  },
  anthropic: {
    label: 'Anthropic',
    streaming: true,
    models: [{ id: 'claude-3-5-sonnet', label: 'Claude 3.5 Sonnet', contextWindow: 200_000 }],
  },
  gemini: {
    label: 'Google Gemini',
    streaming: true,
    models: [{ id: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash', contextWindow: 1_000_000 }],
  },
  ollama: {
    label: 'Ollama (local)',
    streaming: true,
    models: [{ id: 'llama3.1', label: 'Llama 3.1', contextWindow: 128_000 }],
  },
  mock: {
    label: 'CP-OS Mentor (offline)',
    streaming: true,
    models: [{ id: 'cp-os-mentor-v1', label: 'CP-OS Mentor v1', contextWindow: 32_000 }],
  },
};

/** Default generation settings (a user's AISettings override these). */
export const AI_DEFAULTS = {
  /** When no OpenAI key is present, default to the always-available mock provider. */
  get provider(): ProviderId {
    const forced = process.env.AI_DEFAULT_PROVIDER as ProviderId | undefined;
    if (forced && forced in PROVIDER_CATALOGUE) return forced;
    return AI_SECRETS.openaiApiKey ? 'openai' : 'mock';
  },
  get model(): string {
    return PROVIDER_CATALOGUE[this.provider].models[0].id;
  },
  temperature: 0.7,
  maxTokens: 1024,
  streamingEnabled: true,
} as const;

/** Safety + performance limits. */
export const AI_LIMITS = {
  /** Max characters accepted for a single user message. */
  maxMessageChars: 8_000,
  /** Temperature bounds. */
  minTemperature: 0,
  maxTemperature: 2,
  /** maxTokens bounds. */
  minMaxTokens: 64,
  maxMaxTokens: 8_192,
  /** How many prior messages to include as conversation history. */
  historyWindow: 12,
  /** Provider call timeout (ms). */
  requestTimeoutMs: 60_000,
  /** Rough token budget for the assembled context. */
  maxContextTokens: 4_000,
} as const;

/** In-memory rate limit for AI endpoints (per user). */
export const AI_RATE_LIMIT = {
  windowMs: 60_000,
  maxRequests: 30,
} as const;
