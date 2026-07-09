import { notebookService } from './notebook.service.js';
import { topicService } from './topic.service.js';
import { problemService } from './problem.service.js';
import { revisionSessionService } from './revisionSession.service.js';
import { revisionScheduleService } from './revisionSchedule.service.js';
import { revisionScheduleRepository } from '../repositories/revisionSchedule.repository.js';
import { toRevisionScheduleDTO } from './revision.util.js';
import { REVISION_ESTIMATED_MINUTES } from '../config/revision.js';
import { ApiError } from '../utils/ApiError.js';
import type { Difficulty, Platform, RevisionEntityType } from '../types/domain.js';
import type { ProblemListItemDTO } from './problem.dto.js';
import type { RelatedProblemRefDTO } from './notebook.dto.js';
import type { RevisionContentDTO, RevisionWorkspaceDTO } from './revisionSession.dto.js';

interface WorkspaceParams {
  scheduleId?: string;
  entityType?: RevisionEntityType;
  entityId?: string;
}

/**
 * RevisionWorkspaceService — assembles the workspace's knowledge content by
 * COMPOSING Module 2 data (topic concept + notebook + problem library). Nothing
 * is copied/stored; it's resolved live, so there is zero duplicate knowledge
 * storage. Also resolves the active session + owning schedule for the page.
 */
export const revisionWorkspaceService = {
  async getWorkspace(userId: string, params: WorkspaceParams): Promise<RevisionWorkspaceDTO> {
    const { entityType, entityId, schedule } = await this.resolveTarget(userId, params);
    const [content, activeSession] = await Promise.all([
      this.getContent(userId, entityType, entityId),
      revisionSessionService.getActive(userId),
    ]);
    return { content, activeSession, schedule };
  },

  /** Resolve entityType/entityId (+ schedule DTO) from a scheduleId or an entity. */
  async resolveTarget(userId: string, params: WorkspaceParams) {
    if (params.scheduleId) {
      const schedule = await revisionScheduleService.getById(userId, params.scheduleId);
      return { entityType: schedule.entityType, entityId: schedule.entityId, schedule };
    }
    if (!params.entityType || !params.entityId) {
      throw ApiError.badRequest('Provide a scheduleId, or an entityType + entityId');
    }
    const active = await revisionScheduleRepository.findActiveForEntity(userId, params.entityType, params.entityId);
    return {
      entityType: params.entityType,
      entityId: params.entityId,
      schedule: active ? toRevisionScheduleDTO(active, new Date()) : null,
    };
  },

  async getContent(userId: string, entityType: RevisionEntityType, entityId: string): Promise<RevisionContentDTO> {
    if (entityType === 'knowledgeEntry') return this.contentFromNotebook(userId, entityId);
    if (entityType === 'topic') return this.contentFromTopic(userId, entityId);
    return this.contentFromPattern(userId, entityId);
  },

  async contentFromNotebook(userId: string, notebookId: string): Promise<RevisionContentDTO> {
    const nb = await notebookService.getById(userId, notebookId);
    const topic = await topicService.getById(nb.topicId).catch(() => null);
    const representativeProblems = await this.representativeProblems(userId, nb.topicId, topic?.title ?? '');

    return {
      entityType: 'knowledgeEntry',
      entityId: notebookId,
      title: nb.title,
      pattern: nb.pattern,
      topic: nb.topic,
      phase: nb.phase,
      recognitionKeywords: nb.recognitionKeywords.length ? nb.recognitionKeywords : (topic?.recognitionKeywords ?? []),
      coreIdea: nb.observation || (topic?.concept.coreIdea ?? ''),
      coreAlgorithm: nb.coreAlgorithm,
      whenToUse: topic?.concept.whenToUse ?? '',
      whenNotToUse: topic?.concept.whenNotToUse ?? '',
      timeComplexity: nb.timeComplexity || (topic?.concept.timeComplexity ?? ''),
      spaceComplexity: nb.spaceComplexity || (topic?.concept.spaceComplexity ?? ''),
      commonMistakes: nb.commonMistakes,
      contestTraps: topic?.concept.limitations ?? [],
      alternativeSolutions: nb.alternativeSolutions,
      representativeProblems,
      relatedProblems: nb.relatedProblems,
      knowledgeNotes: [nb.lessonsLearned, nb.personalNotes].filter(Boolean).join('\n\n'),
      confidence: nb.confidence,
      estimatedReviewMinutes: REVISION_ESTIMATED_MINUTES.knowledgeEntry,
      hasNotebook: true,
      notebookId,
    };
  },

  async contentFromTopic(userId: string, topicId: string): Promise<RevisionContentDTO> {
    const topic = await topicService.getById(topicId);
    const [representativeProblems, relatedPage] = await Promise.all([
      this.representativeProblems(userId, topicId, topic.title),
      problemService.list(userId, {
        page: 1,
        pageSize: 6,
        sort: 'difficulty',
        order: 'asc',
        topic: topicId,
        representative: false,
      }),
    ]);

    return {
      entityType: 'topic',
      entityId: topicId,
      title: topic.title,
      pattern: '',
      topic: { id: topic.id, title: topic.title, slug: topic.slug, phaseId: topic.phaseId },
      phase: topic.phase,
      recognitionKeywords: topic.recognitionKeywords,
      coreIdea: topic.concept.coreIdea,
      coreAlgorithm: '',
      whenToUse: topic.concept.whenToUse,
      whenNotToUse: topic.concept.whenNotToUse,
      timeComplexity: topic.concept.timeComplexity,
      spaceComplexity: topic.concept.spaceComplexity,
      commonMistakes: [],
      contestTraps: topic.concept.limitations,
      alternativeSolutions: [],
      representativeProblems,
      relatedProblems: relatedPage.items.map((p) => toProblemRef(p, topic.title)),
      knowledgeNotes: '',
      confidence: null,
      estimatedReviewMinutes: REVISION_ESTIMATED_MINUTES.topic,
      hasNotebook: false,
      notebookId: null,
    };
  },

  async contentFromPattern(userId: string, pattern: string): Promise<RevisionContentDTO> {
    const [problemsPage, nbPage] = await Promise.all([
      problemService.list(userId, { page: 1, pageSize: 8, sort: 'difficulty', order: 'asc', pattern }),
      notebookService.list(userId, { page: 1, pageSize: 1, sort: 'confidence', order: 'desc', pattern }),
    ]);
    const nb = nbPage.items[0] ? await notebookService.getById(userId, nbPage.items[0].id) : null;

    return {
      entityType: 'pattern',
      entityId: pattern,
      title: pattern,
      pattern,
      topic: nb?.topic ?? null,
      phase: nb?.phase ?? null,
      recognitionKeywords: nb?.recognitionKeywords ?? [],
      coreIdea: nb?.observation ?? '',
      coreAlgorithm: nb?.coreAlgorithm ?? '',
      whenToUse: '',
      whenNotToUse: '',
      timeComplexity: nb?.timeComplexity ?? '',
      spaceComplexity: nb?.spaceComplexity ?? '',
      commonMistakes: nb?.commonMistakes ?? [],
      contestTraps: [],
      alternativeSolutions: nb?.alternativeSolutions ?? [],
      representativeProblems: problemsPage.items.filter((p) => p.representative).map((p) => toProblemRef(p, '')),
      relatedProblems: problemsPage.items.filter((p) => !p.representative).map((p) => toProblemRef(p, '')),
      knowledgeNotes: nb ? [nb.lessonsLearned, nb.personalNotes].filter(Boolean).join('\n\n') : '',
      confidence: nb?.confidence ?? null,
      estimatedReviewMinutes: REVISION_ESTIMATED_MINUTES.pattern,
      hasNotebook: Boolean(nb),
      notebookId: nb?.id ?? null,
    };
  },

  async representativeProblems(userId: string, topicId: string, topicTitle: string): Promise<RelatedProblemRefDTO[]> {
    const page = await problemService.list(userId, {
      page: 1,
      pageSize: 6,
      sort: 'difficulty',
      order: 'asc',
      topic: topicId,
      representative: true,
    });
    return page.items.map((p) => toProblemRef(p, topicTitle));
  },
};

function toProblemRef(p: ProblemListItemDTO, topicTitle: string): RelatedProblemRefDTO {
  return {
    id: p.id,
    title: p.title,
    slug: p.slug,
    pattern: p.pattern,
    difficulty: p.difficulty as Difficulty,
    platform: p.platform as Platform,
    topicId: p.topicId,
    topicTitle,
  };
}
