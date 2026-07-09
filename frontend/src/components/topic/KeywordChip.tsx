import { Hash } from 'lucide-react';
import { cn } from '@/lib/utils';

/** A single recognition-keyword chip. */
export function KeywordChip({ label, className }: { label: string; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border border-border bg-accent/50 px-2.5 py-1 text-xs font-medium text-foreground/90 transition-colors hover:border-primary/40 hover:text-foreground',
        className,
      )}
    >
      <Hash className="size-3 text-primary/70" />
      {label}
    </span>
  );
}
