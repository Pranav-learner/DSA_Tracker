import { Link } from 'react-router-dom';
import { Compass, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
      <div className="flex size-16 items-center justify-center rounded-2xl border border-border bg-card text-primary shadow-glow">
        <Compass className="size-8" />
      </div>
      <div>
        <p className="font-mono text-sm text-muted-foreground">404</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">Page not found</h1>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          The page you’re looking for doesn’t exist or has been moved.
        </p>
      </div>
      <div className="flex gap-3">
        <Button variant="secondary" asChild>
          <Link to="/dashboard">
            <ArrowLeft className="size-4" /> Dashboard
          </Link>
        </Button>
        <Button asChild>
          <Link to="/roadmap">Go to Roadmap</Link>
        </Button>
      </div>
    </div>
  );
}
