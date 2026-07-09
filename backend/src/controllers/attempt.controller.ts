import type { Request, Response } from 'express';
import { attemptService } from '../services/attempt.service.js';
import { parseCreateAttempt, parseUpdateAttempt } from '../validators/attempt.validator.js';
import { assertObjectId } from '../validators/objectId.validator.js';
import { currentUserId } from '../utils/currentUser.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ok } from '../utils/ApiResponse.js';

/** POST /api/attempts — record a new attempt. */
export const createAttempt = asyncHandler(async (req: Request, res: Response) => {
  const body = parseCreateAttempt(req.body);
  const attempt = await attemptService.create(currentUserId(req), body);
  res.status(201).json(ok(attempt));
});

/** GET /api/attempts/:attemptId — a single attempt (owner only). */
export const getAttempt = asyncHandler(async (req: Request, res: Response) => {
  const id = assertObjectId(req.params.attemptId, 'attempt id');
  const attempt = await attemptService.getById(currentUserId(req), id);
  res.status(200).json(ok(attempt));
});

/** PATCH /api/attempts/:attemptId — update / complete an attempt. */
export const updateAttempt = asyncHandler(async (req: Request, res: Response) => {
  const id = assertObjectId(req.params.attemptId, 'attempt id');
  const body = parseUpdateAttempt(req.body);
  const attempt = await attemptService.update(currentUserId(req), id, body);
  res.status(200).json(ok(attempt));
});

/** DELETE /api/attempts/:attemptId — soft delete (history preserved). */
export const deleteAttempt = asyncHandler(async (req: Request, res: Response) => {
  const id = assertObjectId(req.params.attemptId, 'attempt id');
  await attemptService.remove(currentUserId(req), id);
  res.status(200).json(ok({ id, deleted: true }));
});

/** GET /api/problems/:problemId/attempts — full attempt history, newest first. */
export const getProblemAttempts = asyncHandler(async (req: Request, res: Response) => {
  const problemId = assertObjectId(req.params.problemId, 'problem id');
  const attempts = await attemptService.history(currentUserId(req), problemId);
  res.status(200).json(ok(attempts, { count: attempts.length }));
});

/** GET /api/problems/:problemId/summary — aggregated attempt stats. */
export const getProblemSummary = asyncHandler(async (req: Request, res: Response) => {
  const problemId = assertObjectId(req.params.problemId, 'problem id');
  const summary = await attemptService.summary(currentUserId(req), problemId);
  res.status(200).json(ok(summary));
});
