import { Router } from 'express';
import {
  getProblems,
  getProblem,
  searchProblems,
  getProblemFacets,
} from '../controllers/problem.controller.js';

const router = Router();

// Static sub-paths MUST precede the `/:id` param route so they aren't swallowed.
router.get('/facets', getProblemFacets);
router.get('/search', searchProblems);
router.get('/:id', getProblem);
router.get('/', getProblems);

export default router;
