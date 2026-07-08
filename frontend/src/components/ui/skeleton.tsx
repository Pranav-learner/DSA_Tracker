import { cn } from '@/lib/utils';

/** Base shimmer block used to build loading states. */
export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('shimmer rounded-md bg-muted/60', className)} {...props} />;
}
