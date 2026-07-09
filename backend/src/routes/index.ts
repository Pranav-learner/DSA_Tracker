import { Router } from 'express';
import roadmapRoutes from './roadmap.routes.js';
import phaseRoutes from './phase.routes.js';
import topicRoutes from './topic.routes.js';
import learningRoutes from './learning.routes.js';
import progressRoutes from './progress.routes.js';
import recommendationRoutes from './recommendation.routes.js';
import dashboardRoutes from './dashboard.routes.js';
import problemRoutes from './problem.routes.js';
import attemptRoutes from './attempt.routes.js';
import notebookRoutes from './notebook.routes.js';
import revisionRoutes from './revision.routes.js';
import retentionRoutes, { confidenceRouter } from './retention.routes.js';
import analyticsRoutes from '../analytics/routes/analytics.routes.js';
import reportRoutes from '../reports/routes/report.routes.js';
import { contestRouter, ratingRouter, upsolveRouter, competitiveRouter } from '../contests/routes/contest.routes.js';

/** Root API router — mounts every feature router under /api. */
const api = Router();

api.get('/', (_req, res) => {
  res.json({
    success: true,
    data: {
      name: 'CP-OS Learning Roadmap API',
      version: '1.0.0',
      endpoints: [
        'GET /api/roadmap',
        'GET /api/phases',
        'GET /api/phases/:phaseId',
        'GET /api/phases/:phaseId/topics',
        'GET /api/topics',
        'GET /api/topics/:topicId',
        'GET /api/topics/:topicId/related',
        'GET /api/topics/:topicId/problems',
        'GET /api/topics/unlocked',
        'GET|PATCH /api/topics/:topicId/progress',
        'GET|PATCH /api/topics/:topicId/mastery',
        'POST /api/topics/:topicId/unlock',
        'GET /api/learning/state',
        'GET /api/progress',
        'GET /api/recommendation',
        'GET /api/dashboard',
        'GET /api/problems',
        'GET /api/problems/search',
        'GET /api/problems/facets',
        'GET /api/problems/:id',
        'GET /api/problems/:id/attempts',
        'GET /api/problems/:id/summary',
        'POST /api/attempts',
        'GET|PATCH|DELETE /api/attempts/:id',
        'GET|POST /api/notebook',
        'GET /api/notebook/search',
        'GET /api/notebook/facets',
        'GET|PATCH|DELETE /api/notebook/:id',
        'GET /api/problems/:id/workspace',
        'POST /api/problems/:id/complete',
        'GET /api/problems/:id/learning-impact',
        'GET|POST /api/revision/schedules',
        'GET|PATCH|DELETE /api/revision/schedules/:id',
        'GET /api/revision/today',
        'GET /api/revision/calendar',
        'GET /api/revision/workspace',
        'POST /api/revision/session/start',
        'POST /api/revision/session/complete',
        'GET /api/revision/session/active',
        'GET|PATCH /api/revision/session/:id',
        'GET /api/revision/history',
        'GET /api/revision/history/:entityId',
        'GET /api/retention',
        'GET /api/retention/overview',
        'GET /api/retention/history',
        'GET|PATCH /api/retention/:entityId',
        'GET /api/confidence',
        'GET /api/analytics/overview',
        'GET /api/analytics/learning',
        'GET /api/analytics/problems',
        'GET /api/analytics/knowledge',
        'GET /api/analytics/revision',
        'GET /api/analytics/retention',
        'GET /api/analytics/activity',
        'GET /api/analytics/patterns',
        'GET /api/analytics/patterns/:patternId',
        'GET /api/analytics/weaknesses',
        'GET /api/analytics/strengths',
        'GET /api/analytics/insights',
        'GET /api/analytics/trends',
        'GET /api/analytics/recommendations',
        'GET /api/analytics/executive',
        'GET /api/reports/weekly',
        'GET /api/reports/monthly',
        'GET /api/reports/phase/:phaseId',
        'GET /api/reports/summary',
        'GET /api/reports/export/pdf|markdown|json|csv',
        'POST /api/contests',
        'GET /api/contests',
        'GET /api/contests/stats',
        'GET /api/contests/facets',
        'GET|PATCH|DELETE /api/contests/:id',
        'GET /api/contests/:id/workspace',
        'GET|POST /api/contests/:id/problems',
        'PATCH|DELETE /api/contests/problems/:problemId',
        'GET|POST /api/contests/:id/timeline',
        'GET /api/contests/:id/performance',
        'GET /api/contests/:id/learning',
        'GET|POST|PATCH /api/contests/:id/postmortem',
        'POST /api/contests/:id/upsolve',
        'GET /api/upsolve',
        'GET /api/upsolve/queue',
        'GET|PATCH /api/upsolve/:id',
        'GET /api/contest/intelligence',
        'GET /api/contest/readiness',
        'GET /api/contest/correlation',
        'GET /api/contest/insights',
        'GET /api/contest/rating-analysis',
        'GET /api/ratings',
        'GET /api/ratings/history',
        'GET /api/ratings/current',
      ],
    },
  });
});

api.use('/roadmap', roadmapRoutes);
api.use('/phases', phaseRoutes);
api.use('/topics', topicRoutes);
api.use('/learning', learningRoutes);
api.use('/progress', progressRoutes);
api.use('/recommendation', recommendationRoutes);
api.use('/dashboard', dashboardRoutes);
api.use('/problems', problemRoutes);
api.use('/attempts', attemptRoutes);
api.use('/notebook', notebookRoutes);
api.use('/revision', revisionRoutes);
api.use('/retention', retentionRoutes);
api.use('/confidence', confidenceRouter);
api.use('/analytics', analyticsRoutes);
api.use('/reports', reportRoutes);
api.use('/contests', contestRouter);
api.use('/ratings', ratingRouter);
api.use('/upsolve', upsolveRouter);
api.use('/contest', competitiveRouter);

export default api;
