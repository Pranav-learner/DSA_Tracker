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

export default api;
