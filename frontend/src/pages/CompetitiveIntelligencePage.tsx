import { Swords } from 'lucide-react';
import { useCompetitiveIntelligence } from '@/hooks/useCompetitive';
import { SectionHeader } from '@/components/common/SectionHeader';
import { ErrorState } from '@/components/common/ErrorState';
import { ContestSkeleton, ContestEmptyState } from '@/components/contest';
import { CompetitiveDashboard } from '@/components/contest/competitive';

/**
 * Competitive Intelligence — the flagship dashboard that explains WHY contest
 * performance moves: overall standing, rating analysis, contest readiness,
 * learning↔outcome correlation, improvement opportunities and recommendations.
 */
export function CompetitiveIntelligencePage() {
  const { data, isLoading, isError, error, refetch } = useCompetitiveIntelligence();

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Competitive Programming"
        title="Competitive Intelligence"
        description="How your learning translates into contest results — and what to do next."
        icon={<Swords className="size-5" />}
      />

      {isError ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : isLoading || !data ? (
        <ContestSkeleton variant="grid" rows={8} />
      ) : data.ratingAnalysis.ratedContests === 0 && data.summary.currentRating === null ? (
        <ContestEmptyState
          title="No competitive data yet"
          description="Log a few rated contests to unlock rating analysis, readiness scoring and correlation insights."
        />
      ) : (
        <CompetitiveDashboard data={data} />
      )}
    </div>
  );
}
