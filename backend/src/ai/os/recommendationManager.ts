import { recommendationRepository, type RecommendationFilter } from '../repositories/recommendation.repository.js';
import { actionGenerator } from './actionGenerator.js';
import { sectionData } from '../coaches/actions.js';
import { ApiError } from '../../utils/ApiError.js';
import type { RecommendationDocument } from '../../models/Recommendation.js';
import type { AIContext } from '../types/ai.types.js';
import type {
  MentorAction,
  RecommendationDTO,
  RecommendationPriority,
  RecommendationSource,
  RecommendationStatus,
  RecommendationStatsDTO,
} from './types.js';

/** The timestamp field to stamp when a recommendation moves to a status. */
const STATUS_TIMESTAMP: Partial<Record<RecommendationStatus, 'viewedAt' | 'acceptedAt' | 'dismissedAt' | 'completedAt' | 'archivedAt'>> = {
  viewed: 'viewedAt',
  accepted: 'acceptedAt',
  dismissed: 'dismissedAt',
  completed: 'completedAt',
  archived: 'archivedAt',
};

function toDTO(doc: RecommendationDocument): RecommendationDTO {
  return {
    id: String(doc._id),
    key: doc.key,
    title: doc.title,
    reason: doc.reason,
    priority: doc.priority,
    source: doc.source,
    action: (doc.action as MentorAction | null) ?? null,
    status: doc.status,
    intent: (doc.intent as RecommendationDTO['intent']) ?? null,
    coachId: doc.coachId,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
    viewedAt: doc.viewedAt?.toISOString() ?? null,
    acceptedAt: doc.acceptedAt?.toISOString() ?? null,
    dismissedAt: doc.dismissedAt?.toISOString() ?? null,
    completedAt: doc.completedAt?.toISOString() ?? null,
    archivedAt: doc.archivedAt?.toISOString() ?? null,
  };
}

interface RecoSeed {
  key: string;
  title: string;
  reason: string;
  priority: RecommendationPriority;
  source: RecommendationSource;
  actionKind: string | null;
}

/**
 * RecommendationManager (Module 7 · Sprint 4). Owns the recommendation LIFECYCLE
 * (Generated → Viewed → Accepted → Completed / Dismissed → Archived) and its
 * persistence. `generate` derives rule-based recommendations from the learner's
 * CONTEXT and upserts them by a stable key — so regeneration refreshes the text
 * but never resets the status a learner has driven, and identical recommendations
 * are never duplicated. The AI only ever RECOMMENDS; status changes come from
 * explicit user actions (PATCH).
 */
export const recommendationManager = {
  /** Derive rule-based recommendations from context and persist them (upsert by key). */
  async generate(userId: string, context: AIContext): Promise<RecommendationDTO[]> {
    const seeds = buildSeeds(context);
    const docs = await Promise.all(
      seeds.map((s) =>
        recommendationRepository.upsertByKey(userId, s.key, {
          title: s.title,
          reason: s.reason,
          priority: s.priority,
          source: s.source,
          action: s.actionKind ? actionGenerator.byKind(context, s.actionKind) : null,
          intent: null,
          coachId: null,
        }),
      ),
    );
    return docs.filter((d): d is RecommendationDocument => Boolean(d)).map(toDTO);
  },

  /** List a user's recommendations (defaults to hiding dismissed + archived). */
  async list(userId: string, filter: RecommendationFilter = {}): Promise<RecommendationDTO[]> {
    const f: RecommendationFilter = filter.status
      ? filter
      : { ...filter, notStatuses: filter.notStatuses ?? ['dismissed', 'archived'] };
    const docs = await recommendationRepository.list(userId, f);
    return docs.map(toDTO);
  },

  /** Transition a recommendation's lifecycle status (stamping the timestamp). */
  async update(userId: string, id: string, status: RecommendationStatus): Promise<RecommendationDTO> {
    const existing = await recommendationRepository.findById(userId, id);
    if (!existing) throw ApiError.notFound('Recommendation not found');

    const patch: Record<string, unknown> = { status };
    const tsField = STATUS_TIMESTAMP[status];
    if (tsField && !existing.get(tsField)) patch[tsField] = new Date();

    const doc = await recommendationRepository.update(userId, id, patch);
    return toDTO(doc!);
  },

  /** Effectiveness roll-up across the lifecycle. */
  async stats(userId: string): Promise<RecommendationStatsDTO> {
    const c = await recommendationRepository.statusCounts(userId);
    const total = c.generated + c.viewed + c.accepted + c.dismissed + c.completed + c.archived;
    const active = c.generated + c.viewed + c.accepted;
    const decided = c.accepted + c.completed + c.dismissed;
    return {
      total,
      active,
      accepted: c.accepted,
      completed: c.completed,
      dismissed: c.dismissed,
      acceptanceRate: decided ? Math.round(((c.accepted + c.completed) / decided) * 100) : 0,
      completionRate: c.accepted + c.completed ? Math.round((c.completed / (c.accepted + c.completed)) * 100) : 0,
    };
  },

  toDTO,
};

/** Build the rule-based recommendation seeds from context section data. */
function buildSeeds(context: AIContext): RecoSeed[] {
  const seeds: RecoSeed[] = [];

  const plan = sectionData<{ title: string; message: string; actionTo: string }>(context, 'learning-plan');
  if (plan?.actionTo) seeds.push({ key: 'continue-learning', title: plan.title, reason: plan.message, priority: 'high', source: 'analytics', actionKind: 'continue-study' });

  const rev = sectionData<{ dueTodayCount: number; overdueCount: number }>(context, 'revision');
  if (rev && rev.overdueCount > 0) seeds.push({ key: 'revision-overdue', title: `Clear ${rev.overdueCount} overdue reviews`, reason: 'Overdue items decay fastest — clear them first.', priority: 'high', source: 'system', actionKind: 'open-revision' });
  else if (rev && rev.dueTodayCount > 0) seeds.push({ key: 'revision-due', title: `Complete ${rev.dueTodayCount} reviews due today`, reason: 'Stay consistent to protect retention.', priority: 'medium', source: 'system', actionKind: 'open-revision' });

  const weak = sectionData<{ items: { title: string; entityId: string | null; hint: string }[] }>(context, 'weak-patterns');
  for (const w of weak?.items.slice(0, 2) ?? []) {
    seeds.push({ key: `weak-${w.entityId ?? w.title}`, title: `Strengthen ${w.title}`, reason: w.hint || 'This is one of your weakest areas.', priority: 'medium', source: 'analytics', actionKind: 'practice-pattern' });
  }

  const contest = sectionData<{ pendingUpsolve: number }>(context, 'contest');
  if (contest && contest.pendingUpsolve > 0) seeds.push({ key: 'upsolve', title: `Upsolve ${contest.pendingUpsolve} problems`, reason: 'Upsolve while the contest ideas are still fresh.', priority: 'medium', source: 'system', actionKind: 'open-upsolve' });

  const health = sectionData<{ topicsAtRisk: number }>(context, 'analytics-health');
  if (health && health.topicsAtRisk > 0) seeds.push({ key: 'at-risk', title: `Review ${health.topicsAtRisk} at-risk topics`, reason: 'Reinforce these before their mastery slips further.', priority: 'medium', source: 'analytics', actionKind: 'practice-pattern' });

  return seeds;
}
