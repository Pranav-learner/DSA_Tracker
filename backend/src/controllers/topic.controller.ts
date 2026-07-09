import type { Request, Response } from 'express';
import { topicService } from '../services/topic.service.js';
import { topicProgressService } from '../services/topicProgress.service.js';
import { unlockService } from '../services/unlock.service.js';
import { assertObjectId } from '../validators/objectId.validator.js';
import { parseMetricPatch } from '../validators/progress.validator.js';
import { currentUserId } from '../utils/currentUser.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ok } from '../utils/ApiResponse.js';

/** GET /api/topics — list all topics. */
export const listTopics = asyncHandler(async (_req: Request, res: Response) => {
  const topics = await topicService.list();
  res.status(200).json(ok(topics, { count: topics.length }));
});

/** GET /api/topics/:topicId — full topic workspace detail. */
export const getTopic = asyncHandler(async (req: Request, res: Response) => {
  const id = assertObjectId(req.params.topicId, 'topicId');
  const topic = await topicService.getById(id);
  res.status(200).json(ok(topic));
});

/** GET /api/topics/:topicId/related — prerequisites & related topics. */
export const getTopicRelated = asyncHandler(async (req: Request, res: Response) => {
  const id = assertObjectId(req.params.topicId, 'topicId');
  const related = await topicService.getRelated(id);
  res.status(200).json(
    ok(related, {
      prerequisiteCount: related.prerequisites.length,
      relatedCount: related.related.length,
    }),
  );
});

/** GET /api/topics/:topicId/problems — read-only representative problems. */
export const getTopicProblems = asyncHandler(async (req: Request, res: Response) => {
  const id = assertObjectId(req.params.topicId, 'topicId');
  const problems = await topicService.getProblems(id);
  res.status(200).json(ok(problems, { count: problems.length }));
});

/* ------------------------------------------------------------------ *
 *  Sprint 3 — Learning Engine (per-user progress, mastery, unlock)
 * ------------------------------------------------------------------ */

/** GET /api/topics/unlocked — topics currently unlocked for the user. */
export const listUnlockedTopics = asyncHandler(async (req: Request, res: Response) => {
  const topics = await unlockService.getUnlockedTopics(currentUserId(req));
  res.status(200).json(ok(topics, { count: topics.length }));
});

/** GET /api/topics/:topicId/progress — the user's progress for a topic. */
export const getTopicProgress = asyncHandler(async (req: Request, res: Response) => {
  const id = assertObjectId(req.params.topicId, 'topicId');
  const progress = await topicProgressService.get(currentUserId(req), id);
  res.status(200).json(ok(progress));
});

/** PATCH /api/topics/:topicId/progress — update stage/metric scores. */
export const patchTopicProgress = asyncHandler(async (req: Request, res: Response) => {
  const id = assertObjectId(req.params.topicId, 'topicId');
  const patch = parseMetricPatch(req.body);
  const progress = await topicProgressService.applyUpdate(currentUserId(req), id, patch);
  res.status(200).json(ok(progress));
});

/** GET /api/topics/:topicId/mastery — mastery breakdown + weights. */
export const getTopicMastery = asyncHandler(async (req: Request, res: Response) => {
  const id = assertObjectId(req.params.topicId, 'topicId');
  const mastery = await topicProgressService.getMastery(currentUserId(req), id);
  res.status(200).json(ok(mastery));
});

/** PATCH /api/topics/:topicId/mastery — update the metric inputs behind mastery. */
export const patchTopicMastery = asyncHandler(async (req: Request, res: Response) => {
  const id = assertObjectId(req.params.topicId, 'topicId');
  const patch = parseMetricPatch(req.body);
  await topicProgressService.applyUpdate(currentUserId(req), id, patch);
  const mastery = await topicProgressService.getMastery(currentUserId(req), id);
  res.status(200).json(ok(mastery));
});

/** POST /api/topics/:topicId/unlock — explicitly unlock a topic (rule-checked). */
export const unlockTopic = asyncHandler(async (req: Request, res: Response) => {
  const id = assertObjectId(req.params.topicId, 'topicId');
  const topic = await unlockService.unlockTopic(currentUserId(req), id);
  res.status(200).json(ok(topic));
});
