import { cn } from '@/lib/utils';
import type { ProviderId, ProviderInfo } from '@/types';

interface ProviderSelectorProps {
  providers: ProviderInfo[];
  value: ProviderId;
  onChange: (value: ProviderId) => void;
  className?: string;
}

/**
 * ProviderSelector — choose the LLM provider. Unavailable providers (no key /
 * placeholder) are shown but labelled, since the gateway will gracefully fall
 * back to an available one if selected.
 */
export function ProviderSelector({ providers, value, onChange, className }: ProviderSelectorProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as ProviderId)}
      className={cn(
        'rounded-md border border-border bg-background px-2.5 py-1.5 text-sm outline-none focus:border-primary/50',
        className,
      )}
    >
      {providers.map((p) => (
        <option key={p.id} value={p.id}>
          {p.label}
          {p.available ? '' : ' · offline'}
        </option>
      ))}
    </select>
  );
}
