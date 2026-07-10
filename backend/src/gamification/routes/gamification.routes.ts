import { Router } from 'express';
import {
  getProgression,
  getRewards,
  getRewardHistory,
  getLevels,
  getStreaks,
} from '../controllers/gamification.controller.js';

/** /api/gamification — the learner's progression, rewards, levels & streaks. */
export const gamificationRouter = Router();

gamificationRouter.get('/progression', getProgression);
// Static /rewards/history must precede the plain /rewards route.
gamificationRouter.get('/rewards/history', getRewardHistory);
gamificationRouter.get('/rewards', getRewards);
gamificationRouter.get('/levels', getLevels);
gamificationRouter.get('/streaks', getStreaks);

export default gamificationRouter;
