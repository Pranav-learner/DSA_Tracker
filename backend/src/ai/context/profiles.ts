import type { AiIntent, ContextProfileName } from '../types/ai.types.js';

/**
 * Context profiles (Module 7 · Sprint 2). A profile is a reusable, named bundle
 * of context *section keys*. The ContextComposer merges the profiles an intent
 * needs (plus any explicit overrides from a slash command / preview toggles) into
 * one context — so we only ever send the LLM what's relevant to the question.
 *
 * Sections are the granular unit the Context Preview toggles operate on; profiles
 * are the coarse unit slash commands select.
 */
export interface ContextProfile {
  label: string;
  description: string;
  /** Section keys this profile contributes (built by the ContextBuilder). */
  sections: string[];
}

/** `learner-profile` is ALWAYS included (the core identity) — never toggled off. */
export const CORE_SECTION = 'learner-profile';

export const CONTEXT_PROFILE_REGISTRY: Record<ContextProfileName, ContextProfile> = {
  learning: {
    label: 'Learning',
    description: 'Current phase/topic, recommended next step and weak areas.',
    sections: ['learning-plan', 'weak-patterns'],
  },
  knowledge: {
    label: 'Knowledge',
    description: 'Notebook coverage and recent knowledge entries.',
    sections: ['knowledge', 'notebook-entries'],
  },
  revision: {
    label: 'Revision',
    description: 'Due/overdue reviews and retention health.',
    sections: ['revision'],
  },
  contest: {
    label: 'Contests',
    description: 'Contest history, rating and readiness.',
    sections: ['contest', 'contest-readiness'],
  },
  analytics: {
    label: 'Analytics',
    description: 'Learning health, weakest and strongest patterns.',
    sections: ['analytics-health', 'weak-patterns', 'strong-patterns'],
  },
  gamification: {
    label: 'Progression',
    description: 'Level, XP, streak, achievements and challenges.',
    sections: ['progression'],
  },
  conversation: {
    label: 'Activity',
    description: 'Recent learning activity timeline.',
    sections: ['recent-activity'],
  },
};

/** Default profiles per detected intent (before overrides). */
export const INTENT_PROFILES: Record<AiIntent, ContextProfileName[]> = {
  general: ['learning', 'conversation'],
  'study-plan': ['learning', 'gamification', 'revision'],
  contest: ['contest', 'gamification'],
  revision: ['revision', 'learning'],
  notebook: ['knowledge'],
  pattern: ['knowledge', 'analytics', 'gamification'],
  interview: ['gamification', 'knowledge', 'learning'],
  analytics: ['analytics', 'gamification'],
  unknown: ['conversation'],
};

/** Map a slash command to (intent, profiles) so it can preselect context. */
export const SLASH_COMMANDS: Record<string, { intent: AiIntent; profiles: ContextProfileName[]; label: string }> = {
  study: { intent: 'study-plan', profiles: ['learning', 'gamification', 'revision'], label: 'Study planning' },
  revision: { intent: 'revision', profiles: ['revision', 'learning'], label: 'Revision help' },
  contest: { intent: 'contest', profiles: ['contest', 'gamification'], label: 'Contest prep' },
  notebook: { intent: 'notebook', profiles: ['knowledge'], label: 'Notebook & patterns' },
  analytics: { intent: 'analytics', profiles: ['analytics', 'gamification'], label: 'Analytics insight' },
  interview: { intent: 'interview', profiles: ['gamification', 'knowledge', 'learning'], label: 'Interview prep' },
  help: { intent: 'general', profiles: ['learning', 'conversation'], label: 'Help' },
};

/** Resolve the section keys for a set of profiles (deduped; core always first). */
export function sectionsForProfiles(profiles: ContextProfileName[]): string[] {
  const keys = new Set<string>([CORE_SECTION]);
  for (const p of profiles) {
    for (const s of CONTEXT_PROFILE_REGISTRY[p]?.sections ?? []) keys.add(s);
  }
  return [...keys];
}
