import { useEffect, useState } from 'react';
import { Search, X } from 'lucide-react';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { cn } from '@/lib/utils';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

/**
 * Debounced search input. Keeps a snappy local value while emitting `onChange`
 * only after typing settles (300ms), so the query doesn't fire per keystroke.
 */
export function SearchBar({ value, onChange, placeholder = 'Search…', className }: SearchBarProps) {
  const [local, setLocal] = useState(value);
  const debounced = useDebouncedValue(local, 300);

  // Emit settled changes upward.
  useEffect(() => {
    onChange(debounced);
  }, [debounced, onChange]);

  // Reflect external resets (e.g. "Clear filters").
  useEffect(() => {
    setLocal(value);
  }, [value]);

  return (
    <div
      className={cn(
        'flex h-10 items-center gap-2 rounded-md border border-border bg-card/60 px-3 backdrop-blur-sm focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-ring/40',
        className,
      )}
    >
      <Search className="size-4 shrink-0 text-muted-foreground" />
      <input
        type="text"
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        placeholder={placeholder}
        aria-label="Search problems"
        className="h-full w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
      />
      {local && (
        <button
          type="button"
          onClick={() => setLocal('')}
          aria-label="Clear search"
          className="shrink-0 rounded p-0.5 text-muted-foreground hover:text-foreground"
        >
          <X className="size-4" />
        </button>
      )}
    </div>
  );
}
