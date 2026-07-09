import type { Request, Response } from 'express';
import { ratingService } from '../services/rating.service.js';
import { currentUserId } from '../../utils/currentUser.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ok } from '../../utils/ApiResponse.js';
import { CONTEST_PLATFORMS, type ContestPlatform } from '../../types/domain.js';

/** Read an optional, validated platform filter from the query. */
function platformParam(req: Request): ContestPlatform | undefined {
  const p = req.query.platform;
  return typeof p === 'string' && (CONTEST_PLATFORMS as readonly string[]).includes(p) ? (p as ContestPlatform) : undefined;
}

/** GET /api/ratings — rating summary (current/highest/lowest/average + recent). */
export const getRatings = asyncHandler(async (req: Request, res: Response) => {
  const summary = await ratingService.summary(currentUserId(req), platformParam(req));
  res.status(200).json(ok(summary));
});

/** GET /api/ratings/history — the full rating timeline. */
export const getRatingHistory = asyncHandler(async (req: Request, res: Response) => {
  const history = await ratingService.history(currentUserId(req), platformParam(req));
  res.status(200).json(ok(history, { count: history.length }));
});

/** GET /api/ratings/current — the most recent rating. */
export const getCurrentRating = asyncHandler(async (req: Request, res: Response) => {
  const current = await ratingService.current(currentUserId(req), platformParam(req));
  res.status(200).json(ok({ currentRating: current }));
});
