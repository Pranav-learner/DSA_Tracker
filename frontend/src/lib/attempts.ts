import type { BadgeProps } from '@/components/ui/badge';
import type { AttemptLanguage, AttemptStatus, AttemptVerdict } from '@/types';

/** Option lists for the attempt form (mirror the backend enums). */
export const ATTEMPT_STATUSES: AttemptStatus[] = ['Started', 'Solved', 'Abandoned'];
export const ATTEMPT_VERDICTS: AttemptVerdict[] = [
  'Accepted',
  'Wrong Answer',
  'TLE',
  'MLE',
  'RE',
  'CE',
  'Unknown',
];
export const ATTEMPT_LANGUAGES: AttemptLanguage[] = [
  'C++',
  'C',
  'Python',
  'Java',
  'JavaScript',
  'TypeScript',
  'Go',
  'Rust',
  'Kotlin',
  'C#',
  'Other',
];

/** Badge variant for a verdict (green accepted, red wrong/RE/CE, amber limits). */
export function verdictVariant(verdict: AttemptVerdict): NonNullable<BadgeProps['variant']> {
  switch (verdict) {
    case 'Accepted':
      return 'success';
    case 'Wrong Answer':
    case 'RE':
    case 'CE':
      return 'danger';
    case 'TLE':
    case 'MLE':
      return 'warning';
    default:
      return 'outline';
  }
}

/** Badge variant for an attempt status. */
export function attemptStatusVariant(status: AttemptStatus): NonNullable<BadgeProps['variant']> {
  switch (status) {
    case 'Solved':
      return 'success';
    case 'Started':
      return 'warning';
    default:
      return 'outline';
  }
}

/** Human-friendly duration, e.g. 9 → "9m", 75 → "1h 15m". */
export function formatDuration(minutes: number): string {
  if (minutes <= 0) return '0m';
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h === 0) return `${m}m`;
  return m === 0 ? `${h}h` : `${h}h ${String(m).padStart(2, '0')}m`;
}

/** Format an ISO timestamp for display (date + short time), or a dash. */
export function formatDateTime(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
