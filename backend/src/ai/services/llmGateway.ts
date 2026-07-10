import { providerRegistry } from '../providers/registry.js';
import { AIError } from '../types/ai.types.js';
import type { LLMRequest, LLMResult, TokenSink, ProviderId, ProviderInfo } from '../types/ai.types.js';
import { logger } from '../../utils/logger.js';

/** How the gateway resolved the provider for a call (for transparency/telemetry). */
export interface ResolvedProvider {
  id: ProviderId;
  /** True when the requested provider was unavailable and we fell back. */
  fellBack: boolean;
}

/**
 * LLMGateway — the ONLY thing that talks to providers. It resolves a ProviderId
 * to an implementation, applies a graceful fallback when the requested provider
 * is unavailable (so the UI never dead-ends on a missing key), and delegates the
 * actual completion. It contains no provider-specific logic — that lives behind
 * the LLMProvider interface.
 */
export const llmGateway = {
  /** Resolve the provider to use, falling back to the first available one. */
  resolve(requested: ProviderId): ResolvedProvider {
    const provider = providerRegistry.get(requested);
    if (provider?.isAvailable()) return { id: requested, fellBack: false };
    const fallback = providerRegistry.firstAvailable();
    if (fallback.id !== requested) {
      logger.warn(`AI provider '${requested}' unavailable — falling back to '${fallback.id}'`);
    }
    return { id: fallback.id, fellBack: fallback.id !== requested };
  },

  async generate(providerId: ProviderId, req: LLMRequest, signal?: AbortSignal): Promise<LLMResult> {
    const provider = providerRegistry.get(providerId);
    if (!provider) throw new AIError('provider_unavailable', `Unknown provider '${providerId}'`);
    return provider.generate(req, signal);
  },

  async stream(providerId: ProviderId, req: LLMRequest, onToken: TokenSink, signal?: AbortSignal): Promise<LLMResult> {
    const provider = providerRegistry.get(providerId);
    if (!provider) throw new AIError('provider_unavailable', `Unknown provider '${providerId}'`);
    return provider.stream(req, onToken, signal);
  },

  providers(): ProviderInfo[] {
    return providerRegistry.describeAll();
  },
};
