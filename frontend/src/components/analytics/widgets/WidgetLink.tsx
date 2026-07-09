import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

/** "Explore →" deep-link used as a chart/widget header action. */
export function WidgetLink({ to, label = 'Explore' }: { to: string; label?: string }) {
  return (
    <Link to={to} className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
      {label} <ArrowRight className="size-3" />
    </Link>
  );
}
