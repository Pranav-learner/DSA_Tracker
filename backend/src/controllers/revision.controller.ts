import type { Request, Response } from 'express';
import { revisionScheduleService } from '../services/revisionSchedule.service.js';
import { revisionQueueService } from '../services/revisionQueue.service.js';
import {
  parseCreateSchedule,
  parseUpdateSchedule,
  parseScheduleQuery,
  parseCalendarQuery,
} from '../validators/revision.validator.js';
import { assertObjectId } from '../validators/objectId.validator.js';
import { currentUserId } from '../utils/currentUser.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ok } from '../utils/ApiResponse.js';

/** POST /api/revision/schedules — create a schedule (409 on duplicate entity). */
export const createSchedule = asyncHandler(async (req: Request, res: Response) => {
  const { allowDuplicate, ...input } = parseCreateSchedule(req.body);
  const schedule = await revisionScheduleService.create(currentUserId(req), input, allowDuplicate ?? false);
  res.status(201).json(ok(schedule));
});

/** GET /api/revision/schedules — paginated, filterable schedules. */
export const listSchedules = asyncHandler(async (req: Request, res: Response) => {
  const query = parseScheduleQuery(req.query);
  const page = await revisionScheduleService.list(currentUserId(req), query);
  res.status(200).json(ok(page));
});

/** GET /api/revision/schedules/:id — a single schedule. */
export const getSchedule = asyncHandler(async (req: Request, res: Response) => {
  const id = assertObjectId(req.params.id, 'schedule id');
  const schedule = await revisionScheduleService.getById(currentUserId(req), id);
  res.status(200).json(ok(schedule));
});

/** PATCH /api/revision/schedules/:id — update a schedule. */
export const updateSchedule = asyncHandler(async (req: Request, res: Response) => {
  const id = assertObjectId(req.params.id, 'schedule id');
  const body = parseUpdateSchedule(req.body);
  const schedule = await revisionScheduleService.update(currentUserId(req), id, body);
  res.status(200).json(ok(schedule));
});

/** DELETE /api/revision/schedules/:id — remove a schedule. */
export const deleteSchedule = asyncHandler(async (req: Request, res: Response) => {
  const id = assertObjectId(req.params.id, 'schedule id');
  await revisionScheduleService.remove(currentUserId(req), id);
  res.status(200).json(ok({ id, deleted: true }));
});

/** GET /api/revision/today — the daily queue (overdue / due / upcoming + summary). */
export const getToday = asyncHandler(async (req: Request, res: Response) => {
  const queue = await revisionQueueService.getToday(currentUserId(req));
  res.status(200).json(ok(queue));
});

/** GET /api/revision/calendar — revision events grouped by date (defaults to this month). */
export const getCalendar = asyncHandler(async (req: Request, res: Response) => {
  const { from, to } = parseCalendarQuery(req.query);
  const now = new Date();
  const fromDate = from ? new Date(from) : new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const toDate = to
    ? new Date(to)
    : new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59));
  const calendar = await revisionQueueService.getCalendar(currentUserId(req), fromDate, toDate);
  res.status(200).json(ok(calendar));
});
