import type { Request, Response } from 'express';
import { topicService } from '../services/topic.service.js';
import { assertObjectId } from '../validators/objectId.validator.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ok } from '../utils/ApiResponse.js';

/** GET /api/topics — list all topics. */
export const listTopics = asyncHandler(async (_req: Request, res: Response) => {
  const topics = await topicService.list();
  res.status(200).json(ok(topics, { count: topics.length }));
});

/** GET /api/topics/:topicId — one topic by id. */
export const getTopic = asyncHandler(async (req: Request, res: Response) => {
  const id = assertObjectId(req.params.topicId, 'topicId');
  const topic = await topicService.getById(id);
  res.status(200).json(ok(topic));
});
