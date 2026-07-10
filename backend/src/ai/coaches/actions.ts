import type { AIContext } from '../types/ai.types.js';
import type { CoachAction } from './types.js';

/**
 * Deep-link + context helpers for coaches (Module 7 · Sprint 3). Coaches derive
 * their structured `suggestedActions`/`relatedTopics` from the CONTEXT the
 * ContextComposer already built — reading each section's structured `data` and
 * mapping ids to the SAME in-app routes the rest of CP-OS uses. Centralising the
 * routes here keeps every coach's deep links consistent and refactor-safe.
 */
export const ROUTES = {
  dashboard: '/dashboard',
  roadmap: '/roadmap',
  revision: '/revision',
  revisionSession: '/revision/session',
  notebook: '/notebook',
  notebookEntry: (id: string) => `/notebook/${id}`,
  topic: (id: string) => `/topic/${id}`,
  problems: '/problems',
  patterns: '/analytics/patterns',
  pattern: (id: string) => `/analytics/patterns/${id}`,
  weaknesses: '/analytics/weaknesses',
  strengths: '/analytics/strengths',
  recommendations: '/analytics/recommendations',
  insights: '/analytics/insights',
  contests: '/contests',
  contestLearning: (id: string) => `/contests/${id}/learning`,
  upsolve: '/upsolve',
} as const;

/** Read a context section's structured `data` by key (or undefined). */
export function sectionData<T = Record<string, unknown>>(context: AIContext, key: string): T | undefined {
  return context.sections.find((s) => s.key === key)?.data as T | undefined;
}

/** Whether a section is present in the built context. */
export function hasSection(context: AIContext, key: string): boolean {
  return context.sections.some((s) => s.key === key);
}

/** Build a CoachAction (small factory so ids/kinds stay consistent). */
export function action(
  id: string,
  label: string,
  kind: string,
  to: string,
  opts: { primary?: boolean; intent?: CoachAction['intent'] } = {},
): CoachAction {
  return { id, label, kind, to, primary: opts.primary, intent: opts.intent };
}

/** Deduplicate actions by id, preserving order, capped at `max`. */
export function dedupeActions(actions: CoachAction[], max = 5): CoachAction[] {
  const seen = new Set<string>();
  const out: CoachAction[] = [];
  for (const a of actions) {
    if (seen.has(a.id)) continue;
    seen.add(a.id);
    out.push(a);
    if (out.length >= max) break;
  }
  return out;
}

/** Map a weakness/strength entity to a deep link (topic → /topic, pattern → /analytics/patterns). */
export function entityRoute(entityType: string | undefined, entityId: string | null | undefined): string | null {
  if (!entityId) return null;
  if (entityType === 'topic') return ROUTES.topic(entityId);
  if (entityType === 'pattern') return ROUTES.pattern(entityId);
  if (entityType === 'knowledgeEntry') return ROUTES.notebookEntry(entityId);
  return null;
}
