import type { Request, Response } from 'express';
import { contestWorkspaceService } from '../services/contestWorkspace.service.js';
import {
  parseCreateProblem,
  parseUpdateProblem,
  parseCreateTimelineEvent,
} from '../validators/contestWorkspace.validator.js';
import { assertObjectId } from '../../validators/objectId.validator.js';
import { currentUserId } from '../../utils/currentUser.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ok } from '../../utils/ApiResponse.js';

/** GET /api/contests/:id/workspace — the complete contest workspace. */
export const getWorkspace = asyncHandler(async (req: Request, res: Response) => {
  const id = assertObjectId(req.params.id, 'contest id');
  const workspace = await contestWorkspaceService.getWorkspace(currentUserId(req), id);
  res.status(200).json(ok(workspace));
});

/** GET /api/contests/:id/problems — the contest's problems. */
export const listProblems = asyncHandler(async (req: Request, res: Response) => {
  const id = assertObjectId(req.params.id, 'contest id');
  const problems = await contestWorkspaceService.getProblems(currentUserId(req), id);
  res.status(200).json(ok(problems, { count: problems.length }));
});

/** POST /api/contests/:id/problems — add a problem to the contest. */
export const addProblem = asyncHandler(async (req: Request, res: Response) => {
  const id = assertObjectId(req.params.id, 'contest id');
  const body = parseCreateProblem(req.body);
  const problem = await contestWorkspaceService.addProblem(currentUserId(req), id, body);
  res.status(201).json(ok(problem));
});

/** PATCH /api/contests/problems/:problemId — update a contest problem. */
export const updateProblem = asyncHandler(async (req: Request, res: Response) => {
  const problemId = assertObjectId(req.params.problemId, 'problem id');
  const body = parseUpdateProblem(req.body);
  const problem = await contestWorkspaceService.updateProblem(currentUserId(req), problemId, body);
  res.status(200).json(ok(problem));
});

/** DELETE /api/contests/problems/:problemId — remove a contest problem. */
export const deleteProblem = asyncHandler(async (req: Request, res: Response) => {
  const problemId = assertObjectId(req.params.problemId, 'problem id');
  await contestWorkspaceService.removeProblem(currentUserId(req), problemId);
  res.status(200).json(ok({ id: problemId, deleted: true }));
});

/** GET /api/contests/:id/timeline — the chronological event stream. */
export const getTimeline = asyncHandler(async (req: Request, res: Response) => {
  const id = assertObjectId(req.params.id, 'contest id');
  const timeline = await contestWorkspaceService.getTimeline(currentUserId(req), id);
  res.status(200).json(ok(timeline, { count: timeline.length }));
});

/** POST /api/contests/:id/timeline — append a timeline event. */
export const addTimelineEvent = asyncHandler(async (req: Request, res: Response) => {
  const id = assertObjectId(req.params.id, 'contest id');
  const body = parseCreateTimelineEvent(req.body);
  const event = await contestWorkspaceService.addTimelineEvent(currentUserId(req), id, body);
  res.status(201).json(ok(event));
});

/** GET /api/contests/:id/performance — the aggregated performance record. */
export const getPerformance = asyncHandler(async (req: Request, res: Response) => {
  const id = assertObjectId(req.params.id, 'contest id');
  const performance = await contestWorkspaceService.getPerformance(currentUserId(req), id);
  res.status(200).json(ok(performance));
});
