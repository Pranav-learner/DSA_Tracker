import { AI_LIMITS } from '../../config/ai.js';

// Built from ASCII-only escape strings so the source has no fragile bytes.
/** Control characters except tab (U+0009) and newline (U+000A). */
const CONTROL_CHARS = new RegExp('[\\u0000-\\u0008\\u000B\\u000C\\u000E-\\u001F\\u007F]', 'g');
/** Zero-width spaces / joiners and BOM. */
const ZERO_WIDTH = new RegExp('[\\u200B-\\u200D\\uFEFF]', 'g');

/**
 * sanitizePrompt — defensive cleaning of user-supplied message text before it
 * enters the pipeline. Strips control/zero-width characters, collapses excessive
 * blank lines and caps the length. A first line of defence, not a full
 * prompt-injection firewall — the system prompt also instructs the model to treat
 * CONTEXT as read-only.
 */
export function sanitizePrompt(input: string): string {
  return input
    .replace(CONTROL_CHARS, '')
    .replace(ZERO_WIDTH, '')
    .replace(/\r\n/g, '\n')
    .replace(/\n{4,}/g, '\n\n\n')
    .trim()
    .slice(0, AI_LIMITS.maxMessageChars);
}
