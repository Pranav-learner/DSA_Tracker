import { buildSystemMessage } from './templates.js';
import { AI_LIMITS } from '../../config/ai.js';
import { estimateMessagesTokens } from '../utils/tokens.js';
import type { AIContext, LLMMessage } from '../types/ai.types.js';

/** A prior turn from the stored conversation (role + content only). */
export interface HistoryTurn {
  role: 'user' | 'assistant';
  content: string;
}

export interface BuildPromptInput {
  context: AIContext;
  history: HistoryTurn[];
  userMessage: string;
  /**
   * Optional pre-built system message (Sprint 3 coaches supply their own, built
   * from an external template). When omitted the default mentor system message is
   * assembled from the context.
   */
  systemMessage?: string;
}

/**
 * PromptBuilderService — assembles the final provider-neutral message array from
 * composable templates: [system(persona + intent + context), ...history, user].
 * Template-based (see templates.ts) rather than string concatenation, so the
 * shape is declarative and testable. History is trimmed to the configured window
 * to stay within the context budget.
 */
export const promptBuilderService = {
  build({ context, history, userMessage, systemMessage }: BuildPromptInput): LLMMessage[] {
    const messages: LLMMessage[] = [{ role: 'system', content: systemMessage ?? buildSystemMessage(context) }];

    // Keep only the most recent turns (window), preserving order.
    const trimmed = history.slice(-AI_LIMITS.historyWindow);
    for (const turn of trimmed) messages.push({ role: turn.role, content: turn.content });

    messages.push({ role: 'user', content: userMessage });
    return messages;
  },

  /** Rough token size of an assembled prompt (for budgeting/telemetry). */
  estimateTokens(messages: LLMMessage[]): number {
    return estimateMessagesTokens(messages);
  },
};
