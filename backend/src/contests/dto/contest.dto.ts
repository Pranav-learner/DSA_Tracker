import type { ContestPlatform, ContestType } from '../../types/domain.js';
import type { ContestSortField } from '../../config/contest.js';

/** A contest as returned by the API. */
export interface ContestDTO {
  id: string;
  platform: ContestPlatform;
  provider: string;
  contestId: string;
  contestName: string;
  contestUrl: string;
  division: string;
  contestType: ContestType;
  startTime: string;
  durationMinutes: number;
  ratingBefore: number | null;
  ratingAfter: number | null;
  ratingChange: number | null;
  rank: number | null;
  percentile: number | null;
  participated: boolean;
  notes: string;
  /** Derived: was this a rating-affecting contest with a recorded change. */
  isRated: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedContestsDTO {
  items: ContestDTO[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/** Data-driven filter values for the library filter bar. */
export interface ContestFacetsDTO {
  platforms: { platform: ContestPlatform; label: string; divisions: string[] }[];
  contestTypes: ContestType[];
  usedPlatforms: string[];
  usedDivisions: string[];
}

export interface ContestStatsDTO {
  totalContests: number;
  ratedContests: number;
  virtualContests: number;
  participatedContests: number;
  averageRank: number;
  averageRatingChange: number;
  participationFrequencyPerMonth: number;
  platformDistribution: { platform: string; count: number; percent: number }[];
}

/** A single point on the rating timeline. */
export interface RatingHistoryPointDTO {
  contestId: string;
  contestName: string;
  platform: ContestPlatform;
  rating: number;
  ratingChange: number;
  date: string;
}

export interface RatingSummaryDTO {
  currentRating: number | null;
  highestRating: number | null;
  lowestRating: number | null;
  averageRating: number | null;
  bestImprovement: number;
  worstDrop: number;
  ratedContests: number;
  lastRatingChange: number | null;
  recentChanges: { contestName: string; ratingChange: number; date: string }[];
}

/** Compact contest block embedded in the Home dashboard. */
export interface DashboardContestDTO {
  totalContests: number;
  currentRating: number | null;
  highestRating: number | null;
  latestContest: ContestDTO | null;
  recentRatingChange: number | null;
  averageRank: number;
  /** Sprint 2: the latest contest's workspace performance snapshot. */
  latestPerformance: { totalSolved: number; wrongAttempts: number; penalty: number; averageSolveTime: number } | null;
  /** Sprint 3: pending upsolve tasks across all contests. */
  pendingUpsolve: number;
  /** Sprint 4: persisted contest-readiness score (null until first computed). */
  contestReadiness: number | null;
}

/** Normalised, validated query for the contest list. */
export interface ContestQuery {
  page: number;
  pageSize: number;
  q?: string;
  platform?: ContestPlatform;
  contestType?: ContestType;
  division?: string;
  rated?: boolean;
  from?: string;
  to?: string;
  sort: ContestSortField;
  order: 'asc' | 'desc';
}
