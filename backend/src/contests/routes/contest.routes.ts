import { Router } from 'express';
import {
  createContest,
  listContests,
  getContestStats,
  getContestFacets,
  getContest,
  updateContest,
  deleteContest,
} from '../controllers/contest.controller.js';
import { getRatings, getRatingHistory, getCurrentRating } from '../controllers/rating.controller.js';

/** /api/contests — the contest library (CRUD + stats). */
export const contestRouter = Router();

// Static routes before the /:id param route.
contestRouter.get('/stats', getContestStats);
contestRouter.get('/facets', getContestFacets);
contestRouter.post('/', createContest);
contestRouter.get('/', listContests);
contestRouter.get('/:id', getContest);
contestRouter.patch('/:id', updateContest);
contestRouter.delete('/:id', deleteContest);

/** /api/ratings — rating history + summary. */
export const ratingRouter = Router();
ratingRouter.get('/history', getRatingHistory);
ratingRouter.get('/current', getCurrentRating);
ratingRouter.get('/', getRatings);
