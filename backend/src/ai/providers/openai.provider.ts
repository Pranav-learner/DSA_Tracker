import type { LLMProvider } from './llmProvider.js';
import type { LLMRequest, LLMResult, TokenSink, ProviderInfo, TokenUsage } from '../types/ai.types.js';
import { AIError } from '../types/ai.types.js';
import { AI_SECRETS, PROVIDER_CATALOGUE, AI_LIMITS } from '../../config/ai.js';
import { estimateTokens, estimateMessagesTokens } from '../utils/tokens.js';

const CATALOGUE = PROVIDER_CATALOGUE.openai;
const ENDPOINT = 'https://api.openai.com/v1/chat/completions';

/** Combine the caller's abort signal with an internal request timeout. */
function withTimeout(signal?: AbortSignal): { signal: AbortSignal; done: () => void } {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(new AIError('timeout', 'OpenAI request timed out', 'openai')), AI_LIMITS.requestTimeoutMs);
  const onAbort = () => controller.abort(signal?.reason);
  if (signal) {
    if (signal.aborted) controller.abort(signal.reason);
    else signal.addEventListener('abort', onAbort, { once: true });
  }
  return {
    signal: controller.signal,
    done: () => {
      clearTimeout(timer);
      signal?.removeEventListener('abort', onAbort);
    },
  };
}

function authHeaders(): Record<string, string> {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${AI_SECRETS.openaiApiKey}` };
}

/**
 * OpenAIProvider — the first fully-implemented provider. Talks to the Chat
 * Completions API over `fetch` (streaming + non-streaming), normalises the
 * result into the platform's `LLMResult`, and maps every failure onto a typed
 * `AIError` so the orchestrator can degrade gracefully. Gated on a server-side
 * API key — the key NEVER leaves the backend.
 */
export const openaiProvider: LLMProvider = {
  id: 'openai',

  describe(): ProviderInfo {
    const available = this.isAvailable();
    return {
      id: 'openai',
      label: CATALOGUE.label,
      models: CATALOGUE.models,
      capabilities: { streaming: true, contextWindow: CATALOGUE.models[0].contextWindow },
      available,
      health: available ? 'Ready (API key configured).' : 'No OPENAI_API_KEY configured.',
    };
  },

  isAvailable() {
    return Boolean(AI_SECRETS.openaiApiKey);
  },

  async generate(req: LLMRequest, signal?: AbortSignal): Promise<LLMResult> {
    if (!this.isAvailable()) throw new AIError('provider_unavailable', 'OpenAI key not configured', 'openai');
    const started = Date.now();
    const { signal: sig, done } = withTimeout(signal);
    try {
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          model: req.model,
          messages: req.messages,
          temperature: req.temperature,
          max_tokens: req.maxTokens,
          stream: false,
        }),
        signal: sig,
      });
      if (!res.ok) throw await providerError(res);
      const json = (await res.json()) as OpenAIResponse;
      const content = json.choices?.[0]?.message?.content ?? '';
      return {
        content,
        usage: usageFrom(json.usage, req, content),
        model: json.model ?? req.model,
        provider: 'openai',
        finishReason: json.choices?.[0]?.finish_reason === 'length' ? 'length' : 'stop',
        responseTimeMs: Date.now() - started,
      };
    } catch (err) {
      throw normalizeError(err);
    } finally {
      done();
    }
  },

  async stream(req: LLMRequest, onToken: TokenSink, signal?: AbortSignal): Promise<LLMResult> {
    if (!this.isAvailable()) throw new AIError('provider_unavailable', 'OpenAI key not configured', 'openai');
    const started = Date.now();
    const { signal: sig, done } = withTimeout(signal);
    let content = '';
    let usage: TokenUsage | undefined;
    let finishReason: LLMResult['finishReason'] = 'stop';
    try {
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          model: req.model,
          messages: req.messages,
          temperature: req.temperature,
          max_tokens: req.maxTokens,
          stream: true,
          stream_options: { include_usage: true },
        }),
        signal: sig,
      });
      if (!res.ok) throw await providerError(res);
      if (!res.body) throw new AIError('provider_error', 'OpenAI returned no stream body', 'openai');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      for (;;) {
        const { done: streamDone, value } = await reader.read();
        if (streamDone) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data:')) continue;
          const payload = trimmed.slice(5).trim();
          if (payload === '[DONE]') continue;
          try {
            const chunk = JSON.parse(payload) as OpenAIStreamChunk;
            const delta = chunk.choices?.[0]?.delta?.content;
            if (delta) {
              content += delta;
              onToken(delta);
            }
            if (chunk.choices?.[0]?.finish_reason === 'length') finishReason = 'length';
            if (chunk.usage) usage = { promptTokens: chunk.usage.prompt_tokens, completionTokens: chunk.usage.completion_tokens, totalTokens: chunk.usage.total_tokens };
          } catch {
            // Ignore keep-alive / partial lines.
          }
        }
      }
      return {
        content,
        usage: usage ?? { promptTokens: estimateMessagesTokens(req.messages), completionTokens: estimateTokens(content), totalTokens: 0 },
        model: req.model,
        provider: 'openai',
        finishReason,
        responseTimeMs: Date.now() - started,
      };
    } catch (err) {
      throw normalizeError(err);
    } finally {
      done();
    }
  },
};

/* -- helpers + minimal response shapes -- */

interface OpenAIResponse {
  model?: string;
  choices?: { message?: { content?: string }; finish_reason?: string }[];
  usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
}
interface OpenAIStreamChunk {
  choices?: { delta?: { content?: string }; finish_reason?: string }[];
  usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
}

function usageFrom(u: OpenAIResponse['usage'], req: LLMRequest, content: string): TokenUsage {
  if (u) return { promptTokens: u.prompt_tokens, completionTokens: u.completion_tokens, totalTokens: u.total_tokens };
  const p = estimateMessagesTokens(req.messages);
  const c = estimateTokens(content);
  return { promptTokens: p, completionTokens: c, totalTokens: p + c };
}

async function providerError(res: Response): Promise<AIError> {
  const body = await res.text().catch(() => '');
  if (res.status === 429) return new AIError('rate_limited', 'OpenAI rate limit exceeded', 'openai');
  if (res.status === 401) return new AIError('provider_unavailable', 'OpenAI rejected the API key', 'openai');
  return new AIError('provider_error', `OpenAI error ${res.status}: ${body.slice(0, 200)}`, 'openai');
}

function normalizeError(err: unknown): AIError {
  if (err instanceof AIError) return err;
  if (err instanceof Error && err.name === 'AbortError') return new AIError('aborted', 'OpenAI request aborted', 'openai');
  return new AIError('provider_error', err instanceof Error ? err.message : 'OpenAI request failed', 'openai');
}
