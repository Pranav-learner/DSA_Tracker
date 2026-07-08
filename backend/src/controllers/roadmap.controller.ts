import type { Request, Response } from 'express';
import { roadmapService } from '../services/roadmap.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ok } from '../utils/ApiResponse.js';

/** GET /api/roadmap — full roadmap with phases, counts and progress placeholder. */
export const getRoadmap = asyncHandler(async (_req: Request, res: Response) => {
  const roadmap = await roadmapService.get();
  res.status(200).json(ok(roadmap));
});
