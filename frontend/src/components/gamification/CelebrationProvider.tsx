import { useCallback, useEffect, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { useCelebrations, useMarkCelebrationsSeen } from '@/hooks/useGamification';
import { enqueueCelebrations, advanceCelebration, dismissCelebration } from '@/store/slices/gamificationSlice';
import { CelebrationModal } from './CelebrationModal';
import { AchievementToast } from './AchievementToast';
import type { Celebration } from '@/types';

/** Major moments get the centre-stage modal; everything else a corner toast. */
function isMajor(c: Celebration): boolean {
  if (c.type === 'level-up' || c.type === 'milestone-reached') return true;
  if (c.type === 'achievement-unlocked') return c.rarity === 'Epic' || c.rarity === 'Legendary';
  return false;
}

/**
 * CelebrationProvider — mounts once at the app shell and drives the celebration
 * queue: it polls for unseen celebrations, shows each once (a modal for major
 * moments, a toast for the rest), and acknowledges them server-side so they never
 * re-fire. On first load it silently baselines the historical backlog, so only
 * celebrations earned *while the app is open* pop up — no spam, per the design
 * brief ("do not overuse effects").
 */
export function CelebrationProvider() {
  const dispatch = useAppDispatch();
  const active = useAppSelector((s) => s.gamification.activeCelebration);
  const queueLength = useAppSelector((s) => s.gamification.celebrationQueue.length);
  const { data } = useCelebrations({ unseen: true, limit: 20 }, { poll: true });
  const markSeen = useMarkCelebrationsSeen();
  const baselined = useRef(false);

  // Baseline historical unseen once; enqueue anything new on later polls.
  useEffect(() => {
    if (!data) return;
    if (!baselined.current) {
      baselined.current = true;
      if (data.length > 0) markSeen.mutate(undefined);
      return;
    }
    if (data.length > 0) dispatch(enqueueCelebrations(data));
    // markSeen is a stable mutation handle; intentionally excluded from deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, dispatch]);

  // Promote the next queued celebration into the active slot when free.
  useEffect(() => {
    if (!active && queueLength > 0) dispatch(advanceCelebration());
  }, [active, queueLength, dispatch]);

  const handleClose = useCallback(() => {
    if (active) markSeen.mutate([active.id]);
    dispatch(dismissCelebration());
  }, [active, dispatch, markSeen]);

  const major = active ? isMajor(active) : false;

  return (
    <>
      <AnimatePresence>
        {active && major && <CelebrationModal key={active.id} celebration={active} onClose={handleClose} />}
      </AnimatePresence>

      <div className="pointer-events-none fixed right-4 top-20 z-[100] flex flex-col gap-2">
        <AnimatePresence>
          {active && !major && <AchievementToast key={active.id} celebration={active} onClose={handleClose} />}
        </AnimatePresence>
      </div>
    </>
  );
}
