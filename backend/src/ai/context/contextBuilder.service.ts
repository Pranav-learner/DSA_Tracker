import { dashboardService } from '../../services/dashboard.service.js';
import { gamificationProfileService } from '../../gamification/services/gamificationProfile.service.js';
import { activityService } from '../../services/activity.service.js';
import { notebookService } from '../../services/notebook.service.js';
import { patternIntelligenceService } from '../../analytics/services/patternIntelligence.service.js';
import { contestReadinessService } from '../../contests/services/contestReadiness.service.js';
import { resolveAnalyticsWindow } from '../../analytics/validators/analytics.validator.js';
import { estimateTokens } from '../utils/tokens.js';
import { logger } from '../../utils/logger.js';
import { INTENT_PROFILES, sectionsForProfiles } from './profiles.js';
import type { AIContext, AIContextSection, AiIntent } from '../types/ai.types.js';
import type { DashboardDTO } from '../../services/dashboard.dto.js';
import type { GamificationProfileDTO } from '../../gamification/dto/gamification.dto.js';
import type { ActivityDTO } from '../../services/activity.service.js';
import type { PaginatedDTO } from '../../services/problem.dto.js';
import type { NotebookListItemDTO } from '../../services/notebook.dto.js';
import type { WeaknessDTO, StrengthDTO } from '../../analytics/dto/intelligence.dto.js';
import type { ContestReadinessDTO } from '../../contests/dto/competitive.dto.js';

/** The lazily-fetched data sources a section can be built from. */
type SourceKey = 'dashboard' | 'profile' | 'activity' | 'notebook' | 'weaknesses' | 'strengths' | 'readiness';

interface ContextSources {
  dashboard?: DashboardDTO | null;
  profile?: GamificationProfileDTO | null;
  activity?: ActivityDTO[] | null;
  notebook?: PaginatedDTO<NotebookListItemDTO> | null;
  weaknesses?: WeaknessDTO[] | null;
  strengths?: StrengthDTO[] | null;
  readiness?: ContestReadinessDTO | null;
}

/** Which source(s) each section needs — drives lazy fetching (no over-fetch). */
const SECTION_SOURCES: Record<string, SourceKey[]> = {
  'learner-profile': ['dashboard', 'profile'],
  'learning-plan': ['dashboard'],
  progression: ['profile'],
  revision: ['dashboard'],
  knowledge: ['dashboard'],
  'notebook-entries': ['notebook'],
  'weak-patterns': ['weaknesses'],
  'strong-patterns': ['strengths'],
  'analytics-health': ['dashboard'],
  contest: ['dashboard'],
  'contest-readiness': ['readiness'],
  'recent-activity': ['activity'],
};

/** Fetchers per source (best-effort — wrapped by `safe`). */
const FETCHERS: Record<SourceKey, (userId: string) => Promise<unknown>> = {
  dashboard: (u) => dashboardService.get(u),
  profile: (u) => gamificationProfileService.getProfile(u),
  activity: (u) => activityService.getRecent(u, 6),
  notebook: (u) => notebookService.list(u, { page: 1, pageSize: 5, sort: 'recent', order: 'desc' }),
  weaknesses: (u) => patternIntelligenceService.weaknesses(u, resolveAnalyticsWindow({})),
  strengths: (u) => patternIntelligenceService.strengths(u, resolveAnalyticsWindow({})),
  readiness: (u) => contestReadinessService.compute(u),
};

/** Canonical section order for a stable, readable prompt. */
const SECTION_ORDER = [
  'learner-profile',
  'learning-plan',
  'progression',
  'weak-patterns',
  'strong-patterns',
  'revision',
  'knowledge',
  'notebook-entries',
  'analytics-health',
  'contest',
  'contest-readiness',
  'recent-activity',
];

/**
 * ContextBuilderService — builds structured context sections from EXISTING module
 * services (Sprint 2 refactor).
 *
 * CRITICAL boundary (unchanged): it consumes only services (DTOs), never business
 * models/repositories/the database, and never exposes raw models to the LLM. It
 * now builds sections *by key* with lazy source fetching, so the ContextComposer
 * can request exactly the sections a profile needs — nothing more is sent to the
 * LLM. Every fetch is best-effort: a failing source omits its section.
 */
export const contextBuilderService = {
  /** Build the requested sections (lazily fetching only the sources they need). */
  async buildSections(userId: string, keys: string[]): Promise<AIContextSection[]> {
    const wanted = new Set(keys);
    const neededSources = new Set<SourceKey>();
    for (const key of wanted) for (const s of SECTION_SOURCES[key] ?? []) neededSources.add(s);

    const sources: ContextSources = {};
    await Promise.all(
      [...neededSources].map(async (s) => {
        sources[s] = (await safe(() => FETCHERS[s](userId), s)) as never;
      }),
    );

    const sections: AIContextSection[] = [];
    for (const key of SECTION_ORDER) {
      if (!wanted.has(key)) continue;
      const section = BUILDERS[key]?.(sources);
      if (section) sections.push(section);
    }
    return sections;
  },

  /** Convenience: full context for an intent using its default profiles. */
  async build(userId: string, intent: AiIntent): Promise<AIContext> {
    const profiles = INTENT_PROFILES[intent] ?? [];
    const sections = await this.buildSections(userId, sectionsForProfiles(profiles));
    return {
      intent,
      profiles,
      sections,
      generatedAt: new Date().toISOString(),
      tokenEstimate: estimateSections(sections),
    };
  },
};

/** Token estimate of the serialized sections. */
export function estimateSections(sections: AIContextSection[]): number {
  return estimateTokens(sections.map((s) => `${s.title}\n${s.summary}`).join('\n\n'));
}

/* ------------------------------------------------------------------ *
 *  Section builders — each pure over the fetched sources.
 * ------------------------------------------------------------------ */

const BUILDERS: Record<string, (s: ContextSources) => AIContextSection | null> = {
  'learner-profile': ({ dashboard: d, profile: p }) => {
    if (!d && !p) return null;
    const lines: string[] = [];
    if (p) {
      const g = p.progression;
      lines.push(`Level ${g.level} (${g.tier}), ${g.totalXP} XP, ${g.currentStreak}-day streak (longest ${g.longestStreak}).`);
      lines.push(`Achievements ${p.achievements.unlocked}/${p.achievements.total}, ${p.badges.count} badges.`);
    }
    if (d) {
      if (d.currentPhase) lines.push(`Current phase: ${d.currentPhase.title}.`);
      if (d.currentTopic) lines.push(`Current topic: ${d.currentTopic.title} (mastery ${d.currentMastery}%).`);
      lines.push(`Overall completion ${d.overall.completionPercent}%, ${d.overall.topicsCompleted}/${d.overall.topicsTotal} topics.`);
    }
    return { key: 'learner-profile', title: 'Learner Profile', summary: lines.join(' ') };
  },

  progression: ({ profile: p }) => {
    if (!p) return null;
    const inProgress = p.achievements.inProgress.slice(0, 3).map((a) => `${a.title} (${a.progress}/${a.maxProgress})`);
    const challenges = p.challenges.active.slice(0, 3).map((c) => `${c.title} ${c.currentProgress}/${c.targetValue}`);
    return {
      key: 'progression',
      title: 'Progression & Goals',
      summary: [
        inProgress.length ? `Next milestones: ${inProgress.join('; ')}.` : '',
        challenges.length ? `Active challenges: ${challenges.join('; ')}.` : '',
      ].filter(Boolean).join(' ') || 'No active goals.',
    };
  },

  'learning-plan': ({ dashboard: d }) => {
    if (!d) return null;
    const r = d.recommendation;
    return {
      key: 'learning-plan',
      title: 'Recommended Next Step',
      summary: `${r.title}: ${r.message} (suggested action: ${r.actionLabel}). ${d.overall.topicsRemaining} topics remaining.`,
    };
  },

  revision: ({ dashboard: d }) => {
    if (!d) return null;
    const rev = d.revision;
    const ret = d.retention;
    return {
      key: 'revision',
      title: 'Revision & Retention',
      summary: `${rev.dueTodayCount} reviews due today, ${rev.overdueCount} overdue, ${rev.completedToday} done today. Average retention ${ret.averageRetention}%, ${ret.atRiskCount} items at risk.`,
    };
  },

  knowledge: ({ dashboard: d }) => {
    if (!d) return null;
    const k = d.knowledge;
    return {
      key: 'knowledge',
      title: 'Knowledge Base',
      summary: `${k.knowledgeEntries} notebook entries covering ${k.topicsCovered} topics; ${k.patternsLearned} patterns learned, ${k.patternsPending} pending. Coverage ${k.notebookCoveragePercent}%.`,
    };
  },

  'notebook-entries': ({ notebook: n }) => {
    if (!n || n.items.length === 0) return null;
    const items = n.items.slice(0, 5).map((e) => `• ${e.title} — ${e.pattern} (confidence ${e.confidence}%)`);
    return { key: 'notebook-entries', title: 'Recent Notebook Entries', summary: items.join('\n') };
  },

  'weak-patterns': ({ weaknesses: w }) => {
    if (!w || w.length === 0) return null;
    const items = w.slice(0, 4).map((x) => `• ${x.title} (${x.metric} ${x.value})`);
    return { key: 'weak-patterns', title: 'Weak Areas', summary: items.join('\n') };
  },

  'strong-patterns': ({ strengths: s }) => {
    if (!s || s.length === 0) return null;
    const items = s.slice(0, 4).map((x) => `• ${x.title} (${x.metric} ${x.value})`);
    return { key: 'strong-patterns', title: 'Strengths', summary: items.join('\n') };
  },

  'analytics-health': ({ dashboard: d }) => {
    if (!d) return null;
    const h = d.health;
    return {
      key: 'analytics-health',
      title: 'Learning Health',
      summary: `Health score ${h.overallScore}/100 (${h.overallStatus}). ${h.masteredTopics} topics mastered, ${h.topicsAtRisk} at risk, ${h.upcomingReviews} upcoming reviews.`,
    };
  },

  contest: ({ dashboard: d }) => {
    if (!d) return null;
    const c = d.contest;
    if (c.totalContests === 0) return { key: 'contest', title: 'Contests', summary: 'No contests recorded yet.' };
    return {
      key: 'contest',
      title: 'Contests',
      summary: `${c.totalContests} contests, current rating ${c.currentRating ?? 'n/a'} (peak ${c.highestRating ?? 'n/a'}). Latest change ${c.recentRatingChange ?? 0}. ${c.pendingUpsolve} pending upsolve.`,
    };
  },

  'contest-readiness': ({ readiness: r }) => {
    if (!r) return null;
    return {
      key: 'contest-readiness',
      title: 'Contest Readiness',
      summary: `Readiness ${r.overall}/100 (${r.status}). Strong: ${r.strongAreas.slice(0, 3).join(', ') || 'n/a'}. Weak: ${r.weakAreas.slice(0, 3).join(', ') || 'n/a'}.`,
    };
  },

  'recent-activity': ({ activity: a }) => {
    if (!a || a.length === 0) return null;
    return { key: 'recent-activity', title: 'Recent Activity', summary: a.slice(0, 5).map((x) => `• ${x.title}`).join('\n') };
  },
};

/** Run a context fetch, returning null (and logging) on failure — never throws. */
async function safe<T>(fn: () => Promise<T>, label: string): Promise<T | null> {
  try {
    return await fn();
  } catch (err) {
    logger.warn(`ContextBuilder: source '${label}' unavailable`, err);
    return null;
  }
}
