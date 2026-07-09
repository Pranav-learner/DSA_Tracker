import { problemService } from './problem.service.js';
import { attemptService } from './attempt.service.js';
import { progressService } from './progress.service.js';
import { recommendationService } from './recommendation.service.js';
import { learningIntegrationService } from './learningIntegration.service.js';
import { activityService } from './activity.service.js';
import { problemRepository } from '../repositories/problem.repository.js';
import { notebookRepository } from '../repositories/notebook.repository.js';
import { topicRepository } from '../repositories/topic.repository.js';
import { ApiError } from '../utils/ApiError.js';
import type { ProblemDetailDTO } from './problem.dto.js';
import type { RelatedProblemRefDTO } from './notebook.dto.js';
import type { CompleteProblemBody } from '../validators/problemComplete.validator.js';
import type {
  LearningImpactDTO,
  LearningSummaryDTO,
  NotebookRefLiteDTO,
  WorkspaceDTO,
} from './workspace.dto.js';

const RELATED_LIMIT = 6;
const WORKSPACE_ACTIVITY_LIMIT = 10;

/**
 * WorkspaceService — read aggregation for the Problem Workspace and the
 * completion command. It composes existing services (problem / attempt /
 * progress / recommendation / notebook / integration) into one payload and
 * drives `POST /complete` through the Attempt engine so the whole integration
 * chain runs exactly once. Holds no business rules of its own.
 */
export const workspaceService = {
  async getWorkspace(userId: string, problemId: string): Promise<WorkspaceDTO> {
    const problem = await problemService.getById(userId, problemId); // 404s if missing

    const [attemptSummary, notebookDoc, overview, activity] = await Promise.all([
      attemptService.summary(userId, problemId),
      notebookRepository.findByUserAndProblem(userId, problemId),
      progressService.getOverview(userId),
      activityService.getRecent(userId, WORKSPACE_ACTIVITY_LIMIT),
    ]);

    const topicOverlay = overview.topics.find((t) => t.topicId === problem.topicId) ?? null;
    const recommendation = recommendationService.build(overview);
    const learningStatus = learningIntegrationService.deriveLearningStatus(
      { solved: attemptSummary.solved, totalAttempts: attemptSummary.totalAttempts },
      notebookDoc,
    );

    const learningSummary: LearningSummaryDTO = {
      topic: problem.topic,
      phase: problem.phase,
      topicMastery: topicOverlay?.mastery ?? 0,
      pattern: problem.pattern,
      representative: problem.representative,
      confidence: notebookDoc?.confidence ?? null,
      problemStatus: learningStatus,
      recommendation,
    };

    const learningImpact = learningIntegrationService.buildImpact(
      overview,
      problem.topicId,
      problemId,
      null,
      recommendation,
    );

    const notebook: NotebookRefLiteDTO | null = notebookDoc
      ? {
          id: String(notebookDoc._id),
          pattern: notebookDoc.pattern,
          confidence: notebookDoc.confidence,
          revisionCount: notebookDoc.revisionDates.length,
          hasMetadata: Boolean(notebookDoc.observation.trim()) && Boolean(notebookDoc.coreAlgorithm.trim()),
          updatedAt: notebookDoc.updatedAt.toISOString(),
        }
      : null;

    const relatedProblems = await this.getRelatedProblems(problem);

    return {
      problem,
      attemptSummary,
      notebook,
      learningStatus,
      learningSummary,
      learningImpact,
      relatedProblems,
      activity,
    };
  },

  /**
   * Mark a problem solved and trigger the full integration flow. Idempotent:
   * if already solved it returns the current impact without side effects
   * (prevents duplicate completion). Otherwise it records a "solved" attempt via
   * the Attempt engine, which fires the learning integration exactly once.
   */
  async completeProblem(
    userId: string,
    problemId: string,
    body: CompleteProblemBody,
  ): Promise<LearningImpactDTO> {
    const problem = await problemRepository.findById(problemId);
    if (!problem) throw ApiError.notFound(`Problem '${problemId}' not found`);

    const summary = await attemptService.summary(userId, problemId);
    if (summary.solved) {
      const impact = await learningIntegrationService.getLearningImpact(userId, problemId);
      return { ...impact, alreadyCompleted: true };
    }

    const topicId = String(problem.topicId);
    const before = await progressService.getOverview(userId);
    const masteryBefore = before.topics.find((t) => t.topicId === topicId)?.mastery ?? 0;

    // Record a "solved" attempt — this fires the integration chain (mastery,
    // recommendation, activity) exactly once via the Attempt engine.
    const now = new Date();
    const duration = body.durationMinutes ?? 0;
    await attemptService.create(userId, {
      problemId,
      status: 'Solved',
      verdict: 'Accepted',
      language: body.language ?? 'Other',
      startTime: new Date(now.getTime() - duration * 60_000),
      endTime: now,
      durationMinutes: duration,
      notes: body.notes,
    });

    // Report the before/after impact of this completion.
    const after = await progressService.getOverview(userId);
    const impact = learningIntegrationService.buildImpact(after, topicId, problemId, masteryBefore);
    return { ...impact, alreadyCompleted: false };
  },

  async getRelatedProblems(problem: ProblemDetailDTO): Promise<RelatedProblemRefDTO[]> {
    const docs = await problemRepository.findRelated(problem.topicId, problem.pattern, problem.id, RELATED_LIMIT);
    const topicTitles = await topicTitleMap(docs.map((d) => String(d.topicId)));
    return docs.map((p) => ({
      id: String(p._id),
      title: p.title,
      slug: p.slug,
      pattern: p.pattern,
      difficulty: p.difficulty,
      platform: p.platform,
      topicId: String(p.topicId),
      topicTitle: topicTitles.get(String(p.topicId)) ?? problem.topic?.title ?? '',
    }));
  },
};

async function topicTitleMap(topicIds: string[]): Promise<Map<string, string>> {
  const unique = [...new Set(topicIds)];
  if (unique.length === 0) return new Map();
  const topics = await topicRepository.findByIds(unique);
  return new Map(topics.map((t) => [String(t._id), t.title]));
}
