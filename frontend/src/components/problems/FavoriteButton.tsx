import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FavoriteButtonProps {
  favorite: boolean;
  /** Size of the star icon in px-equivalent tailwind units. */
  className?: string;
}

/**
 * Favorite indicator. Read-only this sprint (the library is read-only) — it
 * reflects the seeded/stored state. Toggling arrives with UserProblem mutations
 * in Attempt Tracking (Sprint 2), at which point this becomes a button.
 */
export function FavoriteButton({ favorite, className }: FavoriteButtonProps) {
  return (
    <span
      role="img"
      aria-label={favorite ? 'Favorited' : 'Not favorited'}
      title={favorite ? 'Favorited' : 'Not favorited'}
      className={cn('inline-flex', className)}
    >
      <Star
        className={cn(
          'size-4 transition-colors',
          favorite ? 'fill-warning text-warning' : 'text-muted-foreground/40',
        )}
      />
    </span>
  );
}
