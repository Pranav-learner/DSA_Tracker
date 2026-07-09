import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { DashboardPage } from '@/pages/DashboardPage';
import { RoadmapPage } from '@/pages/RoadmapPage';
import { PhasePage } from '@/pages/PhasePage';
import { TopicPage } from '@/pages/TopicPage';
import { ProblemsPage } from '@/pages/ProblemsPage';
import { ProblemDetailPage } from '@/pages/ProblemDetailPage';
import { ProblemPlaceholderPage } from '@/pages/ProblemPlaceholderPage';
import { NotebookListPage } from '@/pages/NotebookListPage';
import { NotebookWorkspacePage } from '@/pages/NotebookWorkspacePage';
import { NotFoundPage } from '@/pages/NotFoundPage';

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
 *   *               → 404
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
    ],
  },
  { path: '*', element: <NotFoundPage /> },
]);
