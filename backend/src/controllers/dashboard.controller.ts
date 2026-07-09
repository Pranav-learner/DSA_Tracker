import type { Request, Response } from 'express';
import { dashboardService } from '../services/dashboard.service.js';
import { currentUserId } from '../utils/currentUser.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ok } from '../utils/ApiResponse.js';

/** GET /api/dashboard — aggregated learner home screen (single request). */
export const getDashboard = asyncHandler(async (req: Request, res: Response) => {
  const dashboard = await dashboardService.get(currentUserId(req));
  res.status(200).json(ok(dashboard));
});
