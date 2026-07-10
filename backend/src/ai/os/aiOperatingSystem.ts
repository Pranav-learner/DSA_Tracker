import { contextComposerService } from '../context/contextComposer.service.js';
import { workspaceService } from '../services/workspace.service.js';
import { actionGenerator } from './actionGenerator.js';
import { workflowEngine } from './workflowEngine.js';
import { recommendationManager } from './recommendationManager.js';
import { mentorBriefService } from './mentorBrief.service.js';
import { mentorTimelineService, type TimelineQuery } from './mentorTimeline.service.js';
import { workflowRepository } from '../repositories/workflow.repository.js';
import { CONTEXT_PROFILES } from '../types/ai.types.js';
import { ApiError } from '../../utils/ApiError.js';
import { logger } from '../../utils/logger.js';
import type { AIContext, ContextProfileName } from '../types/ai.types.js';
import type { MentorWorkflowDocument } from '../../models/MentorWorkflow.js';
import type {
  BriefKind,
  MentorAction,
  MentorBriefDTO,
  MentorOverviewDTO,
  RecommendationDTO,
  RecommendationStatsDTO,
  RecommendationStatus,
  TimelineEntryDTO,
  WorkflowDTO,
  WorkflowKey,
  WorkflowStatus,
  WorkflowStepDTO,
} from './types.js';

const ALL_PROFILES = [...CONTEXT_PROFILES] as ContextProfileName[];

function workflowDocToDTO(doc: MentorWorkflowDocument): WorkflowDTO {
  return {
    id: String(doc._id),
    key: doc.key,
    name: doc.name,
    description: doc.description,
    category: doc.category,
    difficulty: doc.difficulty as WorkflowDTO['difficulty'],
    estimatedMinutes: doc.estimatedMinutes,
    modules: doc.modules,
    steps: doc.steps as WorkflowStepDTO[],
    expectedOutcome: doc.expectedOutcome,
    generatedAt: doc.createdAt.toISOString(),
    status: doc.status,
  };
}

/**
 * AIOperatingSystem (Module 7 · Sprint 4). The high-level entry point for AI
 * interactions and the coordination layer over everything built in Sprints 1–3:
 * it builds the learner's context ONCE and delegates to the WorkflowEngine,
 * ActionGenerator, RecommendationManager, MentorBriefService and MentorTimeline.
 *
 * Principle: the AI **recommends and structures**; the learner decides. Nothing
 * here mutates learning data — actions are deep links, workflows are suggested
 * step sequences, and a workflow only ever affects progress when the learner
 * follows a step and confirms it inside the target module. If context/AI is
 * unavailable, every method degrades to rule-based output.
 */
export const aiOperatingSystem = {
  /** Build the shared, broad learner context (all profiles) — reused per request. */
  async buildContext(userId: string): Promise<AIContext> {
    try {
      return await contextComposerService.compose(userId, { intent: 'general', profiles: ALL_PROFILES });
    } catch (err) {
      logger.warn('AIOperatingSystem: context build failed — degrading to empty context', err);
      return { intent: 'general', profiles: [], sections: [], generatedAt: new Date().toISOString(), tokenEstimate: 0 };
    }
  },

  /** Contextual deep-link actions the learner can take right now. */
  async actions(userId: string): Promise<MentorAction[]> {
    return actionGenerator.generate(await this.buildContext(userId));
  },

  /** Generate a workflow (optionally saving it so it lives in GET /workflows). */
  async generateWorkflow(userId: string, key: WorkflowKey, opts: { save?: boolean } = {}): Promise<WorkflowDTO> {
    if (!workflowEngine.isKey(key)) throw ApiError.badRequest(`Unknown workflow '${key}'`);
    const context = await this.buildContext(userId);
    const workflow = workflowEngine.build(context, key);
    if (!opts.save) return workflow;
    const doc = await workflowRepository.create(userId, workflow);
    return workflowDocToDTO(doc);
  },

  /** All workflow templates populated with the learner's live context (preview). */
  async previewWorkflows(userId: string): Promise<WorkflowDTO[]> {
    return workflowEngine.buildAll(await this.buildContext(userId));
  },

  /** The learner's saved workflows (recent first). */
  async listWorkflows(userId: string): Promise<WorkflowDTO[]> {
    return (await workflowRepository.list(userId)).map(workflowDocToDTO);
  },

  async updateWorkflowStatus(userId: string, id: string, status: WorkflowStatus): Promise<WorkflowDTO> {
    const doc = await workflowRepository.updateStatus(userId, id, status);
    if (!doc) throw ApiError.notFound('Workflow not found');
    return workflowDocToDTO(doc);
  },

  /** Generate (upsert) + return the learner's active recommendations. */
  async recommendations(userId: string): Promise<RecommendationDTO[]> {
    const context = await this.buildContext(userId);
    await recommendationManager.generate(userId, context);
    return recommendationManager.list(userId);
  },

  async listRecommendations(userId: string, status?: RecommendationStatus): Promise<RecommendationDTO[]> {
    return recommendationManager.list(userId, status ? { status } : {});
  },

  async updateRecommendation(userId: string, id: string, status: RecommendationStatus): Promise<RecommendationDTO> {
    return recommendationManager.update(userId, id, status);
  },

  async recommendationStats(userId: string): Promise<RecommendationStatsDTO> {
    return recommendationManager.stats(userId);
  },

  /** Generate a mentor brief on demand (rule-based; always available). */
  async brief(userId: string, kind: BriefKind = 'daily'): Promise<MentorBriefDTO> {
    const context = await this.buildContext(userId);
    const [snapshot] = await Promise.all([workspaceService.getSnapshot(userId)]);
    const recommendations = await recommendationManager.generate(userId, context);
    const actions = actionGenerator.generate(context);
    const suggestKey = workflowEngine.suggest(context);
    const suggestedWorkflow = workflowEngine.templates().find((t) => t.key === suggestKey) ?? null;

    return mentorBriefService.build(kind, {
      snapshot,
      context,
      recommendations,
      suggestedWorkflow: suggestedWorkflow ? { key: suggestKey, name: suggestedWorkflow.name } : null,
      quickStart: actions,
    });
  },

  /** The searchable mentor timeline. */
  async timeline(userId: string, query: TimelineQuery = {}): Promise<TimelineEntryDTO[]> {
    return mentorTimelineService.get(userId, query);
  },

  /** One call powering the AI OS dashboard header (brief + workflows + recs + actions). */
  async overview(userId: string): Promise<MentorOverviewDTO> {
    const context = await this.buildContext(userId);
    const snapshot = await workspaceService.getSnapshot(userId);
    const recommendations = await recommendationManager.generate(userId, context);
    const stats = await recommendationManager.stats(userId);
    const actions = actionGenerator.generate(context);
    const workflows = workflowEngine.buildAll(context);
    const suggestKey = workflowEngine.suggest(context);
    const suggestedWorkflow = workflowEngine.templates().find((t) => t.key === suggestKey) ?? null;

    const brief = mentorBriefService.build('daily', {
      snapshot,
      context,
      recommendations,
      suggestedWorkflow: suggestedWorkflow ? { key: suggestKey, name: suggestedWorkflow.name } : null,
      quickStart: actions,
    });

    return { brief, workflows, recommendations, stats, actions };
  },

  /** Expose workflow templates (metadata only) for catalogues/validation. */
  workflowTemplates() {
    return workflowEngine.templates();
  },

  isWorkflowKey(value: string): value is WorkflowKey {
    return workflowEngine.isKey(value);
  },
};
