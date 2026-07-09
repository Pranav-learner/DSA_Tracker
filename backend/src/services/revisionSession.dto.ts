import type { RevisionEntityType, RevisionSessionStatus } from '../types/domain.js';
import type { PhaseRefDTO } from './mappers.js';
import type { TopicRefDTO } from './problem.dto.js';
import type { NotebookAlternativeDTO, RelatedProblemRefDTO } from './notebook.dto.js';
import type { RevisionScheduleDTO } from './revision.dto.js';

/* Module 3 · Sprint 2 — Revision Session + Workspace response DTOs. */

export interface RevisionSessionDTO {
  id: string;
  userId: string;
  revisionScheduleId: string | null;
  entityType: RevisionEntityType;
  entityId: string;
  title: string;
  sessionStatus: RevisionSessionStatus;
  startedAt: string;
  completedAt: string | null;
  durationMinutes: number;
  reviewedKnowledgeEntries: string[];
  reviewedProblems: string[];
  reviewNotes: string;
  selfConfidenceBefore: number | null;
  selfConfidenceAfter: number | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * The knowledge content the workspace displays — a pure COMPOSITION from Module 2
 * (topic concept + notebook + problem library). Nothing here is stored on the
 * session; it is resolved live so there's no duplicate knowledge storage.
 */
export interface RevisionContentDTO {
  entityType: RevisionEntityType;
  entityId: string;
  title: string;
  pattern: string;
  topic: TopicRefDTO | null;
  phase: PhaseRefDTO | null;
  recognitionKeywords: string[];
  coreIdea: string;
  coreAlgorithm: string;
  whenToUse: string;
  whenNotToUse: string;
  timeComplexity: string;
  spaceComplexity: string;
  commonMistakes: string[];
  contestTraps: string[];
  alternativeSolutions: NotebookAlternativeDTO[];
  representativeProblems: RelatedProblemRefDTO[];
  relatedProblems: RelatedProblemRefDTO[];
  knowledgeNotes: string;
  confidence: number | null;
  estimatedReviewMinutes: number;
  hasNotebook: boolean;
  notebookId: string | null;
}

/** GET /api/revision/workspace — content + the current session + owning schedule. */
export interface RevisionWorkspaceDTO {
  content: RevisionContentDTO;
  activeSession: RevisionSessionDTO | null;
  schedule: RevisionScheduleDTO | null;
}

/** Compact revision-session block for the Module 1 dashboard. */
export interface DashboardRevisionSessionDTO {
  activeSession: RevisionSessionDTO | null;
  completedToday: number;
  recentSessions: RevisionSessionDTO[];
}

export const SESSION_HISTORY_SORTS = ['recent', 'oldest', 'duration'] as const;
export type SessionHistorySort = (typeof SESSION_HISTORY_SORTS)[number];

export interface SessionHistoryQuery {
  page: number;
  pageSize: number;
  entityType?: RevisionEntityType;
  status?: RevisionSessionStatus;
  from?: string;
  to?: string;
  sort: SessionHistorySort;
}
