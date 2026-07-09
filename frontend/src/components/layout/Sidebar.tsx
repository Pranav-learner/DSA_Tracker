import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Map, LibraryBig, BrainCircuit, CalendarClock, Sparkles, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  to: string;
  label: string;
  icon: typeof Map;
  disabled?: boolean;
}

/** Primary navigation. Locked items are Sprint 2+ modules, shown for context. */
const NAV: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/roadmap', label: 'Roadmap', icon: Map },
  { to: '/problems', label: 'Problems', icon: LibraryBig },
  { to: '/notebook', label: 'Notebook', icon: BrainCircuit },
  { to: '/revision', label: 'Revision', icon: CalendarClock },
];

const FUTURE: NavItem[] = [{ to: '#', label: 'Analytics', icon: Sparkles, disabled: true }];

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <aside className="flex h-full w-64 flex-col border-r border-border bg-surface/80 backdrop-blur-xl">
      {/* Brand */}
      <div className="flex h-16 items-center gap-2.5 border-b border-border px-5">
        <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-glow">
          <span className="font-mono text-sm font-bold">{'</>'}</span>
        </div>
        <div className="leading-tight">
          <p className="text-sm font-semibold tracking-tight">CP-OS</p>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Learning Engine</p>
        </div>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto p-3">
        <div className="space-y-1">
          <p className="px-3 py-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Learn
          </p>
          {NAV.map(({ to, label, icon: IconCmp }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onNavigate}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-accent text-foreground'
                    : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground',
                )
              }
            >
              <IconCmp className="size-4" />
              {label}
            </NavLink>
          ))}
        </div>

        <div className="space-y-1">
          <p className="px-3 py-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Coming soon
          </p>
          {FUTURE.map(({ label, icon: IconCmp }) => (
            <span
              key={label}
              className="flex cursor-not-allowed items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground/50"
              title="Available in a future sprint"
            >
              <IconCmp className="size-4" />
              {label}
              <Lock className="ml-auto size-3" />
            </span>
          ))}
        </div>
      </nav>

      <div className="border-t border-border p-4">
        <p className="text-[11px] text-muted-foreground">
          Module 3 · Revision Engine
        </p>
      </div>
    </aside>
  );
}
