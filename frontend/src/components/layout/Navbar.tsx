import { Menu, Github, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NavbarProps {
  onToggleSidebar: () => void;
}

/** Top navigation bar with a mobile sidebar toggle and a placeholder search. */
export function Navbar({ onToggleSidebar }: NavbarProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/70 px-4 backdrop-blur-xl lg:px-6">
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={onToggleSidebar}
        aria-label="Toggle navigation"
      >
        <Menu className="size-5" />
      </Button>

      {/* Placeholder search — command palette arrives in a later sprint. */}
      <button
        type="button"
        disabled
        className="flex h-9 w-full max-w-sm cursor-not-allowed items-center gap-2 rounded-md border border-border bg-accent/40 px-3 text-sm text-muted-foreground"
      >
        <Search className="size-4" />
        <span>Search topics…</span>
        <kbd className="ml-auto rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px]">
          ⌘K
        </kbd>
      </button>

      <div className="ml-auto flex items-center gap-2">
        <Button variant="ghost" size="icon" asChild aria-label="GitHub">
          <a href="https://github.com" target="_blank" rel="noreferrer">
            <Github className="size-5" />
          </a>
        </Button>
        <div
          className="flex size-8 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary"
          title="Signed in (auth arrives in a later sprint)"
        >
          CP
        </div>
      </div>
    </header>
  );
}
