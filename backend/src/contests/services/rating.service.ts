import { ratingRepository } from '../repositories/rating.repository.js';
import { contestRepository } from '../repositories/contest.repository.js';
import type { ContestDocument } from '../../models/Contest.js';
import type { ContestPlatform } from '../../types/domain.js';
import type { RatingHistoryDocument } from '../../models/RatingHistory.js';
import type { RatingHistoryPointDTO, RatingSummaryDTO } from '../dto/contest.dto.js';

const round = (n: number) => Math.round(n);

/** A rated contest contributes a rating point (has a recorded post-rating). */
function isRatedPoint(c: ContestDocument): boolean {
  return c.contestType === 'Rated' && c.ratingAfter !== null && c.ratingAfter !== undefined;
}

/**
 * RatingService — maintains the rating timeline and computes basic rating
 * statistics (current/highest/lowest/average, best/worst delta, trend). No
 * analytics beyond these basics (per the sprint scope).
 */
export const ratingService = {
  /** Keep RatingHistory in sync with a contest: upsert a point, or remove it. */
  async syncFromContest(userId: string, contest: ContestDocument): Promise<void> {
    const contestRef = String(contest._id);
    if (!isRatedPoint(contest)) {
      await ratingRepository.deleteByContest(userId, contestRef);
      return;
    }
    const patch = {
      userId,
      platform: contest.platform,
      contestRef: contest._id,
      contestId: contest.contestId,
      rating: contest.ratingAfter as number,
      ratingChange: contest.ratingChange ?? 0,
      contestDate: contest.startTime,
    };
    const existing = await ratingRepository.findByContest(userId, contestRef);
    if (existing) await ratingRepository.updateByContest(userId, contestRef, patch);
    else await ratingRepository.create(patch);
  },

  removeForContest(userId: string, contestRef: string): Promise<unknown> {
    return ratingRepository.deleteByContest(userId, contestRef);
  },

  async history(userId: string, platform?: ContestPlatform): Promise<RatingHistoryPointDTO[]> {
    const [points, names] = await Promise.all([
      ratingRepository.findHistory(userId, platform ? { platform } : {}),
      this.contestNames(userId),
    ]);
    return points.map((p) => ({
      contestId: p.contestId,
      contestName: names.get(String(p.contestRef)) ?? p.contestId,
      platform: p.platform,
      rating: p.rating,
      ratingChange: p.ratingChange,
      date: p.contestDate.toISOString(),
    }));
  },

  async summary(userId: string, platform?: ContestPlatform): Promise<RatingSummaryDTO> {
    const [points, names] = await Promise.all([
      ratingRepository.findHistory(userId, platform ? { platform } : {}),
      this.contestNames(userId),
    ]);
    if (points.length === 0) {
      return {
        currentRating: null,
        highestRating: null,
        lowestRating: null,
        averageRating: null,
        bestImprovement: 0,
        worstDrop: 0,
        ratedContests: 0,
        lastRatingChange: null,
        recentChanges: [],
      };
    }
    const ratings = points.map((p) => p.rating);
    const changes = points.map((p) => p.ratingChange);
    const latest = points[points.length - 1];

    return {
      currentRating: latest.rating,
      highestRating: Math.max(...ratings),
      lowestRating: Math.min(...ratings),
      averageRating: round(ratings.reduce((a, b) => a + b, 0) / ratings.length),
      bestImprovement: Math.max(...changes),
      worstDrop: Math.min(...changes),
      ratedContests: points.length,
      lastRatingChange: latest.ratingChange,
      recentChanges: [...points]
        .slice(-5)
        .reverse()
        .map((p) => ({ contestName: names.get(String(p.contestRef)) ?? p.contestId, ratingChange: p.ratingChange, date: p.contestDate.toISOString() })),
    };
  },

  /** The most recent rating (optionally per platform), or null. */
  async current(userId: string, platform?: ContestPlatform): Promise<number | null> {
    const latest = await ratingRepository.findLatest(userId, platform ? { platform } : {});
    return latest?.rating ?? null;
  },

  /** Map of contestRef → contest name (for enriching rating points). */
  async contestNames(userId: string): Promise<Map<string, string>> {
    const contests = await contestRepository.findAll(userId);
    return new Map(contests.map((c) => [String(c._id), c.contestName]));
  },

  /** Rebuild every rating point from the user's contests (used after seeding). */
  async rebuild(userId: string): Promise<void> {
    await ratingRepository.deleteByUser(userId);
    const contests = await contestRepository.findAll(userId);
    const points = contests.filter(isRatedPoint).map((c) => ({
      userId,
      platform: c.platform,
      contestRef: c._id,
      contestId: c.contestId,
      rating: c.ratingAfter as number,
      ratingChange: c.ratingChange ?? 0,
      contestDate: c.startTime,
    }));
    if (points.length) await ratingRepository.insertMany(points);
  },
};

export type { RatingHistoryDocument };
