import type { Request, Response } from 'express';
import { progressionService } from '../services/progression.service.js';
import { parseRewardHistoryQuery, parseRecentRewardsQuery } from '../validators/gamification.validator.js';
import { currentUserId } from '../../utils/currentUser.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ok } from '../../utils/ApiResponse.js';

/**
 * Gamification controllers. Every handler resolves the acting user via
 * `currentUserId(req)` and only ever touches that user's data, so a learner can
 * never read another's progression or rewards (ownership is enforced by scoping
 * every query to `userId` — there is no cross-user code path).
 */

/** GET /api/gamification/progression — the progression summary. */
export const getProgression = asyncHandler(async (req: Request, res: Response) => {
  const summary = await progressionService.getSummary(currentUserId(req));
  res.status(200).json(ok(summary));
});

/** GET /api/gamification/rewards — the most recent rewards (compact feed). */
export const getRewards = asyncHandler(async (req: Request, res: Response) => {
  const { limit } = parseRecentRewardsQuery(req.query);
  const rewards = await progressionService.getRecentRewards(currentUserId(req), limit);
  res.status(200).json(ok(rewards, { count: rewards.length }));
});

/** GET /api/gamification/rewards/history — filtered, paginated history. */
export const getRewardHistory = asyncHandler(async (req: Request, res: Response) => {
  const filter = parseRewardHistoryQuery(req.query);
  const page = await progressionService.getRewardHistory(currentUserId(req), filter);
  res.status(200).json(ok(page, { total: page.total, limit: page.limit, offset: page.offset }));
});

/** GET /api/gamification/levels — the level ladder + the user's position. */
export const getLevels = asyncHandler(async (req: Request, res: Response) => {
  const levels = await progressionService.getLevels(currentUserId(req));
  res.status(200).json(ok(levels));
});

/** GET /api/gamification/streaks — streak detail + daily activity breakdown. */
export const getStreaks = asyncHandler(async (req: Request, res: Response) => {
  const streaks = await progressionService.getStreaks(currentUserId(req));
  res.status(200).json(ok(streaks));
});
