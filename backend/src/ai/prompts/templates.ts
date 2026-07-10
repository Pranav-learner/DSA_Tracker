import type { AIContext, AiIntent } from '../types/ai.types.js';

/**
 * Prompt templates (Module 7 · Sprint 1). Small, composable template functions —
 * NOT giant string concatenation. Each returns a section of the final prompt so
 * the PromptBuilder can assemble them declaratively and future sprints can swap
 * an individual template without touching the builder.
 */

/** The base system persona for the CP-OS mentor. */
export function systemPersona(): string {
  return [
    'You are the CP-OS Mentor — an expert competitive-programming and DSA coach embedded in the learner\'s workspace.',
    'You have access to a live snapshot of the learner\'s progress (provided below as CONTEXT).',
    'Be concise, encouraging and specific. Prefer concrete next steps and short code examples over generic advice.',
    'Use Markdown. Use fenced code blocks with a language tag for code.',
    'Only use the CONTEXT to personalise your answer; never invent stats that are not present.',
  ].join(' ');
}

/** A short hint that nudges the model toward the detected intent. */
export function intentDirective(intent: AiIntent): string {
  const map: Record<AiIntent, string> = {
    general: 'The learner is chatting generally — answer helpfully.',
    'study-plan': 'The learner wants planning help — suggest a focused, realistic next step.',
    contest: 'The learner is asking about contests — reference their rating/history if present.',
    revision: 'The learner is asking about revision/retention — prioritise what is due or at risk.',
    notebook: 'The learner is asking about their notebook/knowledge — reference coverage and gaps.',
    pattern: 'The learner is asking about a DSA pattern — explain the template and when to apply it.',
    interview: 'The learner is asking about interviews — be practical and structured.',
    analytics: 'The learner wants to understand their metrics — interpret their health/progress.',
    unknown: 'Intent is unclear — answer helpfully and ask a clarifying question if needed.',
  };
  return map[intent];
}

/** Serialize the structured context into a readable CONTEXT block (no raw models). */
export function renderContext(context: AIContext): string {
  if (context.sections.length === 0) return 'CONTEXT: (no learner context available)';
  const blocks = context.sections.map((s) => `## ${s.title}\n${s.summary}`);
  return ['CONTEXT (live snapshot of the learner — use to personalise):', ...blocks].join('\n\n');
}

/** Assemble the full system message from persona + intent + context. */
export function buildSystemMessage(context: AIContext): string {
  return [systemPersona(), '', intentDirective(context.intent), '', renderContext(context)].join('\n');
}

/** Placeholder title generator (Sprint 1) — first few words of the opening message. */
export function generateTitle(firstMessage: string): string {
  const cleaned = firstMessage.replace(/\s+/g, ' ').trim();
  if (!cleaned) return 'New conversation';
  const words = cleaned.split(' ').slice(0, 6).join(' ');
  return words.length < cleaned.length ? `${words}…` : words;
}
