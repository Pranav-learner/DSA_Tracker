import { Skeleton } from '@/components/ui/skeleton';

/** Loading placeholder matching a chart body's footprint. */
export function LoadingChartSkeleton({ height = 220 }: { height?: number }) {
  return (
    <div className="flex flex-col justify-end gap-2" style={{ height }} aria-hidden>
      <div className="flex h-full items-end gap-2">
        {[60, 40, 75, 50, 85, 45, 70].map((h, i) => (
          <Skeleton key={i} className="flex-1 rounded-md" style={{ height: `${h}%` }} />
        ))}
      </div>
    </div>
  );
}
