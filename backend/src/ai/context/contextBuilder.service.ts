import { dashboardService } from '../../services/dashboard.service.js';
import { gamificationProfileService } from '../../gamification/services/gamificationProfile.service.js';
import { activityService } from '../../services/activity.service.js';
import { estimateTokens } from '../utils/tokens.js';
import { logger } from '../../utils/logger.js';
import type { AIContext, AIContextSection, AiIntent } from '../types/ai.types.js';
import type { DashboardDTO } from '../../services/dashboard.dto.js';
import type { GamificationProfileDTO } from '../../gamification/dto/gamification.dto.js';
import type { ActivityDTO } from '../../services/activity.service.js';

/** Which context sections each intent needs (learner-profile is always included). */
const INTENT_SECTIONS: Record<AiIntent, string[]> = {
  general: ['recent-activity'],
  'study-plan': ['learning-plan', 'progression'],
  contest: ['contest', 'progression'],
  revision: ['revision'],
  notebook: ['knowledge'],
  pattern: ['knowledge', 'progression'],
  interview: ['progression', 'knowledge'],
  analytics: ['analytics-health', 'progression'],
  unknown: ['recent-activity'],
};

/**
 * ContextBuilderService — assembles the structured learner context for a request.
 *
 * CRITICAL boundary: it consumes only existing *services* (which return DTOs) and
 * NEVER reads business models/repositories or the database directly. Each section
 * is a concise, human-readable summary derived from a DTO — raw models are never
 * exposed to the LLM. Every fetch is best-effort: a failing section is logged and
 * omitted (a context error never fails the whole request).
 */
export const contextBuilderService = {
  async build(userId: string, intent: AiIntent): Promise<AIContext> {
    // One dashboard + one profile call covers most sections (no N+1 fan-out).
    const [dashboard, profile] = await Promise.all([
      safe(() => dashboardService.get(userId), 'dashboard'),
      safe(() => gamificationProfileService.getProfile(userId), 'profile'),
    ]);

    const wanted = new Set(['learner-profile', ...(INTENT_SECTIONS[intent] ?? [])]);
    const sections: AIContextSection[] = [];
    const push = (s: AIContextSection | null) => {
      if (s) sections.push(s);
    };

    if (wanted.has('learner-profile')) push(this.learnerProfile(dashboard, profile));
    if (wanted.has('progression')) push(this.progression(profile));
    if (wanted.has('learning-plan')) push(this.learningPlan(dashboard));
    if (wanted.has('revision')) push(this.revision(dashboard));
    if (wanted.has('knowledge')) push(this.knowledge(dashboard));
    if (wanted.has('analytics-health')) push(this.analyticsHealth(dashboard));
    if (wanted.has('contest')) push(this.contest(dashboard));
    if (wanted.has('recent-activity')) {
      const activity = await safe(() => activityService.getRecent(userId, 6), 'activity');
      push(this.recentActivity(activity));
    }

    const tokenEstimate = estimateTokens(sections.map((s) => `${s.title}\n${s.summary}`).join('\n\n'));
    return { intent, sections, generatedAt: new Date().toISOString(), tokenEstimate };
  },

  /* -- section builders (each pure over a DTO) -- */

  learnerProfile(d: DashboardDTO | null, p: GamificationProfileDTO | null): AIContextSection | null {
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
      lines.push(`Overall completion ${d.overall.completionPercent}%, ${d.overall.topicsCompleted}/${d.overall.topicsTotal} topics, average mastery ${d.overall.overallMastery}%.`);
    }
    return {
      key: 'learner-profile',
      title: 'Learner Profile',
      summary: lines.join(' '),
      data: p ? { level: p.progression.level, xp: p.progression.totalXP, streak: p.progression.currentStreak } : undefined,
    };
  },

  progression(p: GamificationProfileDTO | null): AIContextSection | null {
    if (!p) return null;
    const inProgress = p.achievements.inProgress.slice(0, 3).map((a) => `${a.title} (${a.progress}/${a.maxProgress})`);
    const challenges = p.challenges.active.slice(0, 3).map((c) => `${c.title} ${c.currentProgress}/${c.targetValue}`);
    return {
      key: 'progression',
      title: 'Progression & Goals',
      summary: [
        inProgress.length ? `Next milestones: ${inProgress.join('; ')}.` : '',
        challenges.length ? `Active challenges: ${challenges.join('; ')}.` : '',
      ]
        .filter(Boolean)
        .join(' '),
    };
  },

  learningPlan(d: DashboardDTO | null): AIContextSection | null {
    if (!d) return null;
    const r = d.recommendation;
    return {
      key: 'learning-plan',
      title: 'Recommended Next Step',
      summary: `${r.title}: ${r.message} (suggested action: ${r.actionLabel}). ${d.overall.topicsRemaining} topics remaining.`,
    };
  },

  revision(d: DashboardDTO | null): AIContextSection | null {
    if (!d) return null;
    const rev = d.revision;
    const ret = d.retention;
    return {
      key: 'revision',
      title: 'Revision & Retention',
      summary: `${rev.dueTodayCount} reviews due today, ${rev.overdueCount} overdue, ${rev.completedToday} done today. Average retention ${ret.averageRetention}%, ${ret.atRiskCount} items at risk.`,
    };
  },

  knowledge(d: DashboardDTO | null): AIContextSection | null {
    if (!d) return null;
    const k = d.knowledge;
    return {
      key: 'knowledge',
      title: 'Knowledge Base',
      summary: `${k.knowledgeEntries} notebook entries covering ${k.topicsCovered} topics; ${k.patternsLearned} patterns learned, ${k.patternsPending} pending. Notebook coverage ${k.notebookCoveragePercent}%.`,
    };
  },

  analyticsHealth(d: DashboardDTO | null): AIContextSection | null {
    if (!d) return null;
    const h = d.health;
    return {
      key: 'analytics-health',
      title: 'Learning Health',
      summary: `Health score ${h.overallScore}/100 (${h.overallStatus}). ${h.masteredTopics} topics mastered, ${h.topicsAtRisk} at risk, ${h.upcomingReviews} upcoming reviews.`,
    };
  },

  contest(d: DashboardDTO | null): AIContextSection | null {
    if (!d) return null;
    const c = d.contest;
    if (c.totalContests === 0) {
      return { key: 'contest', title: 'Contests', summary: 'No contests recorded yet.' };
    }
    return {
      key: 'contest',
      title: 'Contests',
      summary: `${c.totalContests} contests, current rating ${c.currentRating ?? 'n/a'} (peak ${c.highestRating ?? 'n/a'}). Latest change ${c.recentRatingChange ?? 0}. ${c.pendingUpsolve} problems pending upsolve.`,
    };
  },

  recentActivity(activity: ActivityDTO[] | null): AIContextSection | null {
    if (!activity || activity.length === 0) return null;
    const items = activity.slice(0, 5).map((a) => `• ${a.title}`);
    return { key: 'recent-activity', title: 'Recent Activity', summary: items.join('\n') };
  },
};

/** Run a context fetch, returning null (and logging) on failure — never throws. */
async function safe<T>(fn: () => Promise<T>, label: string): Promise<T | null> {
  try {
    return await fn();
  } catch (err) {
    logger.warn(`ContextBuilder: '${label}' section unavailable`, err);
    return null;
  }
}
