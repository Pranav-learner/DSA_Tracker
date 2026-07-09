import { Router } from 'express';
import {
  getProblems,
  getProblem,
  searchProblems,
  getProblemFacets,
} from '../controllers/problem.controller.js';
import { getProblemAttempts, getProblemSummary } from '../controllers/attempt.controller.js';

const router = Router();

// Static sub-paths MUST precede the `/:id` param route so they aren't swallowed.
router.get('/facets', getProblemFacets);
router.get('/search', searchProblems);
// Problem-scoped attempt endpoints (Module 2 · Sprint 2).
router.get('/:problemId/attempts', getProblemAttempts);
router.get('/:problemId/summary', getProblemSummary);
router.get('/:id', getProblem);
router.get('/', getProblems);

export default router;
