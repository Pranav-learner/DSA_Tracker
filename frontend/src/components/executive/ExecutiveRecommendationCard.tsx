import { Compass } from 'lucide-react';
import { CardContainer } from '@/components/common/CardContainer';
import { RecommendationCard } from '@/components/analytics';
import { EmptyAnalytics } from '@/components/analytics';
import type { AnalyticsRecommendation } from '@/types';

/** Executive recommendation summary — the top prioritised next steps. */
export function ExecutiveRecommendationCard({ recommendations }: { recommendations: AnalyticsRecommendation[] }) {
  return (
    <CardContainer className="space-y-3">
      <h3 className="inline-flex items-center gap-2 text-sm font-semibold">
        <Compass className="size-4 text-primary" /> Recommendation Summary
      </h3>
      {recommendations.length === 0 ? (
        <EmptyAnalytics title="Nothing pressing" description="You're on track — no urgent recommendations." />
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {recommendations.slice(0, 3).map((r) => (
            <RecommendationCard key={r.id} recommendation={r} />
          ))}
        </div>
      )}
    </CardContainer>
  );
}
