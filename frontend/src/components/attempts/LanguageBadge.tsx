import { Code2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { AttemptLanguage } from '@/types';

/** Language pill for an attempt. */
export function LanguageBadge({ language, className }: { language: AttemptLanguage; className?: string }) {
  return (
    <Badge variant="outline" className={className}>
      <Code2 className="size-3" /> {language}
    </Badge>
  );
}
