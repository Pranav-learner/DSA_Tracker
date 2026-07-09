import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Contest search input (controlled). */
export function ContestSearch({
  value,
  onChange,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  className?: string;
}) {
  return (
    <div className={cn('relative', className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search contests…"
        aria-label="Search contests"
        className="h-9 w-full rounded-lg border border-border bg-card/60 pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-primary/50 focus-visible:ring-2 focus-visible:ring-primary/30"
      />
    </div>
  );
}
