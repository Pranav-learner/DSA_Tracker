import { useQuery } from '@tanstack/react-query';
import { competitiveApi } from '@/api/contest.api';
import { queryKeys } from '@/lib/queryClient';

/** The full competitive-intelligence payload (summary + readiness + correlation + insights). */
export const useCompetitiveIntelligence = () =>
  useQuery({ queryKey: queryKeys.competitiveIntelligence, queryFn: ({ signal }) => competitiveApi.intelligence(signal) });

export const useContestReadiness = () =>
  useQuery({ queryKey: queryKeys.competitiveReadiness, queryFn: ({ signal }) => competitiveApi.readiness(signal) });

export const useContestCorrelation = () =>
  useQuery({ queryKey: queryKeys.competitiveCorrelation, queryFn: ({ signal }) => competitiveApi.correlation(signal) });

export const useCompetitiveInsights = () =>
  useQuery({ queryKey: queryKeys.competitiveInsights, queryFn: ({ signal }) => competitiveApi.insights(signal) });

export const useRatingAnalysis = () =>
  useQuery({ queryKey: queryKeys.competitiveRating, queryFn: ({ signal }) => competitiveApi.ratingAnalysis(signal) });
