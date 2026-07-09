import { Badge } from '@/components/ui/badge';

/** Division / series badge (renders nothing when there's no division). */
export function DivisionBadge({ division, className }: { division: string; className?: string }) {
  if (!division) return null;
  return (
    <Badge variant="outline" className={className}>
      {division}
    </Badge>
  );
}
