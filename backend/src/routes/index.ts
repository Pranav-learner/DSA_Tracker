import { Router } from 'express';
import roadmapRoutes from './roadmap.routes.js';
import phaseRoutes from './phase.routes.js';
import topicRoutes from './topic.routes.js';

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
      ],
    },
  });
});

api.use('/roadmap', roadmapRoutes);
api.use('/phases', phaseRoutes);
api.use('/topics', topicRoutes);

export default api;
