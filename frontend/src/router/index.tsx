import { lazy, Suspense, type ReactNode } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { LoadingAnalytics } from '@/components/analytics/LoadingAnalytics';
import { DashboardPage } from '@/pages/DashboardPage';
import { RoadmapPage } from '@/pages/RoadmapPage';
import { PhasePage } from '@/pages/PhasePage';
import { TopicPage } from '@/pages/TopicPage';
import { ProblemsPage } from '@/pages/ProblemsPage';
import { ProblemDetailPage } from '@/pages/ProblemDetailPage';
import { ProblemPlaceholderPage } from '@/pages/ProblemPlaceholderPage';
import { NotebookListPage } from '@/pages/NotebookListPage';
import { NotebookWorkspacePage } from '@/pages/NotebookWorkspacePage';
import { RevisionPage } from '@/pages/RevisionPage';
import { RevisionWorkspacePage } from '@/pages/RevisionWorkspacePage';
import { RevisionHistoryPage } from '@/pages/RevisionHistoryPage';
import { RetentionPage } from '@/pages/RetentionPage';
import { NotFoundPage } from '@/pages/NotFoundPage';

// Analytics pages are lazy-loaded so the heavy charting library (Recharts) is
// code-split out of the main bundle and only fetched when analytics is visited.
const AnalyticsHome = lazy(() => import('@/pages/AnalyticsHome').then((m) => ({ default: m.AnalyticsHome })));
const LearningAnalytics = lazy(() => import('@/pages/LearningAnalytics').then((m) => ({ default: m.LearningAnalytics })));
const ProblemAnalytics = lazy(() => import('@/pages/ProblemAnalytics').then((m) => ({ default: m.ProblemAnalytics })));
const KnowledgeAnalytics = lazy(() => import('@/pages/KnowledgeAnalytics').then((m) => ({ default: m.KnowledgeAnalytics })));
const RevisionAnalytics = lazy(() => import('@/pages/RevisionAnalytics').then((m) => ({ default: m.RevisionAnalytics })));
const RetentionAnalytics = lazy(() => import('@/pages/RetentionAnalytics').then((m) => ({ default: m.RetentionAnalytics })));
const ActivityAnalytics = lazy(() => import('@/pages/ActivityAnalytics').then((m) => ({ default: m.ActivityAnalytics })));
// Module 4 · Sprint 3 — Pattern Intelligence pages (also lazy / chart-heavy).
const PatternIntelligence = lazy(() => import('@/pages/PatternIntelligence').then((m) => ({ default: m.PatternIntelligence })));
const PatternDetail = lazy(() => import('@/pages/PatternDetail').then((m) => ({ default: m.PatternDetail })));
const WeaknessReport = lazy(() => import('@/pages/WeaknessReport').then((m) => ({ default: m.WeaknessReport })));
const StrengthReport = lazy(() => import('@/pages/StrengthReport').then((m) => ({ default: m.StrengthReport })));
const LearningInsights = lazy(() => import('@/pages/LearningInsights').then((m) => ({ default: m.LearningInsights })));
const TrendAnalysis = lazy(() => import('@/pages/TrendAnalysis').then((m) => ({ default: m.TrendAnalysis })));
const RecommendationCenter = lazy(() => import('@/pages/RecommendationCenter').then((m) => ({ default: m.RecommendationCenter })));
// Module 4 · Sprint 4 — Executive dashboard + reports (chart-heavy, lazy).
const ExecutiveDashboard = lazy(() => import('@/pages/ExecutiveDashboard').then((m) => ({ default: m.ExecutiveDashboard })));
const WeeklyReport = lazy(() => import('@/pages/WeeklyReport').then((m) => ({ default: m.WeeklyReport })));
const MonthlyReport = lazy(() => import('@/pages/MonthlyReport').then((m) => ({ default: m.MonthlyReport })));
const LearningSummary = lazy(() => import('@/pages/LearningSummary').then((m) => ({ default: m.LearningSummary })));
const PhaseReport = lazy(() => import('@/pages/PhaseReport').then((m) => ({ default: m.PhaseReport })));
const ExportCenter = lazy(() => import('@/pages/ExportCenter').then((m) => ({ default: m.ExportCenter })));
// Module 5 · Sprint 1 — Contest engine (rating charts are chart-heavy, lazy).
const ContestDashboard = lazy(() => import('@/pages/ContestDashboard').then((m) => ({ default: m.ContestDashboard })));
const ContestLibrary = lazy(() => import('@/pages/ContestLibrary').then((m) => ({ default: m.ContestLibrary })));
const ContestDetail = lazy(() => import('@/pages/ContestDetail').then((m) => ({ default: m.ContestDetail })));
const ContestNew = lazy(() => import('@/pages/ContestNew').then((m) => ({ default: m.ContestNew })));
const RatingHistory = lazy(() => import('@/pages/RatingHistory').then((m) => ({ default: m.RatingHistory })));
const ContestStatistics = lazy(() => import('@/pages/ContestStatistics').then((m) => ({ default: m.ContestStatistics })));
// Module 5 · Sprint 2 — contest workspace.
const ContestWorkspacePage = lazy(() => import('@/pages/ContestWorkspacePage').then((m) => ({ default: m.ContestWorkspacePage })));
const ContestTimelinePage = lazy(() => import('@/pages/ContestTimelinePage').then((m) => ({ default: m.ContestTimelinePage })));
const ContestPerformancePage = lazy(() => import('@/pages/ContestPerformancePage').then((m) => ({ default: m.ContestPerformancePage })));
const ProblemBreakdownPage = lazy(() => import('@/pages/ProblemBreakdownPage').then((m) => ({ default: m.ProblemBreakdownPage })));
// Module 5 · Sprint 3 — contest learning.
const ContestLearningPage = lazy(() => import('@/pages/ContestLearningPage').then((m) => ({ default: m.ContestLearningPage })));
const UpsolveQueuePage = lazy(() => import('@/pages/UpsolveQueuePage').then((m) => ({ default: m.UpsolveQueuePage })));
// Module 5 · Sprint 4 — competitive intelligence dashboard.
const CompetitiveIntelligencePage = lazy(() => import('@/pages/CompetitiveIntelligencePage').then((m) => ({ default: m.CompetitiveIntelligencePage })));

/** Wrap a lazily-loaded analytics page in a Suspense skeleton fallback. */
function analyticsLazy(node: ReactNode): ReactNode {
  return <Suspense fallback={<LoadingAnalytics />}>{node}</Suspense>;
}

/**
 * Application routes.
 *   /               → redirect to /dashboard
 *   /dashboard      → Dashboard
 *   /roadmap        → Roadmap (all phases)
 *   /roadmap/:id    → Phase detail (topics)
 *   /topic/:id      → Topic Workspace (concept, pattern ladder, problems…)
 *   /topic/:id/problem/:pid → Representative-problem placeholder detail
 *   /problems       → Problem Library (searchable catalog)
 *   /problems/:id   → Problem Detail
 *   /notebook       → Pattern Notebook (knowledge index)
 *   /notebook/:id   → Notebook Workspace
 *   /revision          → Daily Revision hub
 *   /revision/session  → Revision Workspace (active review)
 *   /revision/history  → Revision History
 *   *                  → 404
 */
export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'roadmap', element: <RoadmapPage /> },
      { path: 'roadmap/:phaseId', element: <PhasePage /> },
      { path: 'topic/:topicId', element: <TopicPage /> },
      { path: 'topic/:topicId/problem/:problemId', element: <ProblemPlaceholderPage /> },
      { path: 'problems', element: <ProblemsPage /> },
      { path: 'problems/:problemId', element: <ProblemDetailPage /> },
      { path: 'notebook', element: <NotebookListPage /> },
      { path: 'notebook/:notebookId', element: <NotebookWorkspacePage /> },
      { path: 'revision', element: <RevisionPage /> },
      { path: 'revision/session', element: <RevisionWorkspacePage /> },
      { path: 'revision/history', element: <RevisionHistoryPage /> },
      { path: 'retention', element: <RetentionPage /> },
      { path: 'analytics', element: analyticsLazy(<AnalyticsHome />) },
      { path: 'analytics/learning', element: analyticsLazy(<LearningAnalytics />) },
      { path: 'analytics/problems', element: analyticsLazy(<ProblemAnalytics />) },
      { path: 'analytics/knowledge', element: analyticsLazy(<KnowledgeAnalytics />) },
      { path: 'analytics/revision', element: analyticsLazy(<RevisionAnalytics />) },
      { path: 'analytics/retention', element: analyticsLazy(<RetentionAnalytics />) },
      { path: 'analytics/activity', element: analyticsLazy(<ActivityAnalytics />) },
      // Pattern Intelligence (patterns/:id must come after the sibling static routes it doesn't clash with).
      { path: 'analytics/patterns', element: analyticsLazy(<PatternIntelligence />) },
      { path: 'analytics/patterns/:patternId', element: analyticsLazy(<PatternDetail />) },
      { path: 'analytics/weaknesses', element: analyticsLazy(<WeaknessReport />) },
      { path: 'analytics/strengths', element: analyticsLazy(<StrengthReport />) },
      { path: 'analytics/insights', element: analyticsLazy(<LearningInsights />) },
      { path: 'analytics/trends', element: analyticsLazy(<TrendAnalysis />) },
      { path: 'analytics/recommendations', element: analyticsLazy(<RecommendationCenter />) },
      // Executive dashboard + reports.
      { path: 'analytics/executive', element: analyticsLazy(<ExecutiveDashboard />) },
      { path: 'reports', element: analyticsLazy(<ExportCenter />) },
      { path: 'reports/weekly', element: analyticsLazy(<WeeklyReport />) },
      { path: 'reports/monthly', element: analyticsLazy(<MonthlyReport />) },
      { path: 'reports/summary', element: analyticsLazy(<LearningSummary />) },
      { path: 'reports/phase', element: analyticsLazy(<PhaseReport />) },
      { path: 'reports/phase/:phaseId', element: analyticsLazy(<PhaseReport />) },
      // Contest engine (static routes rank above /:id automatically).
      { path: 'contests', element: analyticsLazy(<ContestDashboard />) },
      { path: 'contests/library', element: analyticsLazy(<ContestLibrary />) },
      { path: 'contests/new', element: analyticsLazy(<ContestNew />) },
      { path: 'contests/ratings', element: analyticsLazy(<RatingHistory />) },
      { path: 'contests/stats', element: analyticsLazy(<ContestStatistics />) },
      { path: 'contests/intelligence', element: analyticsLazy(<CompetitiveIntelligencePage />) },
      { path: 'contests/:id', element: analyticsLazy(<ContestDetail />) },
      { path: 'contests/:id/workspace', element: analyticsLazy(<ContestWorkspacePage />) },
      { path: 'contests/:id/timeline', element: analyticsLazy(<ContestTimelinePage />) },
      { path: 'contests/:id/performance', element: analyticsLazy(<ContestPerformancePage />) },
      { path: 'contests/:id/problems', element: analyticsLazy(<ProblemBreakdownPage />) },
      { path: 'contests/:id/learning', element: analyticsLazy(<ContestLearningPage />) },
      { path: 'upsolve', element: analyticsLazy(<UpsolveQueuePage />) },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
]);
