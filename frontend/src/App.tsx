import { RouterProvider } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { Provider as ReduxProvider } from 'react-redux';
import { store } from '@/store';
import { queryClient } from '@/lib/queryClient';
import { router } from '@/router';
import { ErrorBoundary } from '@/components/ErrorBoundary';

/**
 * Provider composition:
 *   ErrorBoundary → Redux (UI state) → React Query (server state) → Router.
 */
export default function App() {
  return (
    <ErrorBoundary>
      <ReduxProvider store={store}>
        <QueryClientProvider client={queryClient}>
          <RouterProvider router={router} />
        </QueryClientProvider>
      </ReduxProvider>
    </ErrorBoundary>
  );
}
