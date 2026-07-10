import type { AiIntent } from '../types/ai.types.js';

/** Keyword rules per intent (rule-based classification for Sprint 1). */
const INTENT_RULES: { intent: AiIntent; patterns: RegExp }[] = [
  { intent: 'study-plan', patterns: /\b(study plan|roadmap|what should i (learn|study|do next)|plan my|schedule|next topic|learning path)\b/i },
  { intent: 'contest', patterns: /\b(contest|codeforces|leetcode weekly|atcoder|rating|div ?[12]|virtual contest|upsolve)\b/i },
  { intent: 'revision', patterns: /\b(revis\w*|spaced repetition|review\w*|forgot|retention|flashcard|due)\b/i },
  { intent: 'notebook', patterns: /\b(notebook|note|knowledge entry|document|write.?up|my notes)\b/i },
  { intent: 'pattern', patterns: /\b(pattern|technique|approach for|how do i solve|two pointers|sliding window|dynamic programming|\bdp\b|graph|greedy|backtrack)\b/i },
  { intent: 'interview', patterns: /\b(interview|mock|behavioral|system design|faang|offer|whiteboard)\b/i },
  { intent: 'analytics', patterns: /\b(analytics|stats|progress report|how am i doing|weakness|strength|trend|accuracy|metrics)\b/i },
];

/**
 * IntentRouterService — classifies an incoming request into an AiIntent. Sprint 1
 * uses transparent, rule-based keyword matching (first matching rule wins). The
 * boundary is deliberately a single `classify` method so a future AI/embedding
 * classifier can be dropped in behind the same signature with no caller changes.
 */
export const intentRouterService = {
  classify(message: string): AiIntent {
    const text = message.trim();
    if (!text) return 'unknown';
    for (const rule of INTENT_RULES) {
      if (rule.patterns.test(text)) return rule.intent;
    }
    // A non-empty message with no specific signal is general chat.
    return 'general';
  },
};
