import { Trophy, Gauge, Link2, TrendingUp, Lightbulb, Sparkles, Star, Target } from 'lucide-react';
import { AnalyticsSection, AnalyticsGrid, StrengthCard, WeaknessCard } from '@/components/analytics';
import { PerformanceSummaryCard } from './PerformanceSummaryCard';
import { RatingTrendCard } from './RatingTrendCard';
import { RatingStatisticsCard } from './RatingStatisticsCard';
import { ContestReadinessCard } from './ContestReadinessCard';
import { PerformanceCorrelationChart } from './PerformanceCorrelationChart';
import { CorrelationMatrix } from './CorrelationMatrix';
import { CompetitiveInsightCard } from './CompetitiveInsightCard';
import { ImprovementOpportunityCard } from './ImprovementOpportunityCard';
import { RecommendationPanel } from './RecommendationPanel';
import { TrendComparisonCard } from './TrendComparisonCard';
import type { CompetitiveIntelligence } from '@/types';

const OPPORTUNITY_TYPES = new Set(['opportunity', 'improvement', 'focus', 'weakness']);

/** The full Competitive Intelligence dashboard — every analytics section in one view. */
export function CompetitiveDashboard({ data }: { data: CompetitiveIntelligence }) {
  const opportunities = data.insights.filter((i) => OPPORTUNITY_TYPES.has(i.type)).slice(0, 4);
  return (
    <div className="space-y-8">
      <AnalyticsSection title="Overall Performance" icon={<Trophy className="size-5" />} description="How your competitive standing looks right now">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2"><PerformanceSummaryCard summary={data.summary} /></div>
          <RatingTrendCard rating={data.ratingAnalysis} />
        </div>
      </AnalyticsSection>

      <AnalyticsSection title="Rating Analysis" icon={<Star className="size-5" />} description="Rating history, growth and per-platform standing">
        <div className="space-y-4">
          <RatingStatisticsCard rating={data.ratingAnalysis} />
          <TrendComparisonCard rating={data.ratingAnalysis} />
        </div>
      </AnalyticsSection>

      <AnalyticsSection title="Contest Readiness" icon={<Gauge className="size-5" />} description="Six weighted signals that gauge contest preparedness">
        <ContestReadinessCard readiness={data.readiness} />
      </AnalyticsSection>

      <AnalyticsSection title="Performance Correlation" icon={<Link2 className="size-5" />} description="How learning behaviour lines up with contest outcomes">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <PerformanceCorrelationChart correlation={data.correlation} />
          <CorrelationMatrix correlation={data.correlation} />
        </div>
      </AnalyticsSection>

      {opportunities.length > 0 && (
        <AnalyticsSection title="Improvement Opportunities" icon={<Target className="size-5" />} description="The highest-leverage gaps to close next">
          <AnalyticsGrid cols={2}>
            {opportunities.map((o) => <ImprovementOpportunityCard key={o.id} insight={o} />)}
          </AnalyticsGrid>
        </AnalyticsSection>
      )}

      {(data.strengths.length > 0 || data.weaknesses.length > 0) && (
        <AnalyticsSection title="Learning Impact" icon={<TrendingUp className="size-5" />} description="Strengths powering your results and weaknesses holding them back">
          <AnalyticsGrid cols={2}>
            {data.strengths.map((s) => <StrengthCard key={s.id} strength={s} />)}
            {data.weaknesses.map((w) => <WeaknessCard key={w.id} weakness={w} />)}
          </AnalyticsGrid>
        </AnalyticsSection>
      )}

      {data.insights.length > 0 && (
        <AnalyticsSection title="Competitive Insights" icon={<Lightbulb className="size-5" />} description="What the data says about your performance">
          <AnalyticsGrid cols={2}>
            {data.insights.map((i) => <CompetitiveInsightCard key={i.id} insight={i} />)}
          </AnalyticsGrid>
        </AnalyticsSection>
      )}

      <AnalyticsSection title="Recommendations" icon={<Sparkles className="size-5" />} description="Contest-aware next actions, prioritised by impact">
        <RecommendationPanel recommendations={data.recommendations} />
      </AnalyticsSection>
    </div>
  );
}
