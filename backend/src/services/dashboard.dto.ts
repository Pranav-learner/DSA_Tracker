import type { LadderStage } from '../types/domain.js';
import type { PhaseRefDTO, TopicSummaryDTO } from './mappers.js';
import type {
  OverallProgressDTO,
  PhaseProgressDTO,
  RecommendationDTO,
} from './learning.dto.js';
import type { ActivityDTO } from './activity.service.js';
import type { DashboardRevisionQueueDTO } from './revision.dto.js';
import type { DashboardRevisionSessionDTO } from './revisionSession.dto.js';
import type { DashboardRetentionDTO } from './retention.dto.js';

/** Combined revision widget: the scheduling queue + the active-session block. */
export type DashboardRevisionDTO = DashboardRevisionQueueDTO & DashboardRevisionSessionDTO;

/* Sprint 4 — Dashboard aggregation response DTOs.
 *
 * These are pure COMPOSITION types: every field is sourced from an existing
 * Sprint 1–3 DTO. Nothing new is computed here beyond dashboard-only framing
 * (roadmap phase state, per-phase time remaining). */

/** A phase reduced to the four dashboard states + its progress figures. */
export type RoadmapPhaseState = 'completed' | 'current' | 'unlocked' | 'locked';

export interface RoadmapSummaryPhaseDTO {
  phaseId: string;
  title: string;
  slug: string;
  order: number;
  color: string;
  icon: string;
  state: RoadmapPhaseState;
  completionPercent: number;
  topicsCompleted: number;
  topicsTotal: number;
  mastery: number;
}

/** Current phase progress + the extra framing the Phase Progress card needs. */
export interface DashboardPhaseProgressDTO extends PhaseProgressDTO {
  phase: PhaseRefDTO;
  estimatedTotalHours: number;
  estimatedTimeRemainingHours: number;
}

/**
 * The single payload behind GET /api/dashboard — everything the learner's home
 * screen renders, aggregated so the client makes one request.
 */
export interface DashboardDTO {
  userId: string;
  /** "Where am I" — mirrors LearningStateDTO so the hero can reuse it. */
  currentPhase: PhaseRefDTO | null;
  currentTopic: TopicSummaryDTO | null;
  currentStage: LadderStage | null;
  currentMastery: number;
  overall: OverallProgressDTO;
  /** Next-best-action + the topic it points at (for Today's Learning card). */
  recommendation: RecommendationDTO;
  recommendedTopic: TopicSummaryDTO | null;
  /** Progress of the phase the learner is currently in. */
  currentPhaseProgress: DashboardPhaseProgressDTO | null;
  /** Compact all-phases roadmap widget. */
  roadmap: RoadmapSummaryPhaseDTO[];
  /** Recent learning events, newest first. */
  recentActivity: ActivityDTO[];
  /** Module 3: revision widget (due today / overdue / preview). */
  revision: DashboardRevisionDTO;
  /** Module 3 · Sprint 3: retention & confidence health widget. */
  retention: DashboardRetentionDTO;
}
