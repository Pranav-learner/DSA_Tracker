import type { ReactNode } from 'react';
import { Swords } from 'lucide-react';
import { EmptyState } from '@/components/common/EmptyState';

/** Empty state for the contest library / rating views. */
export function ContestEmptyState({
  title = 'No contests yet',
  description = 'Add your first contest to start tracking your rating journey.',
  action,
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
}) {
  return <EmptyState icon={<Swords className="size-6" />} title={title} description={description} action={action} />;
}
