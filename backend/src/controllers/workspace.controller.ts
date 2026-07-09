import type { Request, Response } from 'express';
import { workspaceService } from '../services/workspace.service.js';
import { learningIntegrationService } from '../services/learningIntegration.service.js';
import { parseCompleteProblem } from '../validators/problemComplete.validator.js';
import { assertObjectId } from '../validators/objectId.validator.js';
import { currentUserId } from '../utils/currentUser.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ok } from '../utils/ApiResponse.js';

/** GET /api/problems/:id/workspace — the aggregated problem workspace. */
export const getWorkspace = asyncHandler(async (req: Request, res: Response) => {
  const id = assertObjectId(req.params.id, 'problem id');
  const workspace = await workspaceService.getWorkspace(currentUserId(req), id);
  res.status(200).json(ok(workspace));
});

/**
 * POST /api/problems/:id/complete — trigger the learning-integration flow.
 * Orchestration lives entirely in the service; the controller only parses,
 * delegates and responds.
 */
export const completeProblem = asyncHandler(async (req: Request, res: Response) => {
  const id = assertObjectId(req.params.id, 'problem id');
  const body = parseCompleteProblem(req.body);
  const impact = await workspaceService.completeProblem(currentUserId(req), id, body);
  res.status(200).json(ok(impact));
});

/** GET /api/problems/:id/learning-impact — current mastery / progress / dashboard impact. */
export const getLearningImpact = asyncHandler(async (req: Request, res: Response) => {
  const id = assertObjectId(req.params.id, 'problem id');
  const impact = await learningIntegrationService.getLearningImpact(currentUserId(req), id);
  res.status(200).json(ok(impact));
});
