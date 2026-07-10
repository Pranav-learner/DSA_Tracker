/** Sprint 4 — Dashboard component set (all reusable, design-system aligned). */
export { HeroCard } from './HeroCard';
export { TodaysLearningCard } from './TodaysLearningCard';
export { CurrentTopicCard } from './CurrentTopicCard';
export { ProgressSummaryCard } from './ProgressSummaryCard';
export { PhaseProgressCard } from './PhaseProgressCard';
export { RoadmapMiniView } from './RoadmapMiniView';
export { LearningInsightCard } from './LearningInsightCard';
// ActivityTimeline is intentionally NOT re-exported here: the dashboard lazy-loads
// it (import('./ActivityTimeline')) to code-split this below-the-fold section.
// Import it directly from './ActivityTimeline' if you need it statically.
export { DashboardMetricCard } from './DashboardMetricCard';
export { DashboardSection } from './DashboardSection';
export { DashboardGrid } from './DashboardGrid';
export { QuickActionButton } from './QuickActionButton';
// Sprint 4 — Learning-OS integration components.
export { LearningPlanCard } from './LearningPlanCard';
export { RevisionSummaryCard } from './RevisionSummaryCard';
export { LearningHealthCard } from './LearningHealthCard';
export { HealthIndicator } from './HealthIndicator';
export { KnowledgeSummaryCard } from './KnowledgeSummaryCard';
export { ProgressOverviewCard } from './ProgressOverviewCard';
export { RetentionSummaryCard } from './RetentionSummaryCard';
export { QuickActionsPanel } from './QuickActionsPanel';
// Module 6 · Sprint 1 — progression widget (self-fetches from the gamification API).
export { ProgressionDashboardCard } from './ProgressionDashboardCard';
// Module 6 · Sprint 2 — achievements / challenges / celebrations widget.
export { GamificationDashboardCard } from './GamificationDashboardCard';
// Module 7 · Sprint 2 — AI Mentor entry point (self-fetches from the AI workspace API).
export { AiMentorCard } from './AiMentorCard';
// Module 7 · Sprint 3 — specialized coaches entry point (self-fetches from the coach registry).
export { CoachEntryCard } from './CoachEntryCard';
