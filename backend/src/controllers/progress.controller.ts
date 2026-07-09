import type { Request, Response } from 'express';
import { progressService } from '../services/progress.service.js';
import { currentUserId } from '../utils/currentUser.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ok } from '../utils/ApiResponse.js';

/** GET /api/progress — overall roadmap progress with phase & topic overlays. */
export const getProgress = asyncHandler(async (req: Request, res: Response) => {
  const progress = await progressService.getOverview(currentUserId(req));
  res.status(200).json(ok(progress));
});
