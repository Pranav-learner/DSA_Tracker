import { ratingService } from './rating.service.js';
import { ratingRepository } from '../repositories/rating.repository.js';
import { CONTEST_PLATFORMS, type ContestPlatform } from '../../types/domain.js';
import type { RatingAnalysisDTO } from '../dto/competitive.dto.js';

const round = (n: number) => Math.round(n);

/**
 * RatingAnalyticsService — the comprehensive rating view. Reuses the Sprint-1
 * RatingService/RatingRepository (the rating timeline is the single source) and
 * derives trend, growth, gains/losses, consistency and per-platform stats. No
 * new persistence.
 */
export const ratingAnalyticsService = {
  async analyze(userId: string): Promise<RatingAnalysisDTO> {
    const [summary, points] = await Promise.all([ratingService.summary(userId), ratingRepository.findHistory(userId)]);

    const ratings = points.map((p) => p.rating);
    const changes = points.map((p) => p.ratingChange);
    const gains = changes.filter((c) => c > 0);

    const ratingGrowth = points.length >= 2 ? ratings[ratings.length - 1] - ratings[0] : 0;
    const ratingTrend = ratingGrowth > 5 ? 'rising' : ratingGrowth < -5 ? 'falling' : 'stable';
    const nonLoss = changes.filter((c) => c >= 0).length;

    // Per-platform: current (latest) + highest + count.
    const platformStats = CONTEST_PLATFORMS.map((platform: ContestPlatform) => {
      const pts = points.filter((p) => p.platform === platform);
      if (pts.length === 0) return { platform, current: null, highest: null, contests: 0 };
      return {
        platform,
        current: pts[pts.length - 1].rating,
        highest: Math.max(...pts.map((p) => p.rating)),
        contests: pts.length,
      };
    }).filter((s) => s.contests > 0);

    return {
      currentRating: summary.currentRating,
      highestRating: summary.highestRating,
      lowestRating: summary.lowestRating,
      averageRating: summary.averageRating,
      ratingTrend,
      ratingGrowth,
      averageRatingGain: gains.length ? round(gains.reduce((a, b) => a + b, 0) / gains.length) : 0,
      largestGain: changes.length ? Math.max(...changes) : 0,
      largestLoss: changes.length ? Math.min(...changes) : 0,
      contestConsistency: points.length ? round((nonLoss / points.length) * 100) : 0,
      ratedContests: points.length,
      timeline: points.map((p) => ({ date: p.contestDate.toISOString(), rating: p.rating })),
      platformStats,
    };
  },
};
