import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Merge Tailwind classes with conditional support (shadcn convention). */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/** Pluralise a noun based on a count. */
export function plural(count: number, singular: string, pluralForm = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : pluralForm}`;
}

/** Time-of-day greeting for the dashboard hero. */
export function greeting(date = new Date()): string {
  const h = date.getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

/** Compact human hours label, e.g. 6 → "6h", 0.5 → "30m". */
export function formatHours(hours: number): string {
  if (hours <= 0) return '0h';
  if (hours < 1) return `${Math.round(hours * 60)}m`;
  return `${Math.round(hours)}h`;
}

/** Short relative time from an ISO string, e.g. "2h ago", "3d ago". */
export function relativeTime(iso: string, now = new Date()): string {
  const then = new Date(iso).getTime();
  const secs = Math.max(0, Math.round((now.getTime() - then) / 1000));
  if (secs < 60) return 'just now';
  const mins = Math.round(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.round(days / 7);
  return `${weeks}w ago`;
}
