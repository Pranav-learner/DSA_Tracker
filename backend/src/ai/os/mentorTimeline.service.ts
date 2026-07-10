import { recommendationRepository } from '../repositories/recommendation.repository.js';
import { workflowRepository } from '../repositories/workflow.repository.js';
import { conversationService } from '../services/conversation.service.js';
import { activityService } from '../../services/activity.service.js';
import type { ActivityType } from '../../types/domain.js';
import type { MentorAction, TimelineEntryDTO, TimelineEntryType } from './types.js';

/** Activity types that count as learning MILESTONES on the mentor timeline. */
const MILESTONE_TYPES = new Set<ActivityType>([
  'topic-completed',
  'topic-mastered',
  'phase-completed',
  'phase-unlocked',
  'contest-finished',
  'upsolve-completed',
  'rating-milestone-reached',
  'pattern-improved',
]);

export interface TimelineQuery {
  q?: string;
  types?: TimelineEntryType[];
  limit?: number;
}

/**
 * MentorTimeline (Module 7 · Sprint 4). A searchable, chronological history of the
 * AI mentor's activity — recommendations, coaching sessions, generated workflows
 * and learning milestones — assembled by AGGREGATING existing data (no new
 * collection). Everything is filterable by type and searchable by text.
 */
export const mentorTimelineService = {
  async get(userId: string, query: TimelineQuery = {}): Promise<TimelineEntryDTO[]> {
    const wantType = (t: TimelineEntryType) => !query.types?.length || query.types.includes(t);

    const [recs, workflows, conversations, activity] = await Promise.all([
      wantType('recommendation') ? recommendationRepository.list(userId, { limit: 50 }) : Promise.resolve([]),
      wantType('workflow') ? workflowRepository.list(userId, 30) : Promise.resolve([]),
      wantType('coaching-session') ? conversationService.list(userId) : Promise.resolve([]),
      wantType('milestone') ? activityService.getRecent(userId, 30) : Promise.resolve([]),
    ]);

    const entries: TimelineEntryDTO[] = [];

    for (const r of recs) {
      const action = r.action as MentorAction | null;
      entries.push({
        id: `rec-${String(r._id)}`,
        type: 'recommendation',
        title: r.title,
        description: r.reason,
        at: r.updatedAt.toISOString(),
        icon: 'lightbulb',
        to: action?.to ?? null,
        status: r.status,
      });
    }

    for (const w of workflows) {
      entries.push({
        id: `wf-${String(w._id)}`,
        type: 'workflow',
        title: w.name,
        description: `${w.steps.length} steps · ~${w.estimatedMinutes} min · ${w.modules.join(', ')}`,
        at: w.updatedAt.toISOString(),
        icon: 'route',
        to: '/ai',
        status: w.status,
      });
    }

    for (const c of conversations) {
      if (c.messageCount === 0) continue;
      entries.push({
        id: `conv-${c.id}`,
        type: 'coaching-session',
        title: c.title,
        description: `${c.messageCount} messages${c.lastIntent ? ` · ${c.lastIntent}` : ''}`,
        at: c.lastMessageAt ?? c.updatedAt,
        icon: 'message-square',
        to: '/ai',
        status: c.pinned ? 'pinned' : null,
      });
    }

    for (const a of activity) {
      if (!MILESTONE_TYPES.has(a.type)) continue;
      entries.push({
        id: `act-${a.id}`,
        type: 'milestone',
        title: a.title,
        description: a.description,
        at: a.createdAt,
        icon: 'trophy',
        to: null,
        status: null,
      });
    }

    // Search filter (title + description), then newest-first.
    const q = query.q?.trim().toLowerCase();
    const filtered = q
      ? entries.filter((e) => e.title.toLowerCase().includes(q) || e.description.toLowerCase().includes(q))
      : entries;

    filtered.sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0));
    return filtered.slice(0, query.limit ?? 50);
  },
};
