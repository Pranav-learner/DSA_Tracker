import { CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

/** A single strength item (contest reflection). */
export function StrengthCard({ text, className }: { text: string; className?: string }) {
  return (
    <div className={cn('flex items-start gap-2 rounded-lg border border-l-4 border-l-success border-border/60 bg-card/40 px-3 py-2 text-sm', className)}>
      <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
      {text}
    </div>
  );
}
