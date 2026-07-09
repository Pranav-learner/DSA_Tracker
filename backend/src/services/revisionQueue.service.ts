import { revisionScheduleRepository } from '../repositories/revisionSchedule.repository.js';
import { UPCOMING_WINDOW_DAYS } from '../config/revision.js';
import { dayKey, urgencyOf, toRevisionScheduleDTO } from './revision.util.js';
import type { RevisionScheduleDocument } from '../models/RevisionSchedule.js';
import type {
  DashboardRevisionDTO,
  RevisionCalendarDTO,
  RevisionCalendarDayDTO,
  RevisionQueueDTO,
  RevisionScheduleDTO,
} from './revision.dto.js';

const DASHBOARD_PREVIEW_LIMIT = 4;

/** Queue ordering: most important first (priority desc), then soonest date. */
function sortQueue(items: RevisionScheduleDTO[]): RevisionScheduleDTO[] {
  return [...items].sort((a, b) => b.priority - a.priority || a.daysUntilReview - b.daysUntilReview);
}

/**
 * RevisionQueueService — turns the raw active schedules into the learner's daily
 * queue (overdue → due → upcoming), the monthly calendar, and the compact
 * dashboard summary. It composes the repository + shared util (no duplicated
 * date/status logic).
 */
export const revisionQueueService = {
  async getToday(userId: string): Promise<RevisionQueueDTO> {
    const { overdue, dueToday, upcoming, total } = await buildBuckets(userId);
    const estimatedReviewMinutes = [...overdue, ...dueToday].reduce((s, d) => s + d.estimatedMinutes, 0);
    return {
      overdue,
      dueToday,
      upcoming,
      summary: {
        dueTodayCount: dueToday.length,
        overdueCount: overdue.length,
        upcomingCount: upcoming.length,
        totalScheduled: total,
        estimatedReviewMinutes,
      },
    };
  },

  /** Compact summary + preview for the Module 1 dashboard widget (one query). */
  async getDashboardSummary(userId: string): Promise<DashboardRevisionDTO> {
    const { overdue, dueToday, upcoming, total } = await buildBuckets(userId);
    return {
      dueTodayCount: dueToday.length,
      overdueCount: overdue.length,
      upcomingCount: upcoming.length,
      totalScheduled: total,
      estimatedReviewMinutes: [...overdue, ...dueToday].reduce((s, d) => s + d.estimatedMinutes, 0),
      preview: [...overdue, ...dueToday].slice(0, DASHBOARD_PREVIEW_LIMIT),
    };
  },

  async getCalendar(userId: string, from: Date, to: Date): Promise<RevisionCalendarDTO> {
    const now = new Date();
    const docs = await revisionScheduleRepository.findByDateRange(userId, from, to);

    const byDay = new Map<string, RevisionCalendarDayDTO>();
    for (const doc of docs) {
      const key = dayKey(doc.nextReviewDate);
      const urgency = urgencyOf(doc.nextReviewDate, now);
      const day =
        byDay.get(key) ??
        ({ date: key, overdue: 0, due: 0, upcoming: 0, total: 0, items: [] } as RevisionCalendarDayDTO);
      day.total += 1;
      day[urgency] += 1;
      day.items.push({
        id: String(doc._id),
        title: doc.title,
        entityType: doc.entityType,
        urgency,
        priority: doc.priority,
      });
      byDay.set(key, day);
    }

    return {
      from: dayKey(from),
      to: dayKey(to),
      days: [...byDay.values()].sort((a, b) => a.date.localeCompare(b.date)),
    };
  },
};

/** Shared bucketing from a user's active schedules (one repository read). */
async function buildBuckets(userId: string): Promise<{
  overdue: RevisionScheduleDTO[];
  dueToday: RevisionScheduleDTO[];
  upcoming: RevisionScheduleDTO[];
  total: number;
}> {
  const now = new Date();
  const active: RevisionScheduleDocument[] = await revisionScheduleRepository.findActive(userId);
  const dtos = active.map((d) => toRevisionScheduleDTO(d, now));
  return {
    overdue: sortQueue(dtos.filter((d) => d.urgency === 'overdue')),
    dueToday: sortQueue(dtos.filter((d) => d.urgency === 'due')),
    upcoming: sortQueue(dtos.filter((d) => d.urgency === 'upcoming' && d.daysUntilReview <= UPCOMING_WINDOW_DAYS)),
    total: active.length,
  };
}
