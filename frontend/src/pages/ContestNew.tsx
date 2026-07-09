import { useNavigate, Link } from 'react-router-dom';
import { Plus, ArrowLeft } from 'lucide-react';
import { SectionHeader } from '@/components/common/SectionHeader';
import { Button } from '@/components/ui/button';
import { QuickAddContest } from '@/components/contest';

/** Add Contest — the manual data-entry form (Sprint 1). */
export function ContestNew() {
  const navigate = useNavigate();
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Button variant="ghost" size="sm" asChild>
        <Link to="/contests"><ArrowLeft className="size-4" /> Contests</Link>
      </Button>
      <SectionHeader eyebrow="Competitive Programming" title="Add Contest" description="Log a contest manually — ratings and stats update automatically." icon={<Plus className="size-5" />} />
      <QuickAddContest onDone={() => navigate('/contests/library')} />
    </div>
  );
}
