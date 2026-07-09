import type { ReactNode } from 'react';
import { Lock } from 'lucide-react';
import { CardContainer } from '@/components/common/CardContainer';
import { Badge } from '@/components/ui/badge';

interface PlaceholderCardProps {
  title: string;
  description: string;
  icon: ReactNode;
}

/**
 * "Coming soon" card for features that land in later sprints (Attempts,
 * Notebook, Mistakes, Confidence). Reused across the Problem Detail page so the
 * future layout is already visible.
 */
export function PlaceholderCard({ title, description, icon }: PlaceholderCardProps) {
  return (
    <CardContainer className="flex h-full flex-col gap-3 border-dashed">
      <div className="flex items-center justify-between">
        <span className="flex size-9 items-center justify-center rounded-lg border border-border bg-accent text-muted-foreground">
          {icon}
        </span>
        <Badge variant="outline">
          <Lock className="size-3" /> Coming soon
        </Badge>
      </div>
      <div>
        <h3 className="text-sm font-semibold">{title}</h3>
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      </div>
    </CardContainer>
  );
}
