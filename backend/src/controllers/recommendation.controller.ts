import type { Request, Response } from 'express';
import { recommendationService } from '../services/recommendation.service.js';
import { currentUserId } from '../utils/currentUser.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ok } from '../utils/ApiResponse.js';

/** GET /api/recommendation — the rule-based next best action. */
export const getRecommendation = asyncHandler(async (req: Request, res: Response) => {
  const recommendation = await recommendationService.get(currentUserId(req));
  res.status(200).json(ok(recommendation));
});
