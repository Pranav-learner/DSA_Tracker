import type { AiIntent } from '../types/ai.types.js';

/**
 * AI Operating System types (Module 7 · Sprint 4).
 *
 * The AI OS is a coordination layer: it RECOMMENDS actions and structures
 * workflows over the existing modules — it never owns or mutates learning data.
 * Every action is a deep link the learner chooses to follow. These DTOs are the
 * typed contract for workflows, recommendations, briefs and the mentor timeline.
 */

/** A deep-link action into a CP-OS module (the learner clicks to execute). */
export interface MentorAction {
  id: string;
  label: string;
  /** Semantic kind (drives the UI icon), e.g. 'open-topic', 'start-revision'. */
  kind: string;
  /** In-app route to navigate to (empty when `intent` switches coach instead). */
  to: string;
  /** When set, the action opens the matching coach rather than navigating. */
  intent?: AiIntent;
  /** The CP-OS module this action targets (for grouping/telemetry). */
  module?: string;
  primary?: boolean;
}

/* ------------------------------------------------------------------ *
 *  Workflows — a sequence of SUGGESTED steps (never autonomous).
 * ------------------------------------------------------------------ */

export const WORKFLOW_KEYS = [
  'study-session',
  'revision-session',
  'contest-prep',
  'contest-review',
  'interview-prep',
  'phase-completion',
] as const;
export type WorkflowKey = (typeof WORKFLOW_KEYS)[number];

export type WorkflowDifficulty = 'light' | 'moderate' | 'intense';

export interface WorkflowStepDTO {
  id: string;
  order: number;
  title: string;
  description: string;
  /** CP-OS module the step touches (learning, revision, contest, …). */
  module: string;
  /** The deep-link action the learner takes for this step (may be null). */
  action: MentorAction | null;
  /** Coach that can guide this step (opens in coach mode). */
  coachIntent: AiIntent | null;
  estimatedMinutes: number;
  optional: boolean;
}

export interface WorkflowDTO {
  id: string;
  key: WorkflowKey;
  name: string;
  description: string;
  category: string;
  difficulty: WorkflowDifficulty;
  estimatedMinutes: number;
  /** Modules involved (deduped, in step order). */
  modules: string[];
  steps: WorkflowStepDTO[];
  expectedOutcome: string;
  generatedAt: string;
  /** Persisted workflow status (null for a freshly-generated, unsaved preview). */
  status: WorkflowStatus | null;
}

export type WorkflowStatus = 'generated' | 'started' | 'completed' | 'dismissed';

/* ------------------------------------------------------------------ *
 *  Recommendations — tracked lifecycle (AI's own data, not learning data).
 * ------------------------------------------------------------------ */

export const RECOMMENDATION_STATUSES = ['generated', 'viewed', 'accepted', 'dismissed', 'completed', 'archived'] as const;
export type RecommendationStatus = (typeof RECOMMENDATION_STATUSES)[number];

export type RecommendationPriority = 'high' | 'medium' | 'low';
export type RecommendationSource = 'coach' | 'workflow' | 'brief' | 'analytics' | 'system';

export interface RecommendationDTO {
  id: string;
  /** Stable per-user key — lets regeneration update in place (no duplicates). */
  key: string;
  title: string;
  reason: string;
  priority: RecommendationPriority;
  source: RecommendationSource;
  action: MentorAction | null;
  status: RecommendationStatus;
  intent: AiIntent | null;
  coachId: string | null;
  createdAt: string;
  updatedAt: string;
  viewedAt: string | null;
  acceptedAt: string | null;
  dismissedAt: string | null;
  completedAt: string | null;
  archivedAt: string | null;
}

/** Effectiveness roll-up over the recommendation lifecycle. */
export interface RecommendationStatsDTO {
  total: number;
  active: number;
  accepted: number;
  completed: number;
  dismissed: number;
  /** completed / (accepted + completed + dismissed), 0–100. */
  acceptanceRate: number;
  completionRate: number;
}

/* ------------------------------------------------------------------ *
 *  Mentor briefs — on-demand digests (never scheduled/pushed).
 * ------------------------------------------------------------------ */

export const BRIEF_KINDS = ['daily', 'weekly', 'contest', 'revision', 'learning-health', 'phase-completion'] as const;
export type BriefKind = (typeof BRIEF_KINDS)[number];

export interface BriefSection {
  title: string;
  body: string;
}

export interface MentorBriefDTO {
  kind: BriefKind;
  title: string;
  periodLabel: string;
  generatedAt: string;
  headline: string;
  todaysFocus: string;
  highestPriorityTask: string | null;
  revisionDue: number;
  contestReadiness: number | null;
  learningHealth: { score: number; status: string } | null;
  estimatedStudyMinutes: number;
  suggestedWorkflow: { key: WorkflowKey; name: string } | null;
  quickStart: MentorAction[];
  sections: BriefSection[];
  recommendations: RecommendationDTO[];
}

/* ------------------------------------------------------------------ *
 *  Mentor timeline — searchable coaching history (aggregated, reused).
 * ------------------------------------------------------------------ */

export type TimelineEntryType = 'recommendation' | 'coaching-session' | 'workflow' | 'milestone';

export interface TimelineEntryDTO {
  id: string;
  type: TimelineEntryType;
  title: string;
  description: string;
  at: string;
  icon: string;
  /** Optional deep link to open the underlying artefact. */
  to: string | null;
  status: string | null;
}

/** The AI OS overview payload — one call powers the AI OS dashboard header. */
export interface MentorOverviewDTO {
  brief: MentorBriefDTO;
  workflows: WorkflowDTO[];
  recommendations: RecommendationDTO[];
  stats: RecommendationStatsDTO;
  actions: MentorAction[];
}
