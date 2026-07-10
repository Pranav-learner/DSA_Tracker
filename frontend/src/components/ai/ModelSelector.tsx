import { cn } from '@/lib/utils';
import type { ModelInfo } from '@/types';

interface ModelSelectorProps {
  models: ModelInfo[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
}

/** ModelSelector — choose the model within the selected provider. */
export function ModelSelector({ models, value, onChange, className, disabled }: ModelSelectorProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled || models.length === 0}
      className={cn(
        'rounded-md border border-border bg-background px-2.5 py-1.5 text-sm outline-none focus:border-primary/50 disabled:opacity-50',
        className,
      )}
    >
      {models.map((m) => (
        <option key={m.id} value={m.id}>
          {m.label}
        </option>
      ))}
    </select>
  );
}
