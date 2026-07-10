import type { Request, Response } from 'express';
import { achievementService } from '../services/achievement.service.js';
import { badgeService } from '../services/badge.service.js';
import { challengeService } from '../services/challenge.service.js';
import { celebrationService } from '../services/celebration.service.js';
import { gamificationProfileService } from '../services/gamificationProfile.service.js';
import {
  parseAchievementsQuery,
  parseCelebrationsQuery,
  parseChallengeAction,
} from '../validators/achievement.validator.js';
import { currentUserId } from '../../utils/currentUser.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ok } from '../../utils/ApiResponse.js';
import { ApiError } from '../../utils/ApiError.js';

/**
 * Sprint 2 gamification controllers. Every handler is user-scoped via
 * `currentUserId(req)` and only ever reads/writes that user's rows — ownership
 * is enforced by scoping every query to `userId` (no cross-user path exists).
 */

/** GET /api/gamification/achievements — full catalogue with the user's progress. */
export const getAchievements = asyncHandler(async (req: Request, res: Response) => {
  const { category, rarity, unlocked } = parseAchievementsQuery(req.query);
  let items = await achievementService.list(currentUserId(req));
  if (category) items = items.filter((a) => a.category === category);
  if (rarity) items = items.filter((a) => a.rarity === rarity);
  if (unlocked !== undefined) items = items.filter((a) => a.unlocked === unlocked);
  res.status(200).json(ok(items, { count: items.length }));
});

/** GET /api/gamification/achievements/:id — one achievement (by key). */
export const getAchievement = asyncHandler(async (req: Request, res: Response) => {
  const achievement = await achievementService.getByKey(currentUserId(req), req.params.id);
  if (!achievement) throw ApiError.notFound('Achievement not found');
  res.status(200).json(ok(achievement));
});

/** GET /api/gamification/badges — the user's badge collection. */
export const getBadges = asyncHandler(async (req: Request, res: Response) => {
  const badges = await badgeService.list(currentUserId(req));
  res.status(200).json(ok(badges, { count: badges.length }));
});

/** GET /api/gamification/challenges — grouped active + completed challenges. */
export const getChallenges = asyncHandler(async (req: Request, res: Response) => {
  const challenges = await challengeService.list(currentUserId(req));
  res.status(200).json(ok(challenges));
});

/** PATCH /api/gamification/challenges/:id — refresh / dismiss. */
export const patchChallenge = asyncHandler(async (req: Request, res: Response) => {
  const { action } = parseChallengeAction(req.body);
  const challenge = await challengeService.update(currentUserId(req), req.params.id, action);
  res.status(200).json(ok(challenge));
});

/** GET /api/gamification/celebrations — recent celebration events. */
export const getCelebrations = asyncHandler(async (req: Request, res: Response) => {
  const { unseen, limit } = parseCelebrationsQuery(req.query);
  const userId = currentUserId(req);
  const celebrations = await celebrationService.getRecent(userId, { unseenOnly: unseen, limit });
  const unseenCount = await celebrationService.countUnseen(userId);
  res.status(200).json(ok(celebrations, { count: celebrations.length, unseen: unseenCount }));
});

/** POST /api/gamification/celebrations/seen — acknowledge shown celebrations. */
export const markCelebrationsSeen = asyncHandler(async (req: Request, res: Response) => {
  const ids = Array.isArray(req.body?.ids) ? (req.body.ids as unknown[]).map(String) : undefined;
  const modified = await celebrationService.markSeen(currentUserId(req), ids);
  res.status(200).json(ok({ modified }));
});

/** GET /api/gamification/profile — the unified gamification profile. */
export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  const profile = await gamificationProfileService.getProfile(currentUserId(req));
  res.status(200).json(ok(profile));
});
