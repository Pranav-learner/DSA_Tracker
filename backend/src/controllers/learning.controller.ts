import type { Request, Response } from 'express';
import { learningStateService } from '../services/learningState.service.js';
import { currentUserId } from '../utils/currentUser.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ok } from '../utils/ApiResponse.js';

/** GET /api/learning/state — composed "where am I" state for the dashboard. */
export const getLearningState = asyncHandler(async (req: Request, res: Response) => {
  const state = await learningStateService.get(currentUserId(req));
  res.status(200).json(ok(state));
});
