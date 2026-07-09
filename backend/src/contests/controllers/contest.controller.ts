import type { Request, Response } from 'express';
import { contestService } from '../services/contest.service.js';
import { parseCreateContest, parseUpdateContest, parseContestQuery } from '../validators/contest.validator.js';
import { assertObjectId } from '../../validators/objectId.validator.js';
import { currentUserId } from '../../utils/currentUser.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ok } from '../../utils/ApiResponse.js';

/** POST /api/contests — add a contest (auto rating sync + activity). */
export const createContest = asyncHandler(async (req: Request, res: Response) => {
  const body = parseCreateContest(req.body);
  const contest = await contestService.create(currentUserId(req), body);
  res.status(201).json(ok(contest));
});

/** GET /api/contests — paginated, filterable, sortable contest library. */
export const listContests = asyncHandler(async (req: Request, res: Response) => {
  const query = parseContestQuery(req.query);
  const page = await contestService.list(currentUserId(req), query);
  res.status(200).json(ok(page));
});

/** GET /api/contests/stats — aggregate contest statistics. */
export const getContestStats = asyncHandler(async (req: Request, res: Response) => {
  const stats = await contestService.stats(currentUserId(req));
  res.status(200).json(ok(stats));
});

/** GET /api/contests/facets — data-driven filter values. */
export const getContestFacets = asyncHandler(async (req: Request, res: Response) => {
  const facets = await contestService.facets(currentUserId(req));
  res.status(200).json(ok(facets));
});

/** GET /api/contests/:id — one contest. */
export const getContest = asyncHandler(async (req: Request, res: Response) => {
  const id = assertObjectId(req.params.id, 'contest id');
  const contest = await contestService.getById(currentUserId(req), id);
  res.status(200).json(ok(contest));
});

/** PATCH /api/contests/:id — update a contest (re-syncs rating). */
export const updateContest = asyncHandler(async (req: Request, res: Response) => {
  const id = assertObjectId(req.params.id, 'contest id');
  const body = parseUpdateContest(req.body);
  const contest = await contestService.update(currentUserId(req), id, body);
  res.status(200).json(ok(contest));
});

/** DELETE /api/contests/:id — remove a contest + its rating point. */
export const deleteContest = asyncHandler(async (req: Request, res: Response) => {
  const id = assertObjectId(req.params.id, 'contest id');
  await contestService.remove(currentUserId(req), id);
  res.status(200).json(ok({ id, deleted: true }));
});
