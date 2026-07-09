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

export default api;
