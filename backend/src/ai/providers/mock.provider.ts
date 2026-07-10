import type { LLMProvider } from './llmProvider.js';
import type { LLMRequest, LLMResult, TokenSink, ProviderInfo } from '../types/ai.types.js';
import { PROVIDER_CATALOGUE } from '../../config/ai.js';
import { estimateTokens, estimateMessagesTokens } from '../utils/tokens.js';
import { AIError } from '../types/ai.types.js';

const CATALOGUE = PROVIDER_CATALOGUE.mock;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Pull a personalisation hint (e.g. "Level 5") out of the serialized context. */
function contextHint(req: LLMRequest): string {
  const system = req.messages.find((m) => m.role === 'system')?.content ?? '';
  const level = system.match(/Level\s+(\d+)/i)?.[1];
  const streak = system.match(/(\d+)-day streak/i)?.[1];
  const topic = system.match(/current topic[:\s]+([^\n.]+)/i)?.[1]?.trim();
  const bits: string[] = [];
  if (level) bits.push(`you're at **Level ${level}**`);
  if (streak) bits.push(`on a **${streak}-day streak**`);
  if (topic) bits.push(`currently working through **${topic}**`);
  return bits.length ? `I can see ${bits.join(', ')} — nice work. ` : '';
}

/**
 * Build a helpful, markdown-formatted mentor reply. This is a deterministic
 * template (no reasoning) so the platform works fully offline; a real provider
 * would use the same assembled prompt to generate a genuine answer.
 */
function composeReply(req: LLMRequest): string {
  const userMsg = [...req.messages].reverse().find((m) => m.role === 'user')?.content ?? '';
  const hint = contextHint(req);
  const topicWord = userMsg.trim().split(/\s+/).slice(0, 6).join(' ') || 'this';

  return [
    `### On "${topicWord}"`,
    ``,
    `${hint}Here's how I'd approach it.`,
    ``,
    `1. **Clarify the goal** — restate the problem in one sentence before writing any code.`,
    `2. **Find the pattern** — most problems map to a known template (two pointers, BFS/DFS, DP, binary search on the answer).`,
    `3. **Start from brute force**, then optimise the bottleneck.`,
    ``,
    `A quick skeleton to get moving:`,
    ``,
    '```python',
    `def solve(nums):`,
    `    # 1. handle edge cases`,
    `    if not nums:`,
    `        return 0`,
    `    # 2. core loop`,
    `    best = 0`,
    `    for x in nums:`,
    `        best = max(best, x)`,
    `    return best`,
    '```',
    ``,
    `> _This is the offline CP-OS Mentor. Connect an OpenAI key in **AI Settings** for full, reasoned answers._`,
  ].join('\n');
}

/** Normalise mock output into an LLMResult with estimated token usage. */
function finalize(req: LLMRequest, content: string, started: number, finishReason: LLMResult['finishReason']): LLMResult {
  if (!content && finishReason === 'stop') {
    throw new AIError('empty_response', 'Mock provider produced no content', 'mock');
  }
  const promptTokens = estimateMessagesTokens(req.messages);
  const completionTokens = estimateTokens(content);
  return {
    content,
    usage: { promptTokens, completionTokens, totalTokens: promptTokens + completionTokens },
    model: req.model,
    provider: 'mock',
    finishReason,
    responseTimeMs: Date.now() - started,
  };
}

/**
 * MockProvider — an offline, always-available provider. It streams a canned,
 * context-aware mentor reply so the whole AI pipeline (router → context → prompt
 * → gateway → provider) works end-to-end with no API keys, in tests and demos.
 */
export const mockProvider: LLMProvider = {
  id: 'mock',

  describe(): ProviderInfo {
    return {
      id: 'mock',
      label: CATALOGUE.label,
      models: CATALOGUE.models,
      capabilities: { streaming: true, contextWindow: CATALOGUE.models[0].contextWindow },
      available: true,
      health: 'Offline mentor — always available (no key required).',
    };
  },

  isAvailable() {
    return true;
  },

  async generate(req: LLMRequest): Promise<LLMResult> {
    const started = Date.now();
    const content = composeReply(req);
    return finalize(req, content, started, 'stop');
  },

  async stream(req: LLMRequest, onToken: TokenSink, signal?: AbortSignal): Promise<LLMResult> {
    const started = Date.now();
    const content = composeReply(req);
    // Stream token-by-token (word granularity) with a small human-feel delay.
    const tokens = content.match(/\S+\s*/g) ?? [content];
    let emitted = '';
    for (const tok of tokens) {
      if (signal?.aborted) {
        return finalize(req, emitted, started, 'aborted');
      }
      onToken(tok);
      emitted += tok;
      await sleep(10);
    }
    return finalize(req, content, started, 'stop');
  },
};
