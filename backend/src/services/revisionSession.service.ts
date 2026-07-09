import { revisionSessionRepository } from '../repositories/revisionSession.repository.js';
import { revisionScheduleRepository } from '../repositories/revisionSchedule.repository.js';
import { revisionScheduleService } from './revisionSchedule.service.js';
import { retentionService } from './retention.service.js';
import { activityService } from './activity.service.js';
import { notebookRepository } from '../repositories/notebook.repository.js';
import { topicRepository } from '../repositories/topic.repository.js';
import { ApiError } from '../utils/ApiError.js';
import { startOfDay } from './revision.util.js';
import { logger } from '../utils/logger.js';
import type { FilterQuery, SortOrder } from 'mongoose';
import type { RevisionSessionDocument, IRevisionSession } from '../models/RevisionSession.js';
import type { RevisionEntityType } from '../types/domain.js';
import type {
  DashboardRevisionSessionDTO,
  RevisionSessionDTO,
  SessionHistoryQuery,
} from './revisionSession.dto.js';
import type { PaginatedDTO } from './problem.dto.js';

const round = (n: number) => Math.round(n);
const DASHBOARD_RECENT = 5;

export interface StartSessionInput {
  scheduleId?: string;
  entityType?: RevisionEntityType;
  entityId?: string;
  selfConfidenceBefore?: number;
}

export interface CompleteSessionInput {
  sessionId: string;
  durationMinutes?: number;
  reviewNotes?: string;
  selfConfidenceAfter?: number;
  reviewedKnowledgeEntries?: string[];
  reviewedProblems?: string[];
}

export interface UpdateSessionInput {
  reviewNotes?: string;
  selfConfidenceBefore?: number;
  selfConfidenceAfter?: number;
  reviewedKnowledgeEntries?: string[];
  reviewedProblems?: string[];
  action?: 'pause' | 'resume' | 'abandon';
}

/**
 * RevisionSessionService — the active-review lifecycle. Enforces a single active
 * session per user, records what/for-how-long was reviewed, generates activity
 * events, and (on completion) advances the owning schedule via the Sprint-1
 * strategy. No retention/confidence calculations — values are stored only.
 */
export const revisionSessionService = {
  async start(userId: string, input: StartSessionInput): Promise<RevisionSessionDTO> {
    const active = await revisionSessionRepository.findActive(userId);
    if (active) {
      throw new ApiError(409, 'You already have an active revision session', {
        activeSessionId: String(active._id),
      });
    }

    let entityType: RevisionEntityType;
    let entityId: string;
    let title: string;
    let scheduleId: string | null = null;

    if (input.scheduleId) {
      const schedule = await revisionScheduleRepository.findById(input.scheduleId);
      if (!schedule) throw ApiError.notFound(`Revision schedule '${input.scheduleId}' not found`);
      if (schedule.userId !== userId) throw new ApiError(403, 'You do not own this revision schedule');
      entityType = schedule.entityType;
      entityId = schedule.entityId;
      title = schedule.title;
      scheduleId = String(schedule._id);
    } else {
      if (!input.entityType || !input.entityId) {
        throw ApiError.badRequest('Provide a scheduleId, or an entityType + entityId');
      }
      entityType = input.entityType;
      entityId = input.entityId;
      title = await resolveEntityTitle(userId, entityType, entityId);
      // Link to an existing active schedule for this entity, if any.
      const schedule = await revisionScheduleRepository.findActiveForEntity(userId, entityType, entityId);
      scheduleId = schedule ? String(schedule._id) : null;
    }

    const doc = await revisionSessionRepository.create({
      userId,
      revisionScheduleId: scheduleId ? (scheduleId as unknown as IRevisionSession['revisionScheduleId']) : null,
      entityType,
      entityId,
      title,
      sessionStatus: 'Started',
      startedAt: new Date(),
      completedAt: null,
      durationMinutes: 0,
      reviewedKnowledgeEntries: [],
      reviewedProblems: [],
      reviewNotes: '',
      selfConfidenceBefore: input.selfConfidenceBefore ?? null,
      selfConfidenceAfter: null,
    });

    await recordActivity(userId, doc, 'revision-started', `Started revising ${title}`, 'Review session in progress.');
    return toSessionDTO(doc);
  },

  async complete(userId: string, input: CompleteSessionInput): Promise<RevisionSessionDTO> {
    const session = await requireOwnedSession(userId, input.sessionId);
    if (session.sessionStatus !== 'Started') {
      throw ApiError.badRequest('Only an active session can be completed');
    }

    const now = new Date();
    const durationMinutes =
      input.durationMinutes ?? Math.max(0, round((now.getTime() - session.startedAt.getTime()) / 60_000));

    const updated = await revisionSessionRepository.updateById(session.id, {
      sessionStatus: 'Completed',
      completedAt: now,
      durationMinutes,
      reviewNotes: input.reviewNotes ?? session.reviewNotes,
      selfConfidenceAfter: input.selfConfidenceAfter ?? session.selfConfidenceAfter,
      reviewedKnowledgeEntries: input.reviewedKnowledgeEntries ?? session.reviewedKnowledgeEntries,
      reviewedProblems: input.reviewedProblems ?? session.reviewedProblems,
    });

    await recordActivity(
      userId,
      updated!,
      'revision-completed',
      `Completed revising ${updated!.title}`,
      `${durationMinutes} min · ${updated!.reviewedProblems.length} problems reviewed.`,
    );

    // Advance the owning schedule to its next review (Sprint-1 strategy). Best-effort.
    if (session.revisionScheduleId) {
      try {
        await revisionScheduleService.recalculate(userId, String(session.revisionScheduleId));
      } catch (err) {
        logger.warn('Failed to advance schedule after session completion', err);
      }
    }

    const dto = toSessionDTO(updated!);

    // Module 3 · Sprint 3 — sync retention → confidence → mastery from this review.
    // Runs after the schedule advances so retention reads the fresh nextReviewDate.
    // Best-effort: retention is downstream and must never fail a completion.
    try {
      await retentionService.syncAfterRevision(userId, dto);
    } catch (err) {
      logger.warn('Failed to sync retention after session completion', err);
    }

    return dto;
  },

  async update(userId: string, id: string, input: UpdateSessionInput): Promise<RevisionSessionDTO> {
    const session = await requireOwnedSession(userId, id);

    // Pause / resume / abandon apply only to an active session.
    if (input.action && session.sessionStatus !== 'Started') {
      throw ApiError.badRequest('Only an active session can be paused, resumed or abandoned');
    }

    const patch: Partial<IRevisionSession> = {};
    if (input.reviewNotes !== undefined) patch.reviewNotes = input.reviewNotes;
    if (input.selfConfidenceBefore !== undefined) patch.selfConfidenceBefore = input.selfConfidenceBefore;
    if (input.selfConfidenceAfter !== undefined) patch.selfConfidenceAfter = input.selfConfidenceAfter;
    if (input.reviewedKnowledgeEntries !== undefined) patch.reviewedKnowledgeEntries = input.reviewedKnowledgeEntries;
    if (input.reviewedProblems !== undefined) patch.reviewedProblems = input.reviewedProblems;

    if (input.action === 'abandon') {
      patch.sessionStatus = 'Abandoned';
      patch.completedAt = new Date();
      patch.durationMinutes = Math.max(0, round((Date.now() - session.startedAt.getTime()) / 60_000));
    }

    const updated = await revisionSessionRepository.updateById(id, patch);

    if (input.action === 'pause') {
      await recordActivity(userId, updated!, 'revision-paused', `Paused revising ${updated!.title}`, '');
    } else if (input.action === 'resume') {
      await recordActivity(userId, updated!, 'revision-resumed', `Resumed revising ${updated!.title}`, '');
    } else if (input.reviewNotes !== undefined) {
      await recordActivity(userId, updated!, 'revision-notes-updated', `Updated review notes`, updated!.title);
    }

    return toSessionDTO(updated!);
  },

  async getById(userId: string, id: string): Promise<RevisionSessionDTO> {
    return toSessionDTO(await requireOwnedSession(userId, id));
  },

  async getActive(userId: string): Promise<RevisionSessionDTO | null> {
    const active = await revisionSessionRepository.findActive(userId);
    return active ? toSessionDTO(active) : null;
  },

  async history(userId: string, query: SessionHistoryQuery): Promise<PaginatedDTO<RevisionSessionDTO>> {
    const filter = buildHistoryFilter(userId, query);
    const sort = SORT_MAP[query.sort];
    const skip = (query.page - 1) * query.pageSize;
    const { items, total } = await revisionSessionRepository.search(filter, {
      skip,
      limit: query.pageSize,
      sort,
    });
    const totalPages = Math.max(1, Math.ceil(total / query.pageSize));
    return {
      items: items.map(toSessionDTO),
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages,
      hasNext: query.page < totalPages,
      hasPrev: query.page > 1,
    };
  },

  async historyByEntity(userId: string, entityId: string): Promise<RevisionSessionDTO[]> {
    const docs = await revisionSessionRepository.findByEntity(userId, entityId);
    return docs.map(toSessionDTO);
  },

  /** Active session + today's completed count + recent sessions, for the dashboard. */
  async getDashboardSummary(userId: string): Promise<DashboardRevisionSessionDTO> {
    const todayStart = new Date(startOfDay(new Date()));
    const [active, completedToday, recent] = await Promise.all([
      revisionSessionRepository.findActive(userId),
      revisionSessionRepository.countCompletedSince(userId, todayStart),
      revisionSessionRepository.findRecent(userId, DASHBOARD_RECENT),
    ]);
    return {
      activeSession: active ? toSessionDTO(active) : null,
      completedToday,
      recentSessions: recent.map(toSessionDTO),
    };
  },
};

/* ------------------------------- helpers -------------------------------- */

const SORT_MAP: Record<SessionHistoryQuery['sort'], Record<string, SortOrder>> = {
  recent: { startedAt: -1 },
  oldest: { startedAt: 1 },
  duration: { durationMinutes: -1, startedAt: -1 },
};

async function resolveEntityTitle(userId: string, entityType: RevisionEntityType, entityId: string): Promise<string> {
  if (entityType === 'knowledgeEntry') {
    const nb = await notebookRepository.findById(entityId);
    if (!nb) throw ApiError.notFound(`Notebook entry '${entityId}' not found`);
    if (nb.userId !== userId) throw new ApiError(403, 'You do not own this notebook entry');
    return nb.title;
  }
  if (entityType === 'topic') {
    const topic = await topicRepository.findById(entityId);
    if (!topic) throw ApiError.notFound(`Topic '${entityId}' not found`);
    return topic.title;
  }
  // pattern — the id is the pattern string itself.
  return entityId;
}

async function requireOwnedSession(userId: string, id: string): Promise<RevisionSessionDocument> {
  const doc = await revisionSessionRepository.findById(id);
  if (!doc) throw ApiError.notFound(`Revision session '${id}' not found`);
  if (doc.userId !== userId) throw new ApiError(403, 'You do not own this revision session');
  return doc;
}

function buildHistoryFilter(userId: string, query: SessionHistoryQuery): FilterQuery<IRevisionSession> {
  const filter: FilterQuery<IRevisionSession> = { userId };
  if (query.entityType) filter.entityType = query.entityType;
  if (query.status) filter.sessionStatus = query.status;
  if (query.from || query.to) {
    filter.startedAt = {};
    if (query.from) filter.startedAt.$gte = new Date(query.from);
    if (query.to) filter.startedAt.$lte = new Date(query.to);
  }
  return filter;
}

async function recordActivity(
  userId: string,
  doc: RevisionSessionDocument,
  type: 'revision-started' | 'revision-paused' | 'revision-resumed' | 'revision-completed' | 'revision-notes-updated',
  title: string,
  description: string,
): Promise<void> {
  await activityService.record(userId, {
    type,
    entityType: 'revision',
    entityId: String(doc._id),
    title,
    description,
  });
}

function toSessionDTO(doc: RevisionSessionDocument): RevisionSessionDTO {
  return {
    id: String(doc._id),
    userId: doc.userId,
    revisionScheduleId: doc.revisionScheduleId ? String(doc.revisionScheduleId) : null,
    entityType: doc.entityType,
    entityId: doc.entityId,
    title: doc.title,
    sessionStatus: doc.sessionStatus,
    startedAt: doc.startedAt.toISOString(),
    completedAt: doc.completedAt ? doc.completedAt.toISOString() : null,
    durationMinutes: doc.durationMinutes,
    reviewedKnowledgeEntries: doc.reviewedKnowledgeEntries,
    reviewedProblems: doc.reviewedProblems,
    reviewNotes: doc.reviewNotes,
    selfConfidenceBefore: doc.selfConfidenceBefore,
    selfConfidenceAfter: doc.selfConfidenceAfter,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}
