import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Platform } from '@/types';

/** Brand-ish accent colour per platform (used as a small dot, not a loud fill). */
const PLATFORM_COLOR: Record<Platform, string> = {
  LeetCode: '#f89f1b',
  Codeforces: '#1f8acb',
  AtCoder: '#9ca3af',
  CSES: '#6366f1',
  HackerRank: '#22c55e',
  SPOJ: '#a855f7',
  GeeksforGeeks: '#2f8d46',
};

/** Colour-coded platform pill (dot + name), matching the badge design language. */
export function PlatformBadge({ platform, className }: { platform: Platform; className?: string }) {
  return (
    <Badge variant="outline" className={cn('gap-1.5', className)}>
      <span
        aria-hidden
        className="size-2 rounded-full"
        style={{ backgroundColor: PLATFORM_COLOR[platform] }}
      />
      {platform}
    </Badge>
  );
}
