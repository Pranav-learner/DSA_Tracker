import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { DashboardPage } from '@/pages/DashboardPage';
import { RoadmapPage } from '@/pages/RoadmapPage';
import { PhasePage } from '@/pages/PhasePage';
import { TopicPage } from '@/pages/TopicPage';
import { NotFoundPage } from '@/pages/NotFoundPage';

/**
 * Application routes.
 *   /               → redirect to /dashboard
 *   /dashboard      → Dashboard
 *   /roadmap        → Roadmap (all phases)
 *   /roadmap/:id    → Phase detail (topics)
 *   /topic/:id      → Topic detail (placeholder modules)
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
    ],
  },
  { path: '*', element: <NotFoundPage /> },
]);
