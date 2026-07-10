import type { LLMProvider } from './llmProvider.js';
import type { ProviderId, ProviderInfo } from '../types/ai.types.js';
import { openaiProvider } from './openai.provider.js';
import { anthropicProvider } from './anthropic.provider.js';
import { geminiProvider } from './gemini.provider.js';
import { ollamaProvider } from './ollama.provider.js';
import { mockProvider } from './mock.provider.js';

/**
 * Provider registry — the single lookup table the gateway uses to resolve a
 * ProviderId to an implementation. Registering a new provider is one line here;
 * nothing else in the platform changes.
 */
const REGISTRY: Record<ProviderId, LLMProvider> = {
  openai: openaiProvider,
  anthropic: anthropicProvider,
  gemini: geminiProvider,
  ollama: ollamaProvider,
  mock: mockProvider,
};

export const providerRegistry = {
  get(id: ProviderId): LLMProvider | undefined {
    return REGISTRY[id];
  },

  all(): LLMProvider[] {
    return Object.values(REGISTRY);
  },

  /** Health + capabilities for every provider (GET /providers). */
  describeAll(): ProviderInfo[] {
    return this.all().map((p) => p.describe());
  },

  /** The first available provider, preferring `preferred` — used as a fallback. */
  firstAvailable(preferred?: ProviderId): LLMProvider {
    if (preferred) {
      const p = REGISTRY[preferred];
      if (p?.isAvailable()) return p;
    }
    const available = this.all().find((p) => p.isAvailable());
    // `mock` is always available, so this never returns undefined.
    return available ?? mockProvider;
  },
};
