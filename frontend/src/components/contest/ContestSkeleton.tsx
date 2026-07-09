import { Skeleton } from '@/components/ui/skeleton';

/** Loading skeleton for the contest library (table variant) or grid. */
export function ContestSkeleton({ rows = 6, variant = 'table' }: { rows?: number; variant?: 'table' | 'grid' }) {
  if (variant === 'grid') {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full rounded-lg" />
        ))}
      </div>
    );
  }
  return (
    <div className="space-y-2">
      <Skeleton className="h-10 w-full rounded-lg" />
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full rounded-lg" />
      ))}
    </div>
  );
}
