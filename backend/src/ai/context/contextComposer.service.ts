import { contextBuilderService, estimateSections } from './contextBuilder.service.js';
import { INTENT_PROFILES, sectionsForProfiles, CORE_SECTION } from './profiles.js';
import { estimateTokens } from '../utils/tokens.js';
import { AI_LIMITS } from '../../config/ai.js';
import type { AIContext, AiIntent, ContextProfileName, AIContextSection } from '../types/ai.types.js';

export interface ComposeOptions {
  intent: AiIntent;
  /** Explicit profiles (from a slash command); defaults to the intent's profiles. */
  profiles?: ContextProfileName[];
  /** Section keys the user toggled OFF in the Context Preview. */
  excludeSections?: string[];
}

/** One row of the Context Preview — a candidate section + whether it's included. */
export interface ContextPreviewSection {
  key: string;
  title: string;
  /** Whether it will actually be sent (respecting the user's toggles). */
  included: boolean;
  /** Whether it can be toggled off (the core learner profile cannot). */
  optional: boolean;
  tokenEstimate: number;
  preview: string;
}

export interface ContextPreview {
  intent: AiIntent;
  profiles: ContextProfileName[];
  sections: ContextPreviewSection[];
  includedTokens: number;
  /** True if the included context exceeds the configured budget. */
  overBudget: boolean;
}

/**
 * ContextComposer — the Sprint 2 brain of Context Intelligence. It decides WHICH
 * context to assemble for a request: it merges the profiles an intent needs (or a
 * slash command selected), removes anything the learner toggled off in the
 * Context Preview, and asks the ContextBuilder for exactly those sections. This
 * is what keeps prompts relevant and small — the LLM only ever sees what matters
 * to the question.
 */
export const contextComposerService = {
  /** Assemble the final context for a chat turn. */
  async compose(userId: string, opts: ComposeOptions): Promise<AIContext> {
    const profiles = opts.profiles?.length ? opts.profiles : INTENT_PROFILES[opts.intent] ?? [];
    const exclude = new Set(opts.excludeSections ?? []);
    const keys = sectionsForProfiles(profiles).filter((k) => k === CORE_SECTION || !exclude.has(k));

    const sections = await contextBuilderService.buildSections(userId, keys);
    return {
      intent: opts.intent,
      profiles,
      sections,
      generatedAt: new Date().toISOString(),
      tokenEstimate: estimateSections(sections),
    };
  },

  /**
   * Build the Context Preview: every candidate section for the intent/profiles,
   * marked included/optional with a token estimate — so the UI can show exactly
   * what will be sent and let the learner toggle optional sections off.
   */
  async preview(userId: string, opts: ComposeOptions): Promise<ContextPreview> {
    const profiles = opts.profiles?.length ? opts.profiles : INTENT_PROFILES[opts.intent] ?? [];
    const exclude = new Set(opts.excludeSections ?? []);
    const candidateKeys = sectionsForProfiles(profiles);

    // Build ALL candidates so the preview shows real content + token sizes.
    const built = await contextBuilderService.buildSections(userId, candidateKeys);
    const byKey = new Map(built.map((s) => [s.key, s]));

    const sections: ContextPreviewSection[] = candidateKeys
      .map((key) => byKey.get(key))
      .filter((s): s is AIContextSection => Boolean(s))
      .map((s) => {
        const optional = s.key !== CORE_SECTION;
        const included = !optional || !exclude.has(s.key);
        return {
          key: s.key,
          title: s.title,
          included,
          optional,
          tokenEstimate: estimateTokens(s.summary),
          preview: s.summary.length > 140 ? `${s.summary.slice(0, 140)}…` : s.summary,
        };
      });

    const includedTokens = sections.filter((s) => s.included).reduce((sum, s) => sum + s.tokenEstimate, 0);
    return {
      intent: opts.intent,
      profiles,
      sections,
      includedTokens,
      overBudget: includedTokens > AI_LIMITS.maxContextTokens,
    };
  },
};
