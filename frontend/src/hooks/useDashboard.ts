import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '@/api/dashboard.api';
import { queryKeys } from '@/lib/queryClient';

/**
 * Aggregated dashboard payload — one request powering the whole home screen
 * (current state, progress, recommendation, roadmap summary, recent activity).
 * Server state stays in React Query; nothing here leaks into Redux.
 */
export function useDashboard() {
  return useQuery({
    queryKey: queryKeys.dashboard,
    queryFn: ({ signal }) => dashboardApi.get(signal),
  });
}
