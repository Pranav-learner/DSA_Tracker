import { Router } from 'express';
import {
  getProgression,
  getRewards,
  getRewardHistory,
  getLevels,
  getStreaks,
} from '../controllers/gamification.controller.js';
import {
  getAchievements,
  getAchievement,
  getBadges,
  getChallenges,
  patchChallenge,
  getCelebrations,
  markCelebrationsSeen,
  getProfile,
} from '../controllers/achievement.controller.js';

/** /api/gamification — progression, rewards, levels, streaks (Sprint 1) + the
 *  achievement system: achievements, badges, challenges, celebrations, profile. */
export const gamificationRouter = Router();

// --- Sprint 1: progression ---
gamificationRouter.get('/progression', getProgression);
gamificationRouter.get('/rewards/history', getRewardHistory);
gamificationRouter.get('/rewards', getRewards);
gamificationRouter.get('/levels', getLevels);
gamificationRouter.get('/streaks', getStreaks);

// --- Sprint 2: achievement system ---
gamificationRouter.get('/profile', getProfile);
gamificationRouter.get('/achievements/:id', getAchievement);
gamificationRouter.get('/achievements', getAchievements);
gamificationRouter.get('/badges', getBadges);
gamificationRouter.get('/challenges', getChallenges);
gamificationRouter.patch('/challenges/:id', patchChallenge);
gamificationRouter.post('/celebrations/seen', markCelebrationsSeen);
gamificationRouter.get('/celebrations', getCelebrations);

export default gamificationRouter;
