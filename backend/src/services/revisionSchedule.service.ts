import { revisionScheduleRepository } from '../repositories/revisionSchedule.repository.js';
import { getRevisionStrategy } from './revisionStrategy.js';
import { activityService } from './activity.service.js';
import { ApiError } from '../utils/ApiError.js';
import { DEFAULT_ENTITY_PRIORITY } from '../config/revision.js';
import { startOfDay, toRevisionScheduleDTO } from './revision.util.js';
import type { FilterQuery, SortOrder } from 'mongoose';
import type { RevisionScheduleDocument, IRevisionSchedule } from '../models/RevisionSchedule.js';
import type { RevisionEntityType } from '../types/domain.js';
import type { RevisionScheduleDTO, RevisionQuery } from './revision.dto.js';
import type { PaginatedDTO } from './problem.dto.js';

const DAY_MS = 24 * 60 * 60 * 1000;

export interface CreateScheduleInput {
  entityType: RevisionEntityType;
  entityId: string;
  title: string;
  strategy?: string;
  priority?: number;
  nextReviewDate?: string;
}

export interface UpdateScheduleInput {
  title?: string;
  priority?: number;
  status?: IRevisionSchedule['status'];
  strategy?: string;
  nextReviewDate?: string;
}

/**
 * RevisionScheduleService — all revision-scheduling business logic. Scheduling
 * math is delegated to the pluggable RevisionStrategy; persistence to the
 * repository. Due/Overdue are never stored — they're derived at read time.
 */
export const revisionScheduleService = {
  async create(userId: string, input: CreateScheduleInput, allowDuplicate = false): Promise<RevisionScheduleDTO> {
    if (!allowDuplicate) {
      const existing = await revisionScheduleRepository.findActiveForEntity(
        userId,
        input.entityType,
        input.entityId,
      );
      if (existing) {
        throw new ApiError(409, 'An active revision schedule already exists for this item');
      }
    }

    const now = new Date();
    const strategy = getRevisionStrategy(input.strategy);
    const initial = strategy.initialSchedule(now);
    const nextReviewDate = input.nextReviewDate ? new Date(input.nextReviewDate) : initial.nextReviewDate;
    const priority = input.priority ?? DEFAULT_ENTITY_PRIORITY[input.entityType] ?? 3;

    const doc = await revisionScheduleRepository.create({
      userId,
      entityType: input.entityType,
      entityId: input.entityId,
      title: input.title,
      currentInterval: initial.currentInterval,
      nextReviewDate,
      lastReviewDate: null,
      reviewCount: 0,
      easeFactor: initial.easeFactor,
      priority,
      status: 'Pending',
      strategy: strategy.name,
    });

    await activityService.record(userId, {
      type: 'revision-scheduled',
      entityType: 'revision',
      entityId: String(doc._id),
      title: `Revision scheduled: ${doc.title}`,
      description: `Next review ${doc.nextReviewDate.toISOString().slice(0, 10)} (${input.entityType}).`,
    });

    return toRevisionScheduleDTO(doc, now);
  },

  /**
   * Idempotent auto-create used by integration hooks + the seed. No-ops (returns
   * null) when an active schedule already exists for the entity.
   */
  async ensureScheduleFor(userId: string, input: CreateScheduleInput): Promise<RevisionScheduleDTO | null> {
    const existing = await revisionScheduleRepository.findActiveForEntity(
      userId,
      input.entityType,
      input.entityId,
    );
    if (existing) return null;
    return this.create(userId, input, true);
  },

  async getById(userId: string, id: string): Promise<RevisionScheduleDTO> {
    const doc = await requireOwned(userId, id);
    return toRevisionScheduleDTO(doc, new Date());
  },

  async list(userId: string, query: RevisionQuery): Promise<PaginatedDTO<RevisionScheduleDTO>> {
    const now = new Date();
    const filter = buildFilter(userId, query, now);
    const dir: SortOrder = query.order === 'desc' ? -1 : 1;
    const sort: Record<string, SortOrder> = { [query.sort]: dir };
    if (query.sort !== 'nextReviewDate') sort.nextReviewDate = 1;

    const skip = (query.page - 1) * query.pageSize;
    const { items, total } = await revisionScheduleRepository.search(filter, {
      skip,
      limit: query.pageSize,
      sort,
    });

    const totalPages = Math.max(1, Math.ceil(total / query.pageSize));
    return {
      items: items.map((d) => toRevisionScheduleDTO(d, now)),
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages,
      hasNext: query.page < totalPages,
      hasPrev: query.page > 1,
    };
  },

  async update(userId: string, id: string, input: UpdateScheduleInput): Promise<RevisionScheduleDTO> {
    await requireOwned(userId, id);
    const patch: Partial<IRevisionSchedule> = {};
    if (input.title !== undefined) patch.title = input.title;
    if (input.priority !== undefined) patch.priority = input.priority;
    if (input.status !== undefined) patch.status = input.status;
    if (input.strategy !== undefined) patch.strategy = getRevisionStrategy(input.strategy).name;
    if (input.nextReviewDate !== undefined) patch.nextReviewDate = new Date(input.nextReviewDate);

    const updated = await revisionScheduleRepository.updateById(id, patch);
    if (!updated) throw ApiError.notFound(`Revision schedule '${id}' not found`);
    return toRevisionScheduleDTO(updated, new Date());
  },

  async remove(userId: string, id: string): Promise<void> {
    await requireOwned(userId, id);
    await revisionScheduleRepository.deleteById(id);
  },

  /**
   * Advance a schedule to its next review via the strategy (used when a review is
   * completed — the Revision Workspace lands in Sprint 2; exposed now for reuse).
   */
  async recalculate(userId: string, id: string): Promise<RevisionScheduleDTO> {
    const doc = await requireOwned(userId, id);
    const now = new Date();
    const next = getRevisionStrategy(doc.strategy).nextReview(
      { reviewCount: doc.reviewCount, easeFactor: doc.easeFactor },
      now,
    );
    const updated = await revisionScheduleRepository.updateById(id, {
      currentInterval: next.currentInterval,
      nextReviewDate: next.nextReviewDate,
      easeFactor: next.easeFactor,
      reviewCount: next.reviewCount,
      lastReviewDate: now,
      status: 'Pending',
    });
    return toRevisionScheduleDTO(updated!, now);
  },
};

async function requireOwned(userId: string, id: string): Promise<RevisionScheduleDocument> {
  const doc = await revisionScheduleRepository.findById(id);
  if (!doc) throw ApiError.notFound(`Revision schedule '${id}' not found`);
  if (doc.userId !== userId) throw new ApiError(403, 'You do not own this revision schedule');
  return doc;
}

/** Build the list filter, translating derived statuses (Due/Overdue/Pending) to dates. */
function buildFilter(userId: string, query: RevisionQuery, now: Date): FilterQuery<IRevisionSchedule> {
  const filter: FilterQuery<IRevisionSchedule> = { userId };
  if (query.entityType) filter.entityType = query.entityType;

  const todayStart = startOfDay(now);
  const dateCond: Record<string, Date> = {};

  if (query.status === 'Completed' || query.status === 'Archived') {
    filter.status = query.status;
  } else if (query.status === 'Overdue') {
    filter.status = 'Pending';
    dateCond.$lt = new Date(todayStart);
  } else if (query.status === 'Due') {
    filter.status = 'Pending';
    dateCond.$gte = new Date(todayStart);
    dateCond.$lt = new Date(todayStart + DAY_MS);
  } else if (query.status === 'Pending') {
    filter.status = 'Pending';
    dateCond.$gte = new Date(todayStart + DAY_MS);
  }

  if (query.from) dateCond.$gte = new Date(query.from);
  if (query.to) dateCond.$lte = new Date(query.to);
  if (Object.keys(dateCond).length) filter.nextReviewDate = dateCond;

  return filter;
}
