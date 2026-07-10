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
} from '../controllers/ai.controller.js';
import { aiRateLimit } from '../middleware/rateLimit.js';

/** /api/ai — the AI Platform Layer (Sprint 1) + Mentor Workspace (Sprint 2). */
export const aiRouter = Router();

// Chat is the only expensive/abusable route → rate-limited per user.
aiRouter.post('/chat', aiRateLimit, postChat);

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
aiRouter.delete('/conversations/:id', deleteConversation);

aiRouter.get('/settings', getSettings);
aiRouter.patch('/settings', patchSettings);

aiRouter.get('/providers', getProviders);

export default aiRouter;
