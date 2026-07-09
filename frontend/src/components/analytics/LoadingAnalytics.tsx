import { Skeleton } from '@/components/ui/skeleton';

/** Loading skeleton mirroring an analytics page (metric grid + panels). */
export function LoadingAnalytics({ metrics = 4, panels = 2 }: { metrics?: number; panels?: number }) {
  return (
    <div className="space-y-6">
      <Skeleton className="h-14 w-full rounded-lg" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: metrics }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-lg" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {Array.from({ length: panels }).map((_, i) => (
          <Skeleton key={i} className="h-56 w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}
