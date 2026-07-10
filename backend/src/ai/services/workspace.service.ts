import { dashboardService } from '../../services/dashboard.service.js';
import { gamificationProfileService } from '../../gamification/services/gamificationProfile.service.js';
import { patternIntelligenceService } from '../../analytics/services/patternIntelligence.service.js';
import { contestReadinessService } from '../../contests/services/contestReadiness.service.js';
import { resolveAnalyticsWindow } from '../../analytics/validators/analytics.validator.js';
import { suggestionService } from './suggestion.service.js';
import { conversationService } from './conversation.service.js';
import { SLASH_COMMANDS } from '../context/profiles.js';
import { logger } from '../../utils/logger.js';
import type { LearningSnapshotDTO, WorkspaceDTO, QuickActionDTO } from '../dto/ai.dto.js';

/** Quick mentor actions surfaced as buttons (a curated subset of slash commands). */
const QUICK_ACTIONS: QuickActionDTO[] = [
  { command: 'study', label: 'Plan my study', intent: 'study-plan' },
  { command: 'revision', label: 'Revision help', intent: 'revision' },
  { command: 'contest', label: 'Contest prep', intent: 'contest' },
  { command: 'analytics', label: 'Analyze my progress', intent: 'analytics' },
  { command: 'notebook', label: 'Explain a pattern', intent: 'notebook' },
];

/**
 * WorkspaceService — the read model behind the AI Mentor landing. It assembles
 * the auto-updating Learning Snapshot from EXISTING services (dashboard,
 * gamification, analytics, contest — best-effort, never the DB), plus personalised
 * suggestions, recent conversations, the current recommendation and quick actions.
 * One `/workspace` call powers the whole panel.
 */
export const workspaceService = {
  /** The auto-updating Learning Snapshot. */
  async getSnapshot(userId: string): Promise<LearningSnapshotDTO> {
    const window = safeWindow();
    const [dashboard, profile, weaknesses, strengths, readiness] = await Promise.all([
      safe(() => dashboardService.get(userId), 'dashboard'),
      safe(() => gamificationProfileService.getProfile(userId), 'profile'),
      window ? safe(() => patternIntelligenceService.weaknesses(userId, window), 'weaknesses') : Promise.resolve(null),
      window ? safe(() => patternIntelligenceService.strengths(userId, window), 'strengths') : Promise.resolve(null),
      safe(() => contestReadinessService.compute(userId), 'readiness'),
    ]);

    const rec = dashboard?.recommendation;
    return {
      currentPhase: dashboard?.currentPhase?.title ?? null,
      currentTopic: dashboard?.currentTopic?.title ?? null,
      mastery: dashboard?.currentMastery ?? 0,
      revisionDue: (dashboard?.revision.dueTodayCount ?? 0) + (dashboard?.revision.overdueCount ?? 0),
      weakestPattern: weaknesses?.[0]?.title ?? null,
      strongestPattern: strengths?.[0]?.title ?? null,
      currentStreak: profile?.progression.currentStreak ?? 0,
      contestReadiness: readiness?.overall ?? dashboard?.contest.contestReadiness ?? null,
      recommendation: rec
        ? { title: rec.title, message: rec.message, actionLabel: rec.actionLabel, actionTo: rec.actionTo }
        : null,
    };
  },

  /** Everything the AI Mentor landing needs in one call. */
  async getWorkspace(userId: string): Promise<WorkspaceDTO> {
    const [snapshot, recentConversations] = await Promise.all([
      this.getSnapshot(userId),
      conversationService.list(userId).then((c) => c.slice(0, 6)),
    ]);
    return {
      snapshot,
      suggestions: suggestionService.generate(snapshot),
      recentConversations,
      recommendation: snapshot.recommendation,
      quickActions: QUICK_ACTIONS,
    };
  },

  /** The slash-command catalogue (for the help menu / command palette). */
  commands() {
    return Object.entries(SLASH_COMMANDS).map(([command, meta]) => ({
      command,
      label: meta.label,
      intent: meta.intent,
      profiles: meta.profiles,
    }));
  },
};

function safeWindow() {
  try {
    return resolveAnalyticsWindow({});
  } catch {
    return null;
  }
}

async function safe<T>(fn: () => Promise<T>, label: string): Promise<T | null> {
  try {
    return await fn();
  } catch (err) {
    logger.warn(`WorkspaceService: '${label}' unavailable`, err);
    return null;
  }
}
