import type { LLMRequest, LLMResult, TokenSink, ProviderInfo, ProviderId } from '../types/ai.types.js';

/**
 * LLMProvider — the abstraction every provider implements. The LLM Gateway talks
 * ONLY to this interface, so adding a provider (or swapping OpenAI for a local
 * model) never touches the orchestrator/pipeline. This is the core extension
 * seam of the platform.
 */
export interface LLMProvider {
  readonly id: ProviderId;

  /** Static metadata + live health for GET /providers. */
  describe(): ProviderInfo;

  /** Whether the provider can serve requests right now (key/host present). */
  isAvailable(): boolean;

  /** One-shot completion. */
  generate(req: LLMRequest, signal?: AbortSignal): Promise<LLMResult>;

  /**
   * Streaming completion — invokes `onToken` per delta and resolves with the
   * aggregated result (content + usage + timing) once the stream ends.
   */
  stream(req: LLMRequest, onToken: TokenSink, signal?: AbortSignal): Promise<LLMResult>;
}
