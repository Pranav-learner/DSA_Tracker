import { AIError } from '../types/ai.types.js';
import type { LLMResult } from '../types/ai.types.js';
import { logger } from '../../utils/logger.js';

/**
 * ResponseValidator — the guard between raw provider output and the rest of the
 * app. It asserts the result is well-formed (non-empty content, sane token
 * accounting) and normalises token totals, so the UI is protected from provider
 * quirks and partial failures. Malformed output raises a typed `AIError` the
 * orchestrator maps to a graceful message.
 */
export const responseValidator = {
  validate(result: LLMResult): LLMResult {
    if (result.finishReason === 'error') {
      throw new AIError('provider_error', 'Provider reported an error finish', result.provider);
    }
    const content = (result.content ?? '').trim();
    if (!content && result.finishReason !== 'aborted') {
      throw new AIError('empty_response', 'Provider returned an empty response', result.provider);
    }

    // Normalise usage (some providers omit totals or report partials).
    const promptTokens = Math.max(0, result.usage.promptTokens || 0);
    const completionTokens = Math.max(0, result.usage.completionTokens || 0);
    const totalTokens = result.usage.totalTokens || promptTokens + completionTokens;

    if (totalTokens === 0) {
      logger.warn(`AI response from '${result.provider}' had no token usage — using estimates`);
    }

    return {
      ...result,
      content,
      usage: { promptTokens, completionTokens, totalTokens },
    };
  },
};
