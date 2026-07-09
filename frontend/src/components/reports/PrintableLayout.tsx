import type { ReactNode } from 'react';
import { Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * PrintableLayout — wraps a report so it prints cleanly (chrome hidden via
 * `print:` utilities elsewhere) and offers a Print button that opens the
 * browser's native print-to-PDF dialog.
 */
export function PrintableLayout({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('mx-auto max-w-4xl space-y-6 print:max-w-none', className)}>{children}</div>;
}

/** A Print button — triggers the browser print dialog for the current report. */
export function PrintButton() {
  return (
    <Button variant="secondary" size="sm" onClick={() => window.print()}>
      <Printer className="size-4" /> Print
    </Button>
  );
}
