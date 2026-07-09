import type { Request, Response } from 'express';
import { postmortemService } from '../services/postmortem.service.js';
import { upsolveService } from '../services/upsolve.service.js';
import { contestLearningService } from '../services/contestLearning.service.js';
import {
  parseUpsertPostmortem,
  parseCreateUpsolve,
  parseUpdateUpsolve,
  parseUpsolveQuery,
} from '../validators/contestLearning.validator.js';
import { assertObjectId } from '../../validators/objectId.validator.js';
import { currentUserId } from '../../utils/currentUser.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ok } from '../../utils/ApiResponse.js';

/* ------------------------------ postmortem ------------------------------ */

/** GET /api/contests/:id/postmortem — the contest reflection/analysis (or null). */
export const getPostmortem = asyncHandler(async (req: Request, res: Response) => {
  const id = assertObjectId(req.params.id, 'contest id');
  const pm = await postmortemService.getByContest(currentUserId(req), id);
  res.status(200).json(ok(pm));
});

/** POST/PATCH /api/contests/:id/postmortem — create-or-update the postmortem. */
export const upsertPostmortem = asyncHandler(async (req: Request, res: Response) => {
  const id = assertObjectId(req.params.id, 'contest id');
  const body = parseUpsertPostmortem(req.body);
  const pm = await postmortemService.upsert(currentUserId(req), id, body);
  res.status(200).json(ok(pm));
});

/* -------------------------- contest learning --------------------------- */

/** GET /api/contests/:id/learning — the full contest learning workspace. */
export const getContestLearning = asyncHandler(async (req: Request, res: Response) => {
  const id = assertObjectId(req.params.id, 'contest id');
  const learning = await contestLearningService.getLearning(currentUserId(req), id);
  res.status(200).json(ok(learning));
});

/** POST /api/contests/:id/upsolve — generate/queue upsolve tasks for the contest. */
export const createUpsolve = asyncHandler(async (req: Request, res: Response) => {
  const id = assertObjectId(req.params.id, 'contest id');
  const userId = currentUserId(req);
  // With a body → add one task; without → auto-generate for all unsolved.
  if (req.body && typeof req.body === 'object' && 'contestProblemRef' in req.body) {
    const task = await upsolveService.createForProblem(userId, id, parseCreateUpsolve(req.body));
    res.status(201).json(ok(task));
    return;
  }
  const tasks = await contestLearningService.generateUpsolveTasks(userId, id);
  res.status(201).json(ok(tasks, { count: tasks.length }));
});

/* ------------------------------- upsolve -------------------------------- */

/** GET /api/upsolve — all upsolve tasks (filterable). */
export const listUpsolve = asyncHandler(async (req: Request, res: Response) => {
  const query = parseUpsolveQuery(req.query);
  const tasks = await upsolveService.list(currentUserId(req), query);
  res.status(200).json(ok(tasks, { count: tasks.length }));
});

/** GET /api/upsolve/queue — grouped queue + counts. */
export const getUpsolveQueue = asyncHandler(async (req: Request, res: Response) => {
  const queue = await upsolveService.queue(currentUserId(req));
  res.status(200).json(ok(queue));
});

/** GET /api/upsolve/:id — one upsolve task. */
export const getUpsolve = asyncHandler(async (req: Request, res: Response) => {
  const id = assertObjectId(req.params.id, 'upsolve id');
  const task = await upsolveService.getById(currentUserId(req), id);
  res.status(200).json(ok(task));
});

/** PATCH /api/upsolve/:id — update / complete (syncs Learning Engine). */
export const updateUpsolve = asyncHandler(async (req: Request, res: Response) => {
  const id = assertObjectId(req.params.id, 'upsolve id');
  const body = parseUpdateUpsolve(req.body);
  const task = await upsolveService.update(currentUserId(req), id, body);
  res.status(200).json(ok(task));
});
