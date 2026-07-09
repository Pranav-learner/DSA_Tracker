import { Router } from 'express';
import {
  getProblems,
  getProblem,
  searchProblems,
  getProblemFacets,
} from '../controllers/problem.controller.js';
import { getProblemAttempts, getProblemSummary } from '../controllers/attempt.controller.js';
import { getWorkspace, completeProblem, getLearningImpact } from '../controllers/workspace.controller.js';

const router = Router();

// Static sub-paths MUST precede the `/:id` param route so they aren't swallowed.
router.get('/facets', getProblemFacets);
router.get('/search', searchProblems);
// Problem-scoped attempt endpoints (Module 2 · Sprint 2).
router.get('/:problemId/attempts', getProblemAttempts);
router.get('/:problemId/summary', getProblemSummary);
// Problem workspace + learning integration (Module 2 · Sprint 4).
router.get('/:id/workspace', getWorkspace);
router.post('/:id/complete', completeProblem);
router.get('/:id/learning-impact', getLearningImpact);
router.get('/:id', getProblem);
router.get('/', getProblems);

export default router;
