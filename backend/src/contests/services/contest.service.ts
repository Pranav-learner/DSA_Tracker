import { contestRepository } from '../repositories/contest.repository.js';
import { ratingService } from './rating.service.js';
import { contestPerformanceService } from './contestPerformance.service.js';
import { upsolveTaskRepository } from '../repositories/upsolveTask.repository.js';
import { getContestProvider, listContestProviders } from '../providers/contestProvider.js';
import { activityService } from '../../services/activity.service.js';
import { ApiError } from '../../utils/ApiError.js';
import { CONTEST_TYPES } from '../../types/domain.js';
import type { ContestDocument, IContest } from '../../models/Contest.js';
import type { ContestPlatform } from '../../types/domain.js';
import type { CreateContestBody, UpdateContestBody } from '../validators/contest.validator.js';
import type {
  ContestDTO,
  ContestFacetsDTO,
  ContestQuery,
  ContestStatsDTO,
  DashboardContestDTO,
  PaginatedContestsDTO,
} from '../dto/contest.dto.js';
import type { FilterQuery, SortOrder } from 'mongoose';

const MONTH_MS = 30 * 24 * 60 * 60_000;

function ratingChangeOf(before: number | null | undefined, after: number | null | undefined): number | null {
  return before != null && after != null ? after - before : null;
}

function toDTO(doc: ContestDocument): ContestDTO {
  return {
    id: String(doc._id),
    platform: doc.platform,
    provider: doc.provider,
    contestId: doc.contestId,
    contestName: doc.contestName,
    contestUrl: doc.contestUrl,
    division: doc.division,
    contestType: doc.contestType,
    startTime: doc.startTime.toISOString(),
    durationMinutes: doc.durationMinutes,
    ratingBefore: doc.ratingBefore,
    ratingAfter: doc.ratingAfter,
    ratingChange: doc.ratingChange,
    rank: doc.rank,
    percentile: doc.percentile,
    participated: doc.participated,
    notes: doc.notes,
    isRated: doc.contestType === 'Rated' && doc.ratingChange !== null,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

/** Load a contest and assert the caller owns it (shared by the workspace module). */
export async function requireOwnedContest(userId: string, id: string): Promise<ContestDocument> {
  const doc = await contestRepository.findById(id);
  if (!doc) throw ApiError.notFound(`Contest '${id}' not found`);
  if (doc.userId !== userId) throw new ApiError(403, 'You do not own this contest');
  return doc;
}

async function requireOwned(userId: string, id: string): Promise<ContestDocument> {
  return requireOwnedContest(userId, id);
}

/**
 * ContestService — all contest business logic: CRUD, filtered/paginated history,
 * statistics. Reuses the ContestProvider registry (URLs/metadata) and delegates
 * rating-timeline maintenance to RatingService (no duplicated logic).
 */
export const contestService = {
  async create(userId: string, body: CreateContestBody): Promise<ContestDTO> {
    const existing = await contestRepository.findByContestId(userId, body.platform, body.contestId);
    if (existing) throw new ApiError(409, `Contest '${body.contestId}' already exists for ${body.platform}`);

    const provider = getContestProvider(body.platform);
    const doc = await contestRepository.create({
      userId,
      platform: body.platform,
      provider: provider.platform,
      contestId: body.contestId,
      contestName: body.contestName,
      contestUrl: body.contestUrl || provider.contestUrl(body.contestId),
      division: body.division ?? '',
      contestType: body.contestType,
      startTime: new Date(body.startTime),
      durationMinutes: body.durationMinutes,
      ratingBefore: body.ratingBefore ?? null,
      ratingAfter: body.ratingAfter ?? null,
      ratingChange: ratingChangeOf(body.ratingBefore, body.ratingAfter),
      rank: body.rank ?? null,
      percentile: body.percentile ?? null,
      participated: body.participated,
      notes: body.notes ?? '',
    });

    await ratingService.syncFromContest(userId, doc);
    await this.recordActivity(userId, doc, 'contest-added', `Added contest: ${doc.contestName}`, `${doc.platform}${doc.division ? ` · ${doc.division}` : ''}`);
    if (doc.contestType === 'Rated' && doc.ratingChange !== null) {
      await this.recordActivity(userId, doc, 'rating-updated', `Rating updated on ${doc.platform}`, `${doc.ratingChange > 0 ? '+' : ''}${doc.ratingChange} → ${doc.ratingAfter}`);
    }
    return toDTO(doc);
  },

  async update(userId: string, id: string, body: UpdateContestBody): Promise<ContestDTO> {
    const doc = await requireOwned(userId, id);
    const patch: Partial<IContest> = { ...body } as Partial<IContest>;
    if (body.startTime) patch.startTime = new Date(body.startTime);

    const before = body.ratingBefore !== undefined ? body.ratingBefore : doc.ratingBefore;
    const after = body.ratingAfter !== undefined ? body.ratingAfter : doc.ratingAfter;
    if (body.ratingBefore !== undefined || body.ratingAfter !== undefined) {
      patch.ratingChange = ratingChangeOf(before, after);
    }

    const updated = (await contestRepository.updateById(id, patch)) as ContestDocument;
    await ratingService.syncFromContest(userId, updated);
    await this.recordActivity(userId, updated, 'contest-updated', `Updated contest: ${updated.contestName}`, updated.platform);
    return toDTO(updated);
  },

  async remove(userId: string, id: string): Promise<void> {
    const doc = await requireOwned(userId, id);
    await ratingService.removeForContest(userId, String(doc._id));
    await contestRepository.deleteById(id);
  },

  async getById(userId: string, id: string): Promise<ContestDTO> {
    return toDTO(await requireOwned(userId, id));
  },

  async list(userId: string, query: ContestQuery): Promise<PaginatedContestsDTO> {
    const filter: FilterQuery<IContest> = { userId };
    if (query.platform) filter.platform = query.platform;
    if (query.contestType) filter.contestType = query.contestType;
    else if (query.rated !== undefined) filter.contestType = query.rated ? 'Rated' : { $ne: 'Rated' };
    if (query.division) filter.division = query.division;
    if (query.q) filter.contestName = { $regex: query.q, $options: 'i' };
    if (query.from || query.to) {
      filter.startTime = {};
      if (query.from) (filter.startTime as Record<string, Date>).$gte = new Date(query.from);
      if (query.to) (filter.startTime as Record<string, Date>).$lte = new Date(query.to);
    }

    const sort: Record<string, SortOrder> = { [query.sort]: query.order === 'asc' ? 1 : -1 };
    const { items, total } = await contestRepository.search(filter, {
      skip: (query.page - 1) * query.pageSize,
      limit: query.pageSize,
      sort,
    });
    const totalPages = Math.max(1, Math.ceil(total / query.pageSize));
    return {
      items: items.map(toDTO),
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages,
      hasNext: query.page < totalPages,
      hasPrev: query.page > 1,
    };
  },

  async stats(userId: string): Promise<ContestStatsDTO> {
    const [s, dist] = await Promise.all([contestRepository.stats(userId), contestRepository.platformDistribution(userId)]);
    const spanMonths = s.firstDate && s.lastDate ? Math.max(1, (s.lastDate.getTime() - s.firstDate.getTime()) / MONTH_MS) : 1;
    return {
      totalContests: s.total,
      ratedContests: s.rated,
      virtualContests: s.virtual,
      participatedContests: s.participated,
      averageRank: s.avgRank,
      averageRatingChange: s.avgRatingChange,
      participationFrequencyPerMonth: Math.round((s.total / spanMonths) * 10) / 10,
      platformDistribution: dist.map((d) => ({ platform: d.platform, count: d.count, percent: s.total ? Math.round((d.count / s.total) * 100) : 0 })),
    };
  },

  async facets(userId: string): Promise<ContestFacetsDTO> {
    const [usedPlatforms, usedDivisions] = await Promise.all([
      contestRepository.distinctPlatforms(userId),
      contestRepository.distinctDivisions(userId),
    ]);
    return {
      platforms: listContestProviders().map((p) => ({ platform: p.platform, label: p.label, divisions: p.divisions })),
      contestTypes: [...CONTEST_TYPES],
      usedPlatforms: usedPlatforms.sort(),
      usedDivisions: usedDivisions.filter(Boolean).sort(),
    };
  },

  async getDashboardSummary(userId: string): Promise<DashboardContestDTO> {
    const [s, latest, ratingSummary] = await Promise.all([
      contestRepository.stats(userId),
      contestRepository.findAll(userId),
      ratingService.summary(userId),
    ]);
    const upsolveCounts = await upsolveTaskRepository.statusCounts(userId);
    const latestContest = latest[0] ? toDTO(latest[0]) : null;
    let latestPerformance: DashboardContestDTO['latestPerformance'] = null;
    if (latest[0]) {
      const perf = await contestPerformanceService.get(userId, String(latest[0]._id), latest[0].durationMinutes);
      if (perf.totalSolved > 0 || perf.totalAttempts > 0) {
        latestPerformance = {
          totalSolved: perf.totalSolved,
          wrongAttempts: perf.wrongAttempts,
          penalty: perf.penalty,
          averageSolveTime: perf.averageSolveTime,
        };
      }
    }
    return {
      totalContests: s.total,
      currentRating: ratingSummary.currentRating,
      highestRating: ratingSummary.highestRating,
      latestContest,
      recentRatingChange: ratingSummary.lastRatingChange,
      averageRank: s.avgRank,
      latestPerformance,
      pendingUpsolve: (upsolveCounts.Pending ?? 0) + (upsolveCounts['In Progress'] ?? 0),
    };
  },

  async recordActivity(userId: string, doc: ContestDocument, type: 'contest-added' | 'contest-updated' | 'rating-updated', title: string, description: string): Promise<void> {
    await activityService.record(userId, { type, entityType: 'contest', entityId: String(doc._id), title, description });
  },
};

export type { ContestPlatform };
