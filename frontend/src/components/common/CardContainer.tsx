import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface CardContainerProps {
  children?: ReactNode;
  className?: string;
  /** Adds a hover lift — use for interactive/clickable containers. */
  interactive?: boolean;
}

/**
 * Generic surface container with the app's border/blur/shadow language.
 * The building block for section panels and custom cards.
 */
export function CardContainer({ children, className, interactive }: CardContainerProps) {
  return (
    <div
      className={cn(
        'rounded-lg border border-border bg-card/60 p-5 shadow-card backdrop-blur-sm',
        interactive &&
          'transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-glow',
        className,
      )}
    >
      {children}
    </div>
  );
}
