import { REVISION_ESTIMATED_MINUTES } from '../config/revision.js';
import type { RevisionEntityType, RevisionStatus, RevisionUrgency } from '../types/domain.js';
import type { RevisionScheduleDocument } from '../models/RevisionSchedule.js';
import type { RevisionScheduleDTO } from './revision.dto.js';

const DAY_MS = 24 * 60 * 60 * 1000;

/** UTC calendar-day key (YYYY-MM-DD) — deterministic, timezone-stable. */
export function dayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Midnight (UTC) of a date, as epoch ms. */
export function startOfDay(date: Date): number {
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY_MS);
}

/** Whole days from `now` to `target` (negative = in the past / overdue). */
export function daysUntil(target: Date, now: Date): number {
  return Math.round((startOfDay(target) - startOfDay(now)) / DAY_MS);
}

/** Derived queue urgency of an active schedule vs. today. */
export function urgencyOf(nextReviewDate: Date, now: Date): RevisionUrgency {
  const diff = daysUntil(nextReviewDate, now);
  if (diff < 0) return 'overdue';
  if (diff === 0) return 'due';
  return 'upcoming';
}

/**
 * Effective status: stored Completed/Archived pass through; an active (Pending)
 * schedule becomes Due / Overdue / Pending based on its next review date.
 */
export function effectiveStatus(doc: RevisionScheduleDocument, now: Date): RevisionStatus {
  if (doc.status === 'Completed' || doc.status === 'Archived') return doc.status;
  const urgency = urgencyOf(doc.nextReviewDate, now);
  if (urgency === 'overdue') return 'Overdue';
  if (urgency === 'due') return 'Due';
  return 'Pending';
}

export function estimatedMinutesFor(entityType: RevisionEntityType): number {
  return REVISION_ESTIMATED_MINUTES[entityType] ?? 10;
}

export function toRevisionScheduleDTO(doc: RevisionScheduleDocument, now: Date): RevisionScheduleDTO {
  return {
    id: String(doc._id),
    userId: doc.userId,
    entityType: doc.entityType,
    entityId: doc.entityId,
    title: doc.title,
    currentInterval: doc.currentInterval,
    nextReviewDate: doc.nextReviewDate.toISOString(),
    lastReviewDate: doc.lastReviewDate ? doc.lastReviewDate.toISOString() : null,
    reviewCount: doc.reviewCount,
    easeFactor: doc.easeFactor,
    priority: doc.priority,
    strategy: doc.strategy,
    status: effectiveStatus(doc, now),
    urgency: urgencyOf(doc.nextReviewDate, now),
    daysUntilReview: daysUntil(doc.nextReviewDate, now),
    estimatedMinutes: estimatedMinutesFor(doc.entityType),
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}
