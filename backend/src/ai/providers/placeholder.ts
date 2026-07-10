import type { LLMProvider } from './llmProvider.js';
import type { LLMRequest, TokenSink, ProviderInfo, ProviderId } from '../types/ai.types.js';
import { AIError } from '../types/ai.types.js';
import { PROVIDER_CATALOGUE } from '../../config/ai.js';

/**
 * makePlaceholderProvider — a compiling, non-functional provider stub. Sprint 1
 * ships the provider *interface* and OpenAI + mock implementations; Anthropic,
 * Gemini and Ollama are wired into the registry as placeholders so the catalogue
 * is complete and a future sprint just fills in `generate`/`stream`. They report
 * `available: false` and throw a typed `provider_unavailable` error if invoked,
 * so the gateway degrades gracefully rather than crashing.
 */
export function makePlaceholderProvider(id: ProviderId, healthNote: string): LLMProvider {
  const cat = PROVIDER_CATALOGUE[id];
  const unavailable = (): never => {
    throw new AIError('provider_unavailable', `${cat.label} is not implemented yet (Sprint 1 placeholder)`, id);
  };
  return {
    id,
    describe(): ProviderInfo {
      return {
        id,
        label: cat.label,
        models: cat.models,
        capabilities: { streaming: cat.streaming, contextWindow: cat.models[0].contextWindow },
        available: false,
        health: healthNote,
      };
    },
    isAvailable: () => false,
    generate: (_req: LLMRequest) => Promise.resolve(unavailable()),
    stream: (_req: LLMRequest, _onToken: TokenSink) => Promise.resolve(unavailable()),
  };
}
