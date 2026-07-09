import { Sparkles, ShieldAlert, Award, Compass } from 'lucide-react';
import { AnalyticsSection, IntelInsightCard, StrengthCard, WeaknessCard, RecommendationCard } from '@/components/analytics';
import type { AnalyticsRecommendation, LearningInsight, Strength, Weakness } from '@/types';

/** Insights block for a report. */
export function InsightSection({ insights }: { insights: LearningInsight[] }) {
  if (insights.length === 0) return null;
  return (
    <AnalyticsSection title="Insights" icon={<Sparkles className="size-4" />}>
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {insights.map((i) => (
          <IntelInsightCard key={i.id} insight={i} />
        ))}
      </div>
    </AnalyticsSection>
  );
}

/** Strengths block for a report. */
export function StrengthSection({ strengths }: { strengths: Strength[] }) {
  if (strengths.length === 0) return null;
  return (
    <AnalyticsSection title="Strengths" icon={<Award className="size-4" />}>
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {strengths.slice(0, 6).map((s) => (
          <StrengthCard key={s.id} strength={s} />
        ))}
      </div>
    </AnalyticsSection>
  );
}

/** Weaknesses block for a report. */
export function WeaknessSection({ weaknesses }: { weaknesses: Weakness[] }) {
  if (weaknesses.length === 0) return null;
  return (
    <AnalyticsSection title="Weaknesses" icon={<ShieldAlert className="size-4" />}>
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {weaknesses.slice(0, 6).map((w) => (
          <WeaknessCard key={w.id} weakness={w} />
        ))}
      </div>
    </AnalyticsSection>
  );
}

/** Recommendations block for a report. */
export function RecommendationSection({ recommendations }: { recommendations: AnalyticsRecommendation[] }) {
  if (recommendations.length === 0) return null;
  return (
    <AnalyticsSection title="Recommendations" icon={<Compass className="size-4" />}>
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {recommendations.map((r) => (
          <RecommendationCard key={r.id} recommendation={r} />
        ))}
      </div>
    </AnalyticsSection>
  );
}
