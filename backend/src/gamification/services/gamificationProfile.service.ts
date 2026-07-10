import { progressionService } from './progression.service.js';
import { achievementService } from './achievement.service.js';
import { badgeService } from './badge.service.js';
import { challengeService } from './challenge.service.js';
import { celebrationService } from './celebration.service.js';
import { challengeRepository } from '../repositories/challenge.repository.js';
import type { GamificationProfileDTO } from '../dto/gamification.dto.js';

/**
 * GamificationProfileService — the unified read model for GET /profile and the
 * home-dashboard gamification widget. It composes the Sprint 1 progression
 * summary with Sprint 2 achievements, badges, challenges and celebrations in one
 * payload, so the dashboard needs a single request (mirrors DashboardService).
 */
export const gamificationProfileService = {
  async getProfile(userId: string): Promise<GamificationProfileDTO> {
    const now = new Date();

    const [progression, achievements, badges, activeChallenges, allChallenges, celebrations, unseen] =
      await Promise.all([
        progressionService.getSummary(userId),
        achievementService.list(userId),
        badgeService.list(userId),
        challengeService.listActive(userId, now), // ensures the current period's set exists
        challengeRepository.findByUser(userId),
        celebrationService.getRecent(userId, { limit: 8 }),
        celebrationService.countUnseen(userId),
      ]);

    const unlocked = achievements.filter((a) => a.unlocked);
    const recent = [...unlocked]
      .sort((a, b) => (b.unlockedAt ?? '').localeCompare(a.unlockedAt ?? ''))
      .slice(0, 5);
    const inProgress = achievements
      .filter((a) => !a.unlocked && a.progress > 0)
      .sort((a, b) => b.percent - a.percent)
      .slice(0, 5);

    return {
      progression,
      achievements: {
        unlocked: unlocked.length,
        total: achievements.length,
        recent,
        inProgress,
      },
      badges: {
        count: badges.length,
        recent: badges.slice(0, 6),
      },
      challenges: {
        active: activeChallenges,
        completedCount: allChallenges.filter((c) => c.status === 'Completed').length,
      },
      celebrations: {
        unseen,
        recent: celebrations,
      },
    };
  },
};
