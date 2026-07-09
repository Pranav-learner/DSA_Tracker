import { useParams } from 'react-router-dom';
import { ContestWorkspace } from '@/components/contest/workspace';
import { ContestEmptyState } from '@/components/contest';

/** Contest Workspace — the full performance-analysis workspace for one contest. */
export function ContestWorkspacePage() {
  const { id } = useParams<{ id: string }>();
  if (!id) return <ContestEmptyState title="Contest not found" description="No contest selected." />;
  return <ContestWorkspace contestId={id} />;
}
