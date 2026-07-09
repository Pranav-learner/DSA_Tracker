import { Types, type FilterQuery, type SortOrder } from 'mongoose';
import { notebookRepository } from '../repositories/notebook.repository.js';
import { problemRepository } from '../repositories/problem.repository.js';
import { topicRepository } from '../repositories/topic.repository.js';
import { phaseRepository } from '../repositories/phase.repository.js';
import { notebookIntegration } from './notebookIntegration.js';
import { toPhaseRefDTO } from './mappers.js';
import { ApiError } from '../utils/ApiError.js';
import { PLATFORMS } from '../types/domain.js';
import type { NotebookEntryDocument, INotebookEntry } from '../models/NotebookEntry.js';
import type { ProblemDocument } from '../models/Problem.js';
import type { TopicDocument } from '../models/Topic.js';
import type { CreateNotebookBody, UpdateNotebookBody } from '../validators/notebook.validator.js';
import type {
  NotebookDetailDTO,
  NotebookFacetsDTO,
  NotebookListItemDTO,
  NotebookQuery,
  NotebookRefDTO,
  RelatedProblemRefDTO,
} from './notebook.dto.js';
import type { PaginatedDTO } from './problem.dto.js';

const SORT_FIELD: Record<NotebookQuery['sort'], string> = {
  recent: 'updatedAt',
  confidence: 'confidence',
  reviewed: 'lastReviewedAt',
  alpha: 'title',
};

/**
 * NotebookService — the Knowledge Engine's business logic. Owns creation/update/
 * search of structured notebook entries and their knowledge relationships
 * (related problems + related entries), plus the Module-1 integration. All DB
 * access is delegated to repositories.
 */
export const notebookService = {
  async create(userId: string, body: CreateNotebookBody): Promise<NotebookDetailDTO> {
    const problem = await requireProblem(body.problemId);

    // Duplicate guard — one notebook per (user, problem).
    const existing = await notebookRepository.findByUserAndProblem(userId, body.problemId);
    if (existing) {
      throw new ApiError(409, 'A notebook entry already exists for this problem');
    }

    const relatedProblems = await this.validateRelatedProblems(body.relatedProblems);
    const relatedEntries = await this.validateRelatedEntries(userId, body.relatedEntries);

    const doc = await notebookRepository.create({
      userId,
      problemId: problem._id,
      topicId: problem.topicId,
      phaseId: problem.phaseId,
      // Identity pre-filled from the problem when not supplied.
      title: body.title ?? problem.title,
      pattern: body.pattern ?? problem.pattern,
      platform: body.platform ?? problem.platform,
      recognitionKeywords: body.recognitionKeywords ?? problem.tags,
      observation: body.observation ?? '',
      coreAlgorithm: body.coreAlgorithm ?? '',
      timeComplexity: body.timeComplexity ?? '',
      spaceComplexity: body.spaceComplexity ?? '',
      alternativeSolutions: body.alternativeSolutions ?? [],
      commonMistakes: body.commonMistakes ?? [],
      lessonsLearned: body.lessonsLearned ?? '',
      personalNotes: body.personalNotes ?? '',
      confidence: body.confidence ?? 50,
      relatedProblems,
      relatedEntries,
      revisionDates: [],
      lastReviewedAt: null,
    });

    await notebookIntegration.onCreated(userId, { entry: doc, problem });
    return this.toDetail(doc);
  },

  async update(userId: string, id: string, body: UpdateNotebookBody): Promise<NotebookDetailDTO> {
    const entry = await requireOwned(userId, id);

    const patch: Partial<INotebookEntry> = definedOnly({
      title: body.title,
      pattern: body.pattern,
      platform: body.platform,
      recognitionKeywords: body.recognitionKeywords,
      observation: body.observation,
      coreAlgorithm: body.coreAlgorithm,
      timeComplexity: body.timeComplexity,
      spaceComplexity: body.spaceComplexity,
      alternativeSolutions: body.alternativeSolutions,
      commonMistakes: body.commonMistakes,
      lessonsLearned: body.lessonsLearned,
      personalNotes: body.personalNotes,
      confidence: body.confidence,
    });

    if (body.relatedProblems !== undefined) {
      patch.relatedProblems = await this.validateRelatedProblems(body.relatedProblems);
    }
    if (body.relatedEntries !== undefined) {
      // An entry can't relate to itself.
      patch.relatedEntries = await this.validateRelatedEntries(
        userId,
        body.relatedEntries.filter((rid) => rid !== id),
      );
    }

    // `review` records that the entry was revised (NOT a scheduler).
    if (body.review) {
      const now = new Date();
      patch.revisionDates = [...entry.revisionDates, now];
      patch.lastReviewedAt = now;
    }

    const updated = await notebookRepository.updateById(id, patch);
    if (!updated) throw ApiError.notFound(`Notebook entry '${id}' not found`);

    const problem = await requireProblem(String(updated.problemId));
    await notebookIntegration.onUpdated(userId, { entry: updated, problem });
    return this.toDetail(updated);
  },

  async getById(userId: string, id: string): Promise<NotebookDetailDTO> {
    return this.toDetail(await requireOwned(userId, id));
  },

  async remove(userId: string, id: string): Promise<void> {
    const entry = await requireOwned(userId, id);
    await notebookRepository.deleteById(id);
    // Keep relationships consistent: drop this id from other entries.
    await notebookRepository.pullRelatedEntryRef(userId, String(entry._id));
  },

  async list(userId: string, query: NotebookQuery): Promise<PaginatedDTO<NotebookListItemDTO>> {
    const filter = buildFilter(userId, query);
    const dir: SortOrder = query.order === 'desc' ? -1 : 1;
    const sortField = SORT_FIELD[query.sort];
    const sort: Record<string, SortOrder> = { [sortField]: dir };
    if (sortField !== 'title') sort.title = 1;

    const skip = (query.page - 1) * query.pageSize;
    const { items, total } = await notebookRepository.search(filter, { skip, limit: query.pageSize, sort });

    const topicTitles = await topicTitleMap(items.map((e) => String(e.topicId)));
    const dtos = items.map((e) => toListItem(e, topicTitles));

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

  async facets(userId: string): Promise<NotebookFacetsDTO> {
    const patterns = await notebookRepository.distinctPatterns(userId);
    return {
      patterns: patterns.filter(Boolean).sort((a, b) => a.localeCompare(b)),
      platforms: [...PLATFORMS],
    };
  },

  /** Ensure related problems exist; returns their ObjectIds (deduped). */
  async validateRelatedProblems(ids: string[] | undefined): Promise<Types.ObjectId[]> {
    if (!ids || ids.length === 0) return [];
    const unique = [...new Set(ids)];
    const docs = await problemRepository.findByIds(unique);
    if (docs.length !== unique.length) {
      throw ApiError.badRequest('One or more related problems do not exist');
    }
    return unique.map((id) => new Types.ObjectId(id));
  },

  /** Ensure related entries exist and belong to the user; returns their ObjectIds. */
  async validateRelatedEntries(userId: string, ids: string[] | undefined): Promise<Types.ObjectId[]> {
    if (!ids || ids.length === 0) return [];
    const unique = [...new Set(ids)];
    const docs = await notebookRepository.findByIdsForUser(userId, unique);
    if (docs.length !== unique.length) {
      throw ApiError.badRequest('One or more related notebook entries are invalid');
    }
    return unique.map((id) => new Types.ObjectId(id));
  },

  /** Expand an entry into the full detail DTO with resolved relationships. */
  async toDetail(entry: NotebookEntryDocument): Promise<NotebookDetailDTO> {
    const relatedProblemIds = entry.relatedProblems.map(String);
    const relatedEntryIds = entry.relatedEntries.map(String);

    const [topic, phase, relatedProblemDocs, relatedEntryDocs] = await Promise.all([
      topicRepository.findById(String(entry.topicId)),
      phaseRepository.findById(String(entry.phaseId)),
      problemRepository.findByIds(relatedProblemIds),
      notebookRepository.findByIdsForUser(entry.userId, relatedEntryIds),
    ]);

    const relTopicTitles = await topicTitleMap(relatedProblemDocs.map((p) => String(p.topicId)));

    const relatedProblems: RelatedProblemRefDTO[] = relatedProblemDocs.map((p) => ({
      id: String(p._id),
      title: p.title,
      slug: p.slug,
      pattern: p.pattern,
      difficulty: p.difficulty,
      platform: p.platform,
      topicId: String(p.topicId),
      topicTitle: relTopicTitles.get(String(p.topicId)) ?? '',
    }));

    const relatedEntries: NotebookRefDTO[] = relatedEntryDocs.map((e) => ({
      id: String(e._id),
      problemId: String(e.problemId),
      title: e.title,
      pattern: e.pattern,
      confidence: e.confidence,
    }));

    return {
      id: String(entry._id),
      userId: entry.userId,
      problemId: String(entry.problemId),
      topicId: String(entry.topicId),
      phaseId: String(entry.phaseId),
      title: entry.title,
      platform: entry.platform,
      pattern: entry.pattern,
      recognitionKeywords: entry.recognitionKeywords,
      observation: entry.observation,
      coreAlgorithm: entry.coreAlgorithm,
      timeComplexity: entry.timeComplexity,
      spaceComplexity: entry.spaceComplexity,
      alternativeSolutions: entry.alternativeSolutions,
      commonMistakes: entry.commonMistakes,
      lessonsLearned: entry.lessonsLearned,
      personalNotes: entry.personalNotes,
      confidence: entry.confidence,
      revisionDates: entry.revisionDates.map((d) => d.toISOString()),
      revisionCount: entry.revisionDates.length,
      lastReviewedAt: entry.lastReviewedAt ? entry.lastReviewedAt.toISOString() : null,
      createdAt: entry.createdAt.toISOString(),
      updatedAt: entry.updatedAt.toISOString(),
      topic: topic
        ? { id: String(topic._id), title: topic.title, slug: topic.slug, phaseId: String(topic.phaseId) }
        : null,
      phase: phase ? toPhaseRefDTO(phase) : null,
      relatedProblems,
      relatedEntries,
    };
  },
};

/* ------------------------------- helpers -------------------------------- */

async function requireProblem(problemId: string): Promise<ProblemDocument> {
  const problem = await problemRepository.findById(problemId);
  if (!problem) throw ApiError.notFound(`Problem '${problemId}' not found`);
  return problem;
}

async function requireOwned(userId: string, id: string): Promise<NotebookEntryDocument> {
  const entry = await notebookRepository.findById(id);
  if (!entry) throw ApiError.notFound(`Notebook entry '${id}' not found`);
  if (entry.userId !== userId) throw new ApiError(403, 'You do not own this notebook entry');
  return entry;
}

/** Batch-resolve topic id → title (one query). */
async function topicTitleMap(topicIds: string[]): Promise<Map<string, string>> {
  const unique = [...new Set(topicIds)];
  if (unique.length === 0) return new Map();
  const topics = await topicRepository.findByIds(unique);
  return new Map(topics.map((t: TopicDocument) => [String(t._id), t.title]));
}

function buildFilter(userId: string, query: NotebookQuery): FilterQuery<INotebookEntry> {
  const filter: FilterQuery<INotebookEntry> = { userId };
  if (query.pattern) filter.pattern = query.pattern;
  if (query.topic) filter.topicId = new Types.ObjectId(query.topic);
  if (query.phase) filter.phaseId = new Types.ObjectId(query.phase);
  if (query.platform) filter.platform = query.platform;
  if (query.problem) filter.problemId = new Types.ObjectId(query.problem);
  if (query.tag) filter.recognitionKeywords = query.tag;

  if (query.confidenceMin !== undefined || query.confidenceMax !== undefined) {
    filter.confidence = {};
    if (query.confidenceMin !== undefined) filter.confidence.$gte = query.confidenceMin;
    if (query.confidenceMax !== undefined) filter.confidence.$lte = query.confidenceMax;
  }

  if (query.q) {
    const rx = new RegExp(escapeRegex(query.q), 'i');
    filter.$or = [
      { title: rx },
      { pattern: rx },
      { observation: rx },
      { coreAlgorithm: rx },
      { lessonsLearned: rx },
      { recognitionKeywords: rx },
    ];
  }
  return filter;
}

function toListItem(entry: NotebookEntryDocument, topicTitles: Map<string, string>): NotebookListItemDTO {
  return {
    id: String(entry._id),
    problemId: String(entry.problemId),
    topicId: String(entry.topicId),
    phaseId: String(entry.phaseId),
    title: entry.title,
    pattern: entry.pattern,
    platform: entry.platform,
    topicTitle: topicTitles.get(String(entry.topicId)) ?? '',
    confidence: entry.confidence,
    revisionCount: entry.revisionDates.length,
    relatedCount: entry.relatedProblems.length + entry.relatedEntries.length,
    lastReviewedAt: entry.lastReviewedAt ? entry.lastReviewedAt.toISOString() : null,
    createdAt: entry.createdAt.toISOString(),
    updatedAt: entry.updatedAt.toISOString(),
  };
}

function definedOnly<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const out: Partial<T> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) out[k as keyof T] = v as T[keyof T];
  }
  return out;
}

function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
