import type {
  RevisionEntityType,
  RevisionStatus,
  RevisionUrgency,
} from '../types/domain.js';

/* Module 3 · Sprint 1 — Revision Engine response DTOs. */

/** A revision schedule with derived, read-time fields (status/urgency/estimates). */
export interface RevisionScheduleDTO {
  id: string;
  userId: string;
  entityType: RevisionEntityType;
  entityId: string;
  title: string;
  currentInterval: number;
  nextReviewDate: string;
  lastReviewDate: string | null;
  reviewCount: number;
  easeFactor: number;
  priority: number;
  strategy: string;
  /** Effective status (Due/Overdue derived from the date; Completed/Archived stored). */
  status: RevisionStatus;
  /** Queue urgency derived from the next review date vs today. */
  urgency: RevisionUrgency;
  /** Days until the next review (negative = overdue). */
  daysUntilReview: number;
  estimatedMinutes: number;
  createdAt: string;
  updatedAt: string;
}

/** Counts + workload for the daily queue / dashboard widget. */
export interface RevisionQueueSummaryDTO {
  dueTodayCount: number;
  overdueCount: number;
  upcomingCount: number;
  totalScheduled: number;
  /** Estimated minutes for today's workload (overdue + due). */
  estimatedReviewMinutes: number;
}

/** GET /api/revision/today — the daily queue, bucketed + sorted. */
export interface RevisionQueueDTO {
  overdue: RevisionScheduleDTO[];
  dueToday: RevisionScheduleDTO[];
  upcoming: RevisionScheduleDTO[];
  summary: RevisionQueueSummaryDTO;
}

/** A light schedule ref used inside calendar days. */
export interface RevisionCalendarItemDTO {
  id: string;
  title: string;
  entityType: RevisionEntityType;
  urgency: RevisionUrgency;
  priority: number;
}

export interface RevisionCalendarDayDTO {
  date: string; // YYYY-MM-DD
  overdue: number;
  due: number;
  upcoming: number;
  total: number;
  items: RevisionCalendarItemDTO[];
}

/** GET /api/revision/calendar — revision events grouped by date. */
export interface RevisionCalendarDTO {
  from: string;
  to: string;
  days: RevisionCalendarDayDTO[];
}

/** Compact revision QUEUE summary embedded in the Module 1 dashboard. */
export interface DashboardRevisionQueueDTO {
  dueTodayCount: number;
  overdueCount: number;
  upcomingCount: number;
  totalScheduled: number;
  estimatedReviewMinutes: number;
  /** Top few items to revise now (overdue first, then due). */
  preview: RevisionScheduleDTO[];
}

export const REVISION_SORT_FIELDS = ['nextReviewDate', 'priority', 'createdAt', 'title'] as const;
export type RevisionSortField = (typeof REVISION_SORT_FIELDS)[number];

/** Normalised query for GET /api/revision/schedules. */
export interface RevisionQuery {
  page: number;
  pageSize: number;
  status?: RevisionStatus;
  entityType?: RevisionEntityType;
  from?: string;
  to?: string;
  sort: RevisionSortField;
  order: 'asc' | 'desc';
}
