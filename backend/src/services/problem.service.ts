import { Types, type FilterQuery, type SortOrder } from 'mongoose';
import { problemRepository } from '../repositories/problem.repository.js';
import { userProblemRepository } from '../repositories/userProblem.repository.js';
import { phaseRepository } from '../repositories/phase.repository.js';
import { topicRepository } from '../repositories/topic.repository.js';
import { toPhaseRefDTO } from './mappers.js';
import { ApiError } from '../utils/ApiError.js';
import { DIFFICULTIES, PLATFORMS, PROBLEM_STATUSES } from '../types/domain.js';
import type { IProblem, ProblemDocument } from '../models/Problem.js';
import type { UserProblemDocument } from '../models/UserProblem.js';
import type {
  PaginatedDTO,
  ProblemDetailDTO,
  ProblemFacetsDTO,
  ProblemListItemDTO,
  ProblemQuery,
} from './problem.dto.js';

/** Maps the API sort field → the underlying Problem document field. */
const SORT_FIELD: Record<ProblemQuery['sort'], string> = {
  difficulty: 'difficultyRank',
  title: 'title',
  estimatedSolveTime: 'estimatedSolveTime',
  platform: 'platform',
  recent: 'createdAt',
};

/**
 * ProblemService — the read-only Problem Library. Builds a Mongo filter/sort
 * from the validated query (filtering, search, sort, pagination), overlays each
 * problem with the user's status/favorite, and resolves detail refs. All writes
 * belong to Attempt Tracking (Sprint 2); this service never mutates.
 */
export const problemService = {
  async list(userId: string, query: ProblemQuery): Promise<PaginatedDTO<ProblemListItemDTO>> {
    const filter = await this.buildFilter(userId, query);

    const dir: SortOrder = query.order === 'desc' ? -1 : 1;
    const sortField = SORT_FIELD[query.sort];
    const sort: Record<string, SortOrder> = { [sortField]: dir };
    if (sortField !== 'title') sort.title = 1; // stable, human-friendly tiebreak

    const skip = (query.page - 1) * query.pageSize;
    const { items, total } = await problemRepository.search(filter, {
      skip,
      limit: query.pageSize,
      sort,
    });

    const overlay = await this.overlayMap(userId, items.map((p) => String(p._id)));
    const dtos = items.map((p) => toListItem(p, overlay.get(String(p._id))));

    const totalPages = Math.max(1, Math.ceil(total / query.pageSize));
    return {
      items: dtos,
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages,
      hasNext: query.page < totalPages,
      hasPrev: query.page > 1,
    };
  },

  async getById(userId: string, id: string): Promise<ProblemDetailDTO> {
    const problem = await problemRepository.findById(id);
    if (!problem) throw ApiError.notFound(`Problem '${id}' not found`);

    const [topic, phase, userProblem] = await Promise.all([
      topicRepository.findById(String(problem.topicId)),
      phaseRepository.findById(String(problem.phaseId)),
      userProblemRepository.findByUserAndProblem(userId, id),
    ]);

    return {
      ...toListItem(problem, userProblem ?? undefined),
      topic: topic
        ? { id: String(topic._id), title: topic.title, slug: topic.slug, phaseId: String(topic.phaseId) }
        : null,
      phase: phase ? toPhaseRefDTO(phase) : null,
      lastViewed: userProblem?.lastViewed ? userProblem.lastViewed.toISOString() : null,
      createdAt: problem.createdAt.toISOString(),
      updatedAt: problem.updatedAt.toISOString(),
    };
  },

  /** Available filter values, so the client's FilterPanel stays data-driven. */
  async facets(): Promise<ProblemFacetsDTO> {
    const patterns = await problemRepository.distinctPatterns();
    return {
      platforms: [...PLATFORMS],
      difficulties: [...DIFFICULTIES],
      patterns: patterns.filter(Boolean).sort((a, b) => a.localeCompare(b)),
      statuses: [...PROBLEM_STATUSES],
    };
  },

  /** Translate the validated query into a Mongo filter (status/favorite via UserProblem). */
  async buildFilter(userId: string, query: ProblemQuery): Promise<FilterQuery<IProblem>> {
    const filter: FilterQuery<IProblem> = {};
    if (query.platform) filter.platform = query.platform;
    if (query.difficulty) filter.difficulty = query.difficulty;
    if (query.phase) filter.phaseId = new Types.ObjectId(query.phase);
    if (query.topic) filter.topicId = new Types.ObjectId(query.topic);
    if (query.pattern) filter.pattern = query.pattern;
    if (query.representative !== undefined) filter.representative = query.representative;

    if (query.q) {
      const rx = new RegExp(escapeRegex(query.q), 'i');
      filter.$or = [{ title: rx }, { pattern: rx }, { tags: rx }, { platformProblemId: rx }];
    }

    // `status` and `favorite` are per-user (UserProblem) → resolve to _id constraints.
    const idConstraints: FilterQuery<IProblem>[] = [];

    if (query.favorite !== undefined) {
      const ids = await userProblemRepository.problemIdsByState(userId, { favorite: query.favorite });
      idConstraints.push(
        query.favorite ? { _id: { $in: toObjectIds(ids) } } : { _id: { $nin: toObjectIds(ids) } },
      );
    }

    if (query.status) {
      if (query.status === 'Not Started') {
        // No record (or an explicit Not Started) → exclude anything In Progress/Solved.
        const [inProgress, solved] = await Promise.all([
          userProblemRepository.problemIdsByState(userId, { status: 'In Progress' }),
          userProblemRepository.problemIdsByState(userId, { status: 'Solved' }),
        ]);
        idConstraints.push({ _id: { $nin: toObjectIds([...inProgress, ...solved]) } });
      } else {
        const ids = await userProblemRepository.problemIdsByState(userId, { status: query.status });
        idConstraints.push({ _id: { $in: toObjectIds(ids) } });
      }
    }

    if (idConstraints.length) filter.$and = idConstraints;
    return filter;
  },

  async overlayMap(userId: string, ids: string[]): Promise<Map<string, UserProblemDocument>> {
    const rows = await userProblemRepository.findByUserAndProblems(userId, ids);
    return new Map(rows.map((r) => [String(r.problemId), r]));
  },
};

function toListItem(problem: ProblemDocument, up?: UserProblemDocument): ProblemListItemDTO {
  return {
    id: String(problem._id),
    title: problem.title,
    slug: problem.slug,
    platform: problem.platform,
    platformProblemId: problem.platformProblemId,
    url: problem.url,
    difficulty: problem.difficulty,
    pattern: problem.pattern,
    tags: problem.tags,
    representative: problem.representative,
    estimatedSolveTime: problem.estimatedSolveTime,
    phaseId: String(problem.phaseId),
    topicId: String(problem.topicId),
    editorialUrl: problem.editorialUrl || undefined,
    status: up?.status ?? 'Not Started',
    favorite: up?.favorite ?? false,
  };
}

function toObjectIds(ids: string[]): Types.ObjectId[] {
  return ids.map((id) => new Types.ObjectId(id));
}

function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
