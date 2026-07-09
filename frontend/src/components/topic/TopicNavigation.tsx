import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, LayoutGrid, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CardContainer } from '@/components/common/CardContainer';
import type { TopicNavigation as TopicNav } from '@/types';

interface TopicNavigationProps {
  navigation: TopicNav;
  phaseId: string;
}

/**
 * Previous / Next / Back-to-Phase / Continue navigation.
 * Supports ← and → arrow keys for prev/next (ignored while typing).
 */
export function TopicNavigation({ navigation, phaseId }: TopicNavigationProps) {
  const navigate = useNavigate();
  const { previous, next } = navigation;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
      if (e.key === 'ArrowLeft' && previous) navigate(`/topic/${previous.id}`);
      if (e.key === 'ArrowRight' && next) navigate(`/topic/${next.id}`);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [previous, next, navigate]);

  // "Continue Learning" goes to the next topic, or back to the phase at the end.
  const continueTo = next ? `/topic/${next.id}` : `/roadmap/${phaseId}`;

  return (
    <CardContainer className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap gap-2">
        <Button
          variant="secondary"
          size="sm"
          disabled={!previous}
          onClick={() => previous && navigate(`/topic/${previous.id}`)}
          title={previous ? `Previous: ${previous.title} (←)` : 'No previous topic'}
        >
          <ArrowLeft className="size-4" />
          <span className="hidden sm:inline">{previous ? previous.title : 'Previous'}</span>
          <span className="sm:hidden">Prev</span>
        </Button>
        <Button variant="ghost" size="sm" onClick={() => navigate(`/roadmap/${phaseId}`)}>
          <LayoutGrid className="size-4" /> Back to Phase
        </Button>
        <Button
          variant="secondary"
          size="sm"
          disabled={!next}
          onClick={() => next && navigate(`/topic/${next.id}`)}
          title={next ? `Next: ${next.title} (→)` : 'No next topic'}
        >
          <span className="hidden sm:inline">{next ? next.title : 'Next'}</span>
          <span className="sm:hidden">Next</span>
          <ArrowRight className="size-4" />
        </Button>
      </div>

      <Button size="sm" onClick={() => navigate(continueTo)}>
        <Play className="size-4" /> Continue Learning
      </Button>
    </CardContainer>
  );
}
