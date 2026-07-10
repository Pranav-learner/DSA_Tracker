import { Router } from 'express';
import {
  postChat,
  getConversations,
  getConversation,
  createConversation,
  renameConversation,
  deleteConversation,
  getSettings,
  patchSettings,
  getProviders,
} from '../controllers/ai.controller.js';
import { aiRateLimit } from '../middleware/rateLimit.js';

/** /api/ai — the AI Platform Layer (chat pipeline + conversations + settings). */
export const aiRouter = Router();

// Chat is the only expensive/abusable route → rate-limited per user.
aiRouter.post('/chat', aiRateLimit, postChat);

aiRouter.get('/conversations', getConversations);
aiRouter.post('/conversations', createConversation);
aiRouter.get('/conversations/:id', getConversation);
aiRouter.patch('/conversations/:id', renameConversation);
aiRouter.delete('/conversations/:id', deleteConversation);

aiRouter.get('/settings', getSettings);
aiRouter.patch('/settings', patchSettings);

aiRouter.get('/providers', getProviders);

export default aiRouter;
