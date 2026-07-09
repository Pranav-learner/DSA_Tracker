import { LearningRecommendationCard } from '@/components/learning/LearningRecommendationCard';
import type { Recommendation } from '@/types';

/**
 * Recommendation panel — the learner's next best action in the workspace.
 * Reuses the Module 1 recommendation card so it stays consistent everywhere.
 */
export function RecommendationPanel({ recommendation }: { recommendation: Recommendation }) {
  return <LearningRecommendationCard recommendation={recommendation} />;
}
