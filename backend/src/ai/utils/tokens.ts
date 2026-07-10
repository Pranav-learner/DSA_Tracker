import type { LLMMessage } from '../types/ai.types.js';

/**
 * Rough token estimation (~4 chars/token) — good enough for budgeting and for
 * providers that don't return usage (mock/placeholder). Never used for billing.
 */
export function estimateTokens(text: string): number {
  if (!text) return 0;
  return Math.max(1, Math.ceil(text.length / 4));
}

export function estimateMessagesTokens(messages: LLMMessage[]): number {
  // +4 tokens/message overhead approximates chat formatting.
  return messages.reduce((sum, m) => sum + estimateTokens(m.content) + 4, 0);
}
