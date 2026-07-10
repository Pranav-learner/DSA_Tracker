import { activityRepository, type ActivityInput } from '../repositories/activity.repository.js';
import { logger } from '../utils/logger.js';
import type { ActivityDocument } from '../models/Activity.js';
import type { ActivityType, ActivityEntityType } from '../types/domain.js';

/** Serialised activity event returned by the API (dates as ISO strings). */
export interface ActivityDTO {
  id: string;
  type: ActivityType;
  entityType: ActivityEntityType;
  entityId: string | null;
  title: string;
  description: string;
  createdAt: string;
}

/**
 * A recorded activity, handed to subscribers of the activity bus. Carries the
 * persisted `id` and `occurredAt` so downstream consumers (the Reward Engine)
 * can dedupe on the event and date the streak by when it actually happened.
 */
export interface ActivityEvent {
  id: string;
  userId: string;
  type: ActivityType;
  entityType: ActivityEntityType;
  entityId: string | null;
  title: string;
  description: string;
  occurredAt: Date;
}

/** A best-effort listener invoked for every recorded activity. */
export type ActivitySubscriber = (event: ActivityEvent) => void | Promise<void>;

function toActivityDTO(doc: ActivityDocument): ActivityDTO {
  return {
    id: String(doc._id),
    type: doc.type,
    entityType: doc.entityType,
    entityId: doc.entityId ?? null,
    title: doc.title,
    description: doc.description,
    createdAt: doc.createdAt.toISOString(),
  };
}

function toActivityEvent(userId: string, doc: ActivityDocument): ActivityEvent {
  return {
    id: String(doc._id),
    userId,
    type: doc.type,
    entityType: doc.entityType,
    entityId: doc.entityId ?? null,
    title: doc.title,
    description: doc.description,
    occurredAt: doc.createdAt,
  };
}

/**
 * The in-process activity bus. Modules never award XP or run cross-cutting
 * effects inline — they append an event via `record()`, and interested engines
 * (Module 6's Reward Engine) subscribe here. This keeps the Activity system the
 * single source of truth for "something happened" and keeps the core decoupled
 * from feature modules (the feature registers itself; the core imports nothing).
 */
const subscribers = new Set<ActivitySubscriber>();

/**
 * ActivityService — recent learning events for the dashboard timeline.
 *
 * Three responsibilities: read the recent feed (`getRecent`), append an event
 * (`record`), and let engines `subscribe` to the stream. `record` is
 * intentionally best-effort — logging a timeline event (and its downstream
 * rewards) must never break the learning mutation that triggered it, so both the
 * write and every subscriber are individually guarded.
 */
export const activityService = {
  async getRecent(userId: string, limit = 10): Promise<ActivityDTO[]> {
    const docs = await activityRepository.findRecentByUser(userId, limit);
    return docs.map(toActivityDTO);
  },

  /**
   * Register a listener for every recorded activity. Idempotent per function
   * reference. Returns an unsubscribe handle (used by tests/teardown).
   */
  subscribe(fn: ActivitySubscriber): () => void {
    subscribers.add(fn);
    return () => subscribers.delete(fn);
  },

  async record(userId: string, input: ActivityInput): Promise<void> {
    let doc: ActivityDocument;
    try {
      doc = await activityRepository.create(userId, input);
    } catch (err) {
      // Non-critical: never let activity logging break the caller's flow.
      logger.warn('Failed to record activity', err);
      return;
    }
    await this.dispatch(toActivityEvent(userId, doc));
  },

  /** Fan an event out to every subscriber, isolating failures per subscriber. */
  async dispatch(event: ActivityEvent): Promise<void> {
    for (const fn of subscribers) {
      try {
        await fn(event);
      } catch (err) {
        logger.warn('Activity subscriber failed', err);
      }
    }
  },
};
