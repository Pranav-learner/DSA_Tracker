import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

/** A single weakness item (contest reflection). */
export function WeaknessCard({ text, className }: { text: string; className?: string }) {
  return (
    <div className={cn('flex items-start gap-2 rounded-lg border border-l-4 border-l-warning border-border/60 bg-card/40 px-3 py-2 text-sm', className)}>
      <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" />
      {text}
    </div>
  );
}
