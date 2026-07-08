import { Skeleton } from '@/components/ui/skeleton';
import { CardContainer } from './CardContainer';
import { cn } from '@/lib/utils';

/** A single card-shaped skeleton (phase or topic card). */
export function CardSkeleton({ className }: { className?: string }) {
  return (
    <CardContainer className={cn('space-y-4', className)}>
      <div className="flex items-center gap-3">
        <Skeleton className="size-11 rounded-lg" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      </div>
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-4/5" />
      <div className="flex gap-2 pt-1">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
    </CardContainer>
  );
}

interface LoadingSkeletonProps {
  /** Number of card skeletons to render. */
  count?: number;
  /** Layout: stacked list or responsive grid. */
  layout?: 'list' | 'grid';
  className?: string;
}

/** Grid/list of card skeletons for page-level loading states. */
export function LoadingSkeleton({ count = 6, layout = 'grid', className }: LoadingSkeletonProps) {
  return (
    <div
      className={cn(
        layout === 'grid'
          ? 'grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3'
          : 'flex flex-col gap-4',
        className,
      )}
    >
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}
