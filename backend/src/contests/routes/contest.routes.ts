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
import {
  getIntelligence,
  getReadiness,
  getCorrelation,
  getInsights,
  getRatingAnalysis,
} from '../controllers/competitiveIntelligence.controller.js';
import {
  getWorkspace,
  listProblems,
  addProblem,
  updateProblem,
  deleteProblem,
  getTimeline,
  addTimelineEvent,
  getPerformance,
} from '../controllers/contestWorkspace.controller.js';
import {
  getPostmortem,
  upsertPostmortem,
  getContestLearning,
  createUpsolve,
  listUpsolve,
  getUpsolveQueue,
  getUpsolve,
  updateUpsolve,
} from '../controllers/contestLearning.controller.js';

/** /api/contests — the contest library (CRUD + stats) + workspace (Sprint 2). */
export const contestRouter = Router();

// Static routes before the /:id param route.
contestRouter.get('/stats', getContestStats);
contestRouter.get('/facets', getContestFacets);

// Module 5 · Sprint 2 — contest workspace (problem CRUD lives at /problems/:problemId).
contestRouter.patch('/problems/:problemId', updateProblem);
contestRouter.delete('/problems/:problemId', deleteProblem);
contestRouter.get('/:id/workspace', getWorkspace);
contestRouter.get('/:id/problems', listProblems);
contestRouter.post('/:id/problems', addProblem);
contestRouter.get('/:id/timeline', getTimeline);
contestRouter.post('/:id/timeline', addTimelineEvent);
contestRouter.get('/:id/performance', getPerformance);

// Module 5 · Sprint 3 — contest learning (postmortem + upsolve).
contestRouter.get('/:id/learning', getContestLearning);
contestRouter.get('/:id/postmortem', getPostmortem);
contestRouter.post('/:id/postmortem', upsertPostmortem);
contestRouter.patch('/:id/postmortem', upsertPostmortem);
contestRouter.post('/:id/upsolve', createUpsolve);

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

/** /api/contest — competitive intelligence (Sprint 4, singular prefix). */
export const competitiveRouter = Router();
competitiveRouter.get('/intelligence', getIntelligence);
competitiveRouter.get('/readiness', getReadiness);
competitiveRouter.get('/correlation', getCorrelation);
competitiveRouter.get('/insights', getInsights);
competitiveRouter.get('/rating-analysis', getRatingAnalysis);

/** /api/upsolve — the global upsolve queue (Sprint 3). */
export const upsolveRouter = Router();
upsolveRouter.get('/queue', getUpsolveQueue);
upsolveRouter.get('/', listUpsolve);
upsolveRouter.get('/:id', getUpsolve);
upsolveRouter.patch('/:id', updateUpsolve);
