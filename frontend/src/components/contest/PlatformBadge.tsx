import { Badge } from '@/components/ui/badge';
import { PLATFORM_META } from '@/lib/contest';
import type { ContestPlatform } from '@/types';

/** Contest-platform badge with a platform-coloured dot. */
export function PlatformBadge({ platform, className }: { platform: ContestPlatform; className?: string }) {
  const meta = PLATFORM_META[platform];
  return (
    <Badge variant={meta.badge} className={className}>
      <span className="size-2 rounded-full" style={{ background: meta.color }} aria-hidden />
      {meta.label}
    </Badge>
  );
}
