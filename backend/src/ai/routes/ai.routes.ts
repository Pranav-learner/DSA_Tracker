import { Router } from 'express';
import {
  postChat,
  getConversations,
  getConversation,
  createConversation,
  patchConversation,
  deleteConversation,
  searchConversations,
  exportConversation,
  getSettings,
  patchSettings,
  getProviders,
  getContext,
  getContextPreview,
  getSuggestions,
  getWorkspace,
  postCoach,
  getCoaches,
  getCoach,
  getMentorOverview,
  postWorkflow,
  getWorkflows,
  patchWorkflow,
  getRecommendations,
  patchRecommendation,
  getMentorBrief,
  getTimeline,
  getActions,
  summarizeConversation,
} from '../controllers/ai.controller.js';
import { aiRateLimit } from '../middleware/rateLimit.js';

/** /api/ai — the AI Platform Layer (Sprint 1) + Mentor Workspace (Sprint 2). */
export const aiRouter = Router();

// Chat is the only expensive/abusable route → rate-limited per user.
aiRouter.post('/chat', aiRateLimit, postChat);

// Sprint 3 — specialized coaching (rate-limited like chat). Static /coaches
// routes are declared before the parameterized one.
aiRouter.post('/coach', aiRateLimit, postCoach);
aiRouter.get('/coaches', getCoaches);
aiRouter.get('/coaches/:coachId', getCoach);

// Sprint 4 — AI Operating System (workflows, recommendations, briefs, timeline, actions).
aiRouter.get('/overview', getMentorOverview);
aiRouter.post('/workflows', postWorkflow);
aiRouter.get('/workflows', getWorkflows);
aiRouter.patch('/workflows/:id', patchWorkflow);
aiRouter.get('/recommendations', getRecommendations);
aiRouter.patch('/recommendations/:id', patchRecommendation);
aiRouter.get('/mentor-brief', getMentorBrief);
aiRouter.get('/timeline', getTimeline);
aiRouter.get('/actions', getActions);

// Sprint 2 — workspace, context intelligence & suggestions.
aiRouter.get('/workspace', getWorkspace);
aiRouter.get('/suggestions', getSuggestions);
aiRouter.get('/context/preview', getContextPreview);
aiRouter.get('/context', getContext);

// Conversations (static /search + /export before the /:id param route).
aiRouter.get('/conversations/search', searchConversations);
aiRouter.post('/conversations/export', exportConversation);
aiRouter.get('/conversations', getConversations);
aiRouter.post('/conversations', createConversation);
aiRouter.get('/conversations/:id', getConversation);
aiRouter.patch('/conversations/:id', patchConversation);
aiRouter.post('/conversations/:id/summary', summarizeConversation);
aiRouter.delete('/conversations/:id', deleteConversation);

aiRouter.get('/settings', getSettings);
aiRouter.patch('/settings', patchSettings);

aiRouter.get('/providers', getProviders);

export default aiRouter;
