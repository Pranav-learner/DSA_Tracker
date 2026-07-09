import { cn } from '@/lib/utils';

interface TagChipProps {
  label: string;
  /** Optional click (e.g. filter by this tag). Renders as a button when set. */
  onClick?: () => void;
  className?: string;
}

/** Small, muted tag pill used on cards and the problem detail header. */
export function TagChip({ label, onClick, className }: TagChipProps) {
  const base =
    'inline-flex items-center rounded-md border border-border bg-accent/40 px-2 py-0.5 text-[11px] font-medium text-muted-foreground';
  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={cn(base, 'transition-colors hover:border-primary/40 hover:text-foreground', className)}
      >
        {label}
      </button>
    );
  }
  return <span className={cn(base, className)}>{label}</span>;
}
