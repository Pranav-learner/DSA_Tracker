import type { Request, Response } from 'express';
import { phaseService } from '../services/phase.service.js';
import { topicService } from '../services/topic.service.js';
import { assertObjectId } from '../validators/objectId.validator.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ok } from '../utils/ApiResponse.js';

/** GET /api/phases — list all phases. */
export const listPhases = asyncHandler(async (_req: Request, res: Response) => {
  const phases = await phaseService.list();
  res.status(200).json(ok(phases, { count: phases.length }));
});

/** GET /api/phases/:phaseId — one phase by id. */
export const getPhase = asyncHandler(async (req: Request, res: Response) => {
  const id = assertObjectId(req.params.phaseId, 'phaseId');
  const phase = await phaseService.getById(id);
  res.status(200).json(ok(phase));
});

/** GET /api/phases/:phaseId/topics — topics inside a phase. */
export const getPhaseTopics = asyncHandler(async (req: Request, res: Response) => {
  const id = assertObjectId(req.params.phaseId, 'phaseId');
  const topics = await topicService.listByPhase(id);
  res.status(200).json(ok(topics, { count: topics.length, phaseId: id }));
});
