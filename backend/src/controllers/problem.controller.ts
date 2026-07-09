import type { Request, Response } from 'express';
import { problemService } from '../services/problem.service.js';
import { parseProblemQuery } from '../validators/problemQuery.validator.js';
import { assertObjectId } from '../validators/objectId.validator.js';
import { currentUserId } from '../utils/currentUser.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ok } from '../utils/ApiResponse.js';

/**
 * GET /api/problems — paginated, filterable, sortable library listing.
 * The whole paginated envelope (items + page metadata) is returned as `data`
 * so a single unwrap on the client yields everything the table/pagination need.
 */
export const getProblems = asyncHandler(async (req: Request, res: Response) => {
  const query = parseProblemQuery(req.query);
  const page = await problemService.list(currentUserId(req), query);
  res.status(200).json(ok(page));
});

/** GET /api/problems/search — same contract as list, geared around the `q` term. */
export const searchProblems = getProblems;

/** GET /api/problems/facets — available filter values for the FilterPanel. */
export const getProblemFacets = asyncHandler(async (_req: Request, res: Response) => {
  const facets = await problemService.facets();
  res.status(200).json(ok(facets));
});

/** GET /api/problems/:id — full problem detail with topic/phase refs. */
export const getProblem = asyncHandler(async (req: Request, res: Response) => {
  const id = assertObjectId(req.params.id, 'problem id');
  const problem = await problemService.getById(currentUserId(req), id);
  res.status(200).json(ok(problem));
});
